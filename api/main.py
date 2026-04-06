from __future__ import annotations

from datetime import date, datetime, timedelta
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

from models import (
    CheckinRequest,
    MultiOnboardingRequest,
    OnboardingRequest,
    RescheduleRequest,
    SessionCompleteRequest,
)
from store import (
    create_user,
    get_user,
    save_schedule,
    get_current_schedule,
    get_progress,
    mark_session_complete,
    reschedule_sessions,
)
from services.deepseek_client import deepseek_weekly_schedule, deepseek_weekly_summary
from services.adaptation import (
    adapt_for_mood,
    reschedule_for_constraint,
)

app = FastAPI(title="Dynamic Learning Scheduler API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def _goal_label(goal: str, index: int) -> str:
    words = [w for w in goal.strip().split() if w]
    if not words:
        return f"Plan {index + 1}"
    return " ".join(words[:3])


def _merge_plan_sessions(plan_results: list[tuple[str, list[dict]]]) -> list[dict]:
    merged: list[dict] = []
    for plan_label, sessions in plan_results:
        for session in sessions:
            merged.append(
                {
                    **session,
                    "topic": f"[{plan_label}] {session['topic']}",
                }
            )

    merged.sort(key=lambda item: (item.get("scheduled_date", ""), str(item.get("topic", ""))))
    for idx, session in enumerate(merged):
        session["id"] = idx

    return merged


@app.get("/health")
def health():
    return {"ok": True, "service": "dynamic-learning-scheduler-api"}


@app.post("/api/onboard")
def onboard(req: OnboardingRequest):
    """Create user and generate initial schedule."""
    user = create_user(req.model_dump())

    sessions, source, source_error = deepseek_weekly_schedule(
        goal=req.goal,
        deadline=req.deadline,
        hours_per_day=req.hours_per_day,
        skill_level=req.skill_level,
        learning_style=req.learning_style,
        start_date=date.today(),
    )

    schedule = save_schedule(user["id"], sessions)

    return {
        "user": user,
        "schedule": schedule,
        "schedule_source": source,
        "schedule_warning": source_error,
    }


@app.post("/api/onboard-multi")
def onboard_multi(req: MultiOnboardingRequest):
    """Create user and generate a merged schedule from multiple plans."""
    total_hours = sum(plan.hours_per_day for plan in req.plans)
    if total_hours > 12:
        raise HTTPException(
            status_code=400,
            detail=f"Total allocated hours/day is {total_hours:.1f}. Keep total at 12 or less.",
        )

    combined_goal = " | ".join(plan.goal.strip() for plan in req.plans)
    latest_deadline = max(plan.deadline for plan in req.plans)

    user = create_user(
        {
            "name": req.name,
            "goal": combined_goal,
            "deadline": latest_deadline.isoformat(),
            "hours_per_day": total_hours,
            "learning_style": "mixed",
            "skill_level": "mixed",
            "plan_count": len(req.plans),
        }
    )

    plan_results: list[tuple[str, list[dict]]] = []
    warnings: list[str] = []
    sources: list[str] = []

    for index, plan in enumerate(req.plans):
        sessions, source, source_error = deepseek_weekly_schedule(
            goal=plan.goal,
            deadline=plan.deadline,
            hours_per_day=plan.hours_per_day,
            skill_level=plan.skill_level,
            learning_style=plan.learning_style,
            start_date=date.today(),
        )
        plan_results.append((_goal_label(plan.goal, index), sessions))
        sources.append(source)
        if source_error:
            warnings.append(source_error)

    merged_sessions = _merge_plan_sessions(plan_results)
    schedule = save_schedule(user["id"], merged_sessions)

    return {
        "user": user,
        "schedule": schedule,
        "schedule_source": ", ".join(sorted(set(sources))),
        "schedule_warning": " | ".join(warnings) if warnings else None,
    }


@app.get("/api/schedule/{user_id}")
def get_schedule(user_id: str):
    """Get current week's schedule."""
    schedule = get_current_schedule(user_id)
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")
    return schedule


@app.get("/api/today/{user_id}")
def get_today_focus(user_id: str):
    """Get today's session focus."""
    schedule = get_current_schedule(user_id)
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")

    today = date.today().isoformat()
    today_sessions = [s for s in schedule["sessions"] if s["scheduled_date"] == today]

    if today_sessions:
        return {"session": today_sessions[0], "all_today": today_sessions}

    return {"session": None, "message": "No sessions today"}


@app.post("/api/checkin")
def checkin(req: CheckinRequest):
    """Daily mood check-in."""
    schedule = get_current_schedule(req.user_id)
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")

    # Adapt schedule based on mood
    adapted = adapt_for_mood(schedule["sessions"], req.mood)
    schedule["sessions"] = adapted

    return {
        "check_in": {"mood": req.mood, "timestamp": datetime.now().isoformat()},
        "adapted_schedule": schedule,
        "tip": f"Feeling {req.mood}? We've adjusted your session intensity accordingly.",
    }


@app.post("/api/session/complete")
def mark_complete(req: SessionCompleteRequest):
    """Mark session as completed."""
    result = mark_session_complete(req.user_id, req.session_index, req.mood, req.notes or "")
    progress = get_progress(req.user_id)

    if not result:
        raise HTTPException(status_code=404, detail="Session not found")

    return {
        "session": result,
        "progress": progress,
        "message": f"Great job! Your streak is now {progress['current_streak']} days.",
    }


@app.get("/api/progress/{user_id}")
def get_progress_view(user_id: str):
    """Get user progress and weekly summary."""
    progress = get_progress(user_id)
    schedule = get_current_schedule(user_id)

    if not progress:
        raise HTTPException(status_code=404, detail="Progress not found")

    ai_summary = deepseek_weekly_summary(progress, schedule["sessions"] if schedule else [])

    return {
        "progress": progress,
        "weekly_summary": ai_summary,
    }


@app.post("/api/reschedule")
def reschedule(req: RescheduleRequest):
    """Dynamically reschedule based on constraint."""
    schedule = get_current_schedule(req.user_id)
    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")

    sessions = schedule["sessions"]
    available = req.available_minutes or 60
    new_sessions = reschedule_for_constraint(sessions, available, req.days_unavailable)

    updated_schedule = reschedule_sessions(req.user_id, new_sessions)

    return {
        "updated_schedule": updated_schedule,
        "reason": req.reason,
        "message": f"Schedule adjusted! You now have {len(new_sessions)} sessions.",
    }


@app.get("/api/dashboard/{user_id}")
def dashboard(user_id: str):
    """Get dashboard data."""
    user = get_user(user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")

    schedule = get_current_schedule(user_id)
    progress = get_progress(user_id)

    if not schedule:
        raise HTTPException(status_code=404, detail="Schedule not found")

    # Calculate topic breakdown
    topics = {}
    for session in schedule["sessions"]:
        topic = session["topic"]
        topics.setdefault(topic, {"total": 0, "completed": 0})
        topics[topic]["total"] += 1
        if session["completed"]:
            topics[topic]["completed"] += 1

    topic_progress = [
        {"topic": t, "pct": int((v["completed"] / v["total"]) * 100) if v["total"] > 0 else 0}
        for t, v in topics.items()
    ]

    return {
        "user": {"name": user["name"], "goal": user["goal"]},
        "progress": progress,
        "topic_progress": topic_progress,
        "sessions_today": [s for s in schedule["sessions"] if s["scheduled_date"] == date.today().isoformat()],
    }

