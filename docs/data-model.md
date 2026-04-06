# Data Model (Supabase / Postgres)

## Tables

### users
- id (text, pk)
- name (text)
- email (text, unique)
- created_at (timestamptz)

### goals
- id (text, pk)
- user_id (text, fk -> users.id)
- title (text)
- deadline (date)
- skill_level (text)
- learning_style (text)
- hours_per_day (numeric)
- hours_per_week (numeric)
- status (text)
- created_at (timestamptz)

### plans
- id (text, pk)
- goal_id (text, fk -> goals.id)
- version (int)
- start_date (date)
- end_date (date)
- eta_date (date)
- source (text) -- ai, rules, hybrid
- created_at (timestamptz)

### sessions
- id (text, pk)
- plan_id (text, fk -> plans.id)
- scheduled_date (date)
- topic (text)
- duration_min (int)
- type (text) -- learn, review, practice
- intensity (text) -- light, medium, heavy
- status (text) -- pending, completed, missed, rescheduled
- dependency_rank (int)
- spaced_repetition_step (int)
- created_at (timestamptz)

### checkins
- id (text, pk)
- user_id (text, fk -> users.id)
- date (date)
- mood (text) -- tired, okay, energized
- energy_score (int)
- created_at (timestamptz)

### completions
- id (text, pk)
- session_id (text, fk -> sessions.id)
- actual_duration_min (int)
- notes (text)
- quiz_score (numeric)
- completed_at (timestamptz)

### weekly_summaries
- id (text, pk)
- user_id (text, fk -> users.id)
- week_start (date)
- wins_json (jsonb)
- weak_areas_json (jsonb)
- next_focus_json (jsonb)
- generated_at (timestamptz)

## Useful Indexes
- goals(user_id)
- plans(goal_id, version desc)
- sessions(plan_id, scheduled_date)
- sessions(status)
- checkins(user_id, date)
- completions(session_id)

## ETA Calculation Inputs
- completion velocity (sessions/week)
- missed rate
- average mood-adjusted capacity
- remaining weighted difficulty
