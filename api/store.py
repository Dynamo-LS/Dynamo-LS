from __future__ import annotations

from datetime import date, datetime, timedelta
from typing import Any, Optional

DB: dict[str, Any] = {
    "users": {},
    "schedules": {},
    "progress": {},
    "check_ins": {},
}


def next_id(prefix: str) -> str:
    count_map = {"u": len(DB["users"]), "s": len(DB["schedules"])}
    return f"{prefix}_{count_map.get(prefix, 0) + 1}"


def create_user(user_data: dict) -> dict:
    user_id = next_id("u")
    user = {
        "id": user_id,
        **user_data,
        "created_at": datetime.now().isoformat(),
    }
    DB["users"][user_id] = user
    DB["progress"][user_id] = {
        "user_id": user_id,
        "total_sessions_planned": 0,
        "total_sessions_completed": 0,
        "current_streak": 0,
        "topics_completed": [],
        "completion_percentage": 0.0,
        "estimated_completion_date": (date.today() + timedelta(days=30)).isoformat(),
        "last_updated": datetime.now().isoformat(),
    }
    return user


def get_user(user_id: str) -> Optional[dict]:
    return DB["users"].get(user_id)


def save_schedule(user_id: str, sessions: list[dict]) -> dict:
    schedule_id = next_id("s")
    schedule = {
        "id": schedule_id,
        "user_id": user_id,
        "week_start_date": date.today().isoformat(),
        "sessions": sessions,
        "generated_at": datetime.now().isoformat(),
        "ai_summary": None,
    }
    DB["schedules"][schedule_id] = schedule
    DB["progress"][user_id]["total_sessions_planned"] = len(sessions)
    return schedule


def get_current_schedule(user_id: str) -> Optional[dict]:
    for schedule in DB["schedules"].values():
        if schedule["user_id"] == user_id:
            return schedule
    return None


def get_progress(user_id: str) -> dict:
    return DB["progress"].get(user_id, {})


def mark_session_complete(user_id: str, session_index: int, mood: str, notes: str = "") -> dict:
    schedule = get_current_schedule(user_id)
    if schedule and 0 <= session_index < len(schedule["sessions"]):
        session = schedule["sessions"][session_index]
        session["completed"] = True
        session["completed_at"] = datetime.now().isoformat()
        session["mood_before"] = mood
        session["notes"] = notes

        progress = DB["progress"][user_id]
        progress["total_sessions_completed"] += 1
        progress["current_streak"] += 1
        progress["completion_percentage"] = (
            progress["total_sessions_completed"] / max(progress["total_sessions_planned"], 1) * 100
        )
        progress["last_updated"] = datetime.now().isoformat()

        return session
    return {}


def reschedule_sessions(user_id: str, new_sessions: list[dict]) -> dict:
    schedule = get_current_schedule(user_id)
    if schedule:
        schedule["sessions"] = new_sessions
        schedule["generated_at"] = datetime.now().isoformat()
        return schedule
    return {}
