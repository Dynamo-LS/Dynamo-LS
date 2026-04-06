from __future__ import annotations

from datetime import date, datetime
from typing import Literal, Optional

from pydantic import BaseModel, Field


Mood = Literal["tired", "okay", "energized"]
SessionType = Literal["learn", "review", "practice"]
Intensity = Literal["light", "medium", "heavy"]


class OnboardingRequest(BaseModel):
    name: str
    goal: str
    deadline: date
    hours_per_day: float = Field(gt=0, le=12)
    learning_style: Literal["visual", "reading", "practice"]
    skill_level: Literal["beginner", "intermediate", "advanced"]


class PlanRequest(BaseModel):
    goal: str
    deadline: date
    hours_per_day: float = Field(gt=0, le=12)
    learning_style: Literal["visual", "reading", "practice"]
    skill_level: Literal["beginner", "intermediate", "advanced"]


class MultiOnboardingRequest(BaseModel):
    name: str
    plans: list[PlanRequest] = Field(min_length=1, max_length=8)


class Session(BaseModel):
    id: str
    topic: str
    duration_minutes: int
    session_type: SessionType
    scheduled_date: date
    completed: bool = False
    completed_at: Optional[datetime] = None
    mood_before: Optional[Mood] = None
    notes: Optional[str] = None


class WeeklySchedule(BaseModel):
    id: str
    user_id: str
    week_start_date: date
    sessions: list[Session]
    generated_at: datetime
    ai_summary: Optional[str] = None


class CheckinRequest(BaseModel):
    user_id: str
    mood: Mood


class SessionCompleteRequest(BaseModel):
    user_id: str
    session_index: int
    mood: Mood
    notes: Optional[str] = ""


class RescheduleRequest(BaseModel):
    user_id: str
    reason: str
    available_minutes: Optional[int] = None
    days_unavailable: Optional[list[str]] = None


class Progress(BaseModel):
    user_id: str
    total_sessions_planned: int
    total_sessions_completed: int
    current_streak: int
    topics_completed: list[str]
    completion_percentage: float
    estimated_completion_date: date
    last_updated: datetime
