# Product Blueprint

## 1. Problem Statement
Students and self-learners fail static plans because time, motivation, and energy change daily. This app builds a dynamic study system that adapts in real time.

## 2. Product Vision
A coach-like AI planner that helps users stay consistent with personalized scheduling, adaptive rescheduling, and actionable progress insights.

## 3. Core Features

### Smart Onboarding
Collect:
- learning goal
- deadline
- hours per day or week
- learning style
- current skill level

### AI Schedule Generator
Input: natural language goal.
Output: structured weekly plan with:
- dependency-ordered topics
- difficulty progression
- spaced repetition sessions
- session type: learn, review, practice

### Dynamic Rescheduling
Handles:
- missed sessions
- limited-time days (micro-sessions)
- burnout signals
- travel windows and blackout dates

### Mood and Energy Check-In
Daily mood options:
- tired
- okay
- energized

System adjusts session intensity and tracks patterns.

### Progress Dashboard
Displays:
- streak calendar and heatmap
- topic completion percentages
- updated ETA
- weekly AI summary (wins, weak areas, next focus)

### Smart Notifications
- contextual nudges
- streak protection alerts
- quiet-hour windows

## 4. MVP User Stories
- As a user, I can create a goal and receive a schedule.
- As a user, I can mark sessions complete or missed.
- As a user, I can report my mood and get adjusted session intensity.
- As a user, I can ask to compress today into 10-15 minutes.
- As a user, I can view progress and ETA updates.

## 5. Scheduling Rules
- Never exceed user availability.
- Max 2 heavy sessions per day.
- At least 1 review session per week.
- Spaced repetition intervals: day 1, day 3, day 7, day 14.
- If two sessions are missed, trigger adaptation strategy.

## 6. Adaptation Logic (MVP)
- Missed session: move unfinished content to next feasible slots.
- Time-compression: convert topic into micro-session with minimum viable objective.
- Low energy: replace heavy practice with light review.
- Burnout risk: insert rest day and reduce next week load by 20%.

## 7. Metrics
- weekly completion rate
- streak length
- sessions missed per week
- ETA drift (planned vs actual)
- mood vs completion correlation

## 8. Demo Script Trigger
"I missed 2 days and only have 10 minutes tonight." -> instant plan reshaping + updated ETA.

## 9. Future Enhancements
- quiz generation and score-driven adjustments
- collaborative accountability buddies
- wearable integration for energy prediction
- adaptive difficulty model per topic
