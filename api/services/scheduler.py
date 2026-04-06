from __future__ import annotations

from datetime import date, timedelta
from math import floor

from models import Session, WeekPlan

DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]


def _topics_for_goal(goal: str) -> list[str]:
    g = goal.lower()
    if "react" in g:
        return [
            "JSX & Components",
            "Props and State",
            "Hooks Fundamentals",
            "Effect Patterns",
            "Forms & Validation",
            "Routing",
            "Performance",
            "Interview Drills",
        ]
    if "python" in g:
        return [
            "Syntax Basics",
            "Control Flow",
            "Functions",
            "Data Structures",
            "OOP",
            "Modules & Packaging",
            "Testing",
            "Projects",
        ]
    return [
        "Foundations",
        "Core Concepts",
        "Intermediate Practice",
        "Applied Exercises",
        "Advanced Topics",
        "Revision",
        "Project Sprint",
        "Mock Assessment",
    ]


def build_week_plan(
    goal: str,
    start_date: date,
    hours_per_day: float,
    hours_per_week: float,
    learning_style: str,
) -> WeekPlan:
    topics = _topics_for_goal(goal)
    max_daily_min = int(hours_per_day * 60)
    weekly_budget_min = int(hours_per_week * 60)
    used = 0

    sessions: list[Session] = []
    topic_idx = 0
    session_idx = 1

    for day in DAYS:
        if used >= weekly_budget_min:
            break

        remaining = weekly_budget_min - used
        day_cap = min(max_daily_min, remaining)

        if day_cap < 15:
            continue

        # Never overload: at most 2 sessions/day and max 2 heavy sessions/day by design.
        slot_count = 2 if day_cap >= 80 else 1
        slot_budget = floor(day_cap / slot_count)

        for slot in range(slot_count):
            topic = topics[topic_idx % len(topics)]
            topic_idx += 1

            if day == "Sun" and slot == 0:
                kind = "review"
                intensity = "light"
            elif learning_style == "practice-heavy" and slot == slot_count - 1:
                kind = "practice"
                intensity = "heavy"
            else:
                kind = "learn"
                intensity = "medium"

            duration = max(20, min(slot_budget, 75))
            if used + duration > weekly_budget_min:
                duration = weekly_budget_min - used
            if duration < 15:
                continue

            sessions.append(
                Session(
                    sessionId=f"s_{session_idx}",
                    day=day,
                    topic=topic,
                    durationMin=duration,
                    type=kind,
                    intensity=intensity,
                )
            )
            session_idx += 1
            used += duration

    # Guarantee at least one review per week.
    if not any(s.type == "review" for s in sessions) and sessions:
        sessions[-1].type = "review"
        sessions[-1].intensity = "light"

    return WeekPlan(startDate=start_date, sessions=sessions)


def estimate_eta(deadline: date, completion_pct: int) -> date:
    if completion_pct >= 100:
        return date.today()

    now = date.today()
    buffer_days = max(0, 10 - completion_pct // 10)
    projected = now + timedelta(days=buffer_days)
    return max(projected, min(deadline, projected + timedelta(days=21)))
