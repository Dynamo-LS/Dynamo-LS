from __future__ import annotations

from datetime import date, timedelta
from typing import Any, Optional


def generate_weekly_schedule(user_profile: dict, goal_analysis: dict) -> list[dict]:
    """Generate a spaced repetition schedule based on user profile and goal."""
    hours_per_day = user_profile["hours_per_day"]

    subtopics = goal_analysis.get("subtopics", [])
    if not subtopics:
        subtopics = [
            {"topic": "Fundamentals", "hours": 2, "type": "learn"},
            {"topic": "Core Concepts", "hours": 2, "type": "learn"},
            {"topic": "Practice Project", "hours": 1.5, "type": "practice"},
            {"topic": "Review", "hours": 1, "type": "review"},
        ]

    sessions = []
    session_id = 0
    topic_cursor = 0

    # Distribute sessions across the week with a realistic load.
    for day in range(7):
        current_date = date.today() + timedelta(days=day)
        daily_minutes = int(hours_per_day * 60)
        remaining_minutes = daily_minutes

        daily_plan: list[tuple[int, str]] = []
        if remaining_minutes >= 120:
            daily_plan = [(60, "learn"), (45, "practice")]
        elif remaining_minutes >= 75:
            daily_plan = [(45, "learn"), (30, "review")]
        elif remaining_minutes >= 45:
            daily_plan = [(30, "learn")]
        else:
            daily_plan = [(20, "review")]

        for duration, forced_type in daily_plan:
            if remaining_minutes < duration:
                continue

            topic = subtopics[topic_cursor % len(subtopics)]["topic"]
            session_type = forced_type
            if forced_type == "learn" and topic_cursor > 0 and topic_cursor % 3 == 0:
                session_type = "review"
            elif forced_type == "practice" and topic_cursor % 2 == 0:
                session_type = "practice"

            sessions.append({
                "id": session_id,
                "topic": topic,
                "duration_minutes": duration,
                "session_type": session_type,
                "scheduled_date": current_date.isoformat(),
                "completed": False,
            })
            session_id += 1
            topic_cursor += 1
            remaining_minutes -= duration

    return sessions


def adapt_for_mood(sessions: list[dict], mood: str) -> list[dict]:
    """Adjust session intensity based on mood."""
    adapted = []
    for session in sessions:
        session_copy = session.copy()

        if mood == "tired":
            # Reduce intensity: shorter sessions, more review
            session_copy["duration_minutes"] = max(15, int(session_copy["duration_minutes"] * 0.6))
            if session_copy["session_type"] == "learn":
                session_copy["session_type"] = "review"
        elif mood == "energized":
            # Increase intensity: longer sessions, more practice
            session_copy["duration_minutes"] = int(session_copy["duration_minutes"] * 1.3)
            if session_copy["session_type"] == "review":
                session_copy["session_type"] = "practice"

        adapted.append(session_copy)

    return adapted


def reschedule_for_constraint(
    sessions: list[dict],
    available_minutes: int,
    days_unavailable: Optional[list[str]] = None,
) -> list[dict]:
    """Reschedule sessions based on availability constraint."""
    if days_unavailable is None:
        days_unavailable = []

    rescheduled = []
    current_date = date.today()
    session_idx = 0

    for day in range(7):
        day_str = (current_date + timedelta(days=day)).strftime("%A").lower()

        if day_str in [d.lower() for d in days_unavailable]:
            continue

        if available_minutes > 0 and session_idx < len(sessions):
            session = sessions[session_idx].copy()

            # Compress if needed
            if session["duration_minutes"] > available_minutes:
                session["duration_minutes"] = available_minutes

            session["scheduled_date"] = (current_date + timedelta(days=day)).isoformat()
            rescheduled.append(session)
            available_minutes -= session["duration_minutes"]
            session_idx += 1

    return rescheduled


def generate_ai_summary(progress: dict, sessions: list[dict]) -> str:
    """Generate a weekly AI summary."""
    completion_pct = progress.get("completion_percentage", 0)
    streak = progress.get("current_streak", 0)
    completed = progress.get("total_sessions_completed", 0)

    summary = f"""
Weekly Wins:
- Completed {completed} sessions with {streak}-day streak
- Learning progress: {completion_pct:.0f}% complete

Focus Areas for Next Week:
- Review weak topics with extra practice sessions
- Maintain daily momentum to protect your streak
- Try mixing theory with hands-on practice

Tip: You're doing great! Keep the routine going.
""".strip()

    return summary
