# API Service (FastAPI)

## Purpose
Own scheduling rules, adaptation logic, and AI orchestration.

## Suggested Files
- main.py
- routers/onboarding.py
- routers/schedule.py
- routers/checkin.py
- services/scheduler.py
- services/adaptation.py
- services/deepseek_client.py
- models/schemas.py

## Minimum Endpoints
- POST /api/onboarding
- POST /api/schedule/generate
- POST /api/schedule/reschedule
- POST /api/checkin
- POST /api/session/complete
- GET /api/dashboard
- GET /api/weekly-summary

## First Implementation Tip
Start with deterministic mocked responses for schedule generation. Swap to DeepSeek once your API key is configured.

## Implemented Endpoints
- GET /health
- POST /api/onboarding
- POST /api/schedule/generate
- POST /api/schedule/reschedule
- POST /api/checkin
- POST /api/session/complete
- GET /api/dashboard?userId=...
- GET /api/weekly-summary?userId=...

## Run Locally
1. Create and activate a Python virtual environment.
2. Install dependencies:
	pip install -r requirements.txt
3. Start the API server:
	uvicorn main:app --reload --port 8000

The API uses an in-memory store for hackathon speed, so data resets on restart.
