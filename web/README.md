# Web App (React + Tailwind)

## MVP Screens
1. Onboarding
2. Weekly Schedule
3. Daily Check-In
4. Dashboard
5. Reschedule Dialog

## Suggested Components
- components/OnboardingForm.tsx
- components/WeeklyCalendar.tsx
- components/MoodCheckinCard.tsx
- components/RescheduleDialog.tsx
- components/ProgressCharts.tsx

## Suggested Routes
- /onboarding
- /schedule
- /today
- /dashboard

## API Integration
Connect to backend endpoints defined in docs/api-spec.md.

## Demo UX Requirement
A clear button or chat action for:
"I missed 2 days and only have 10 minutes tonight"

## Implemented Routes
- / (Onboarding / Goal Setup)
- /schedule (AI-generated weekly schedule + reschedule dialog)
- /today (Mood check-in + session completion)
- /dashboard (Progress metrics + topic charts + weekly summary)

## Run Locally
1. Install dependencies:
	npm install
2. Start dev server:
	npm run dev

Optional environment variable:
- VITE_API_BASE_URL (default: http://localhost:8000)

## Build
- npm run build
