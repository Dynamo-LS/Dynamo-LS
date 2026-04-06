# API Specification (MVP)

Base URL: /api

## POST /onboarding
Create or update onboarding context.

Request:
{
  "userId": "u_123",
  "goal": "Learn React for interviews",
  "deadline": "2026-05-20",
  "hoursPerDay": 2,
  "hoursPerWeek": 12,
  "learningStyle": "practice-heavy",
  "skillLevel": "beginner"
}

Response:
{
  "ok": true,
  "profile": {
    "userId": "u_123",
    "goalId": "g_101"
  }
}

## POST /schedule/generate
Generate initial schedule using AI + rules.

Request:
{
  "goalId": "g_101"
}

Response:
{
  "ok": true,
  "planId": "p_900",
  "week": {
    "startDate": "2026-04-06",
    "sessions": [
      {
        "sessionId": "s_1",
        "day": "Mon",
        "topic": "React Basics",
        "durationMin": 60,
        "type": "learn",
        "intensity": "medium"
      }
    ]
  },
  "eta": "2026-05-18"
}

## POST /schedule/reschedule
Conversational adaptation.

Request:
{
  "planId": "p_900",
  "message": "I missed 2 days and only have 10 minutes tonight"
}

Response:
{
  "ok": true,
  "changes": [
    "Compressed tonight to micro-session",
    "Shifted heavy practice to Friday",
    "Inserted recovery buffer on Sunday"
  ],
  "updatedWeek": {
    "startDate": "2026-04-06",
    "sessions": []
  },
  "eta": "2026-05-21"
}

## POST /checkin
Store mood and get adjusted today session.

Request:
{
  "userId": "u_123",
  "mood": "tired"
}

Response:
{
  "ok": true,
  "todayFocus": {
    "sessionId": "s_3",
    "topic": "Hooks recap",
    "durationMin": 20,
    "type": "review",
    "intensity": "light"
  },
  "insight": "On low-energy days, short review protects consistency."
}

## POST /session/complete
Mark session complete and update progress.

Request:
{
  "sessionId": "s_3",
  "actualDurationMin": 18,
  "notes": "useEffect cleanup now clear"
}

Response:
{
  "ok": true,
  "streak": 6,
  "completionPct": 42,
  "eta": "2026-05-19"
}

## GET /dashboard?userId=u_123
Progress aggregates.

Response:
{
  "ok": true,
  "streak": 6,
  "completionPct": 42,
  "eta": "2026-05-19",
  "topicProgress": [
    {"topic": "React Fundamentals", "pct": 80},
    {"topic": "Hooks", "pct": 45},
    {"topic": "State Management", "pct": 20}
  ],
  "heatmap": [
    {"date": "2026-04-01", "count": 1}
  ]
}

## GET /weekly-summary?userId=u_123
AI-generated weekly report.

Response:
{
  "ok": true,
  "wins": ["Maintained streak despite travel"],
  "weakAreas": ["Hook dependencies"],
  "nextWeekFocus": ["Practice custom hooks", "One revision sprint"]
}
