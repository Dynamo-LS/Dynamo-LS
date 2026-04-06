# Dynamic Learning Scheduler

Adaptive learning planner with React + FastAPI, local-first data persistence using IndexedDB, and Android APK packaging via Capacitor.

## 📌 Problem Solved

Students struggle with:
- Inconsistent study schedules  
- Lack of personalization  
- No offline-capable tools  

This project solves it by:
- Adapting schedules dynamically  
- Tracking progress per user  
- Supporting offline-first behavior  

## Highlights

- One-time login flow (name + age) with logout support
- Per-user workspace persistence in IndexedDB (data restored by user name)
- Multi-plan onboarding with time allocation per plan
- Local-first behavior so schedule/progress continue even if backend is unavailable
- Mobile-friendly interface and generated Android debug APK

## Tech Stack

- Frontend: React 18, TypeScript, Vite, Tailwind CSS, Framer Motion
- Backend: FastAPI, Pydantic
- Persistence: IndexedDB (frontend), in-memory fallback on backend
- Mobile packaging: Capacitor Android

## Project Structure

```text
gfg-hackathon/
  apk/
  api/
  demo/
  docs/
  prompts/
  web/
  release-assets/
  README.md
```

## Run Locally

### Backend

```bash
cd api
pip install -r requirements.txt
python -m uvicorn main:app --reload --host 127.0.0.1 --port 8000
```

### Frontend

```bash
cd web
npm install
npm run dev
```

Optional frontend environment variable:

```bash
VITE_API_BASE_URL=http://127.0.0.1:8000
```

## API Endpoints

- POST /api/onboard
- POST /api/onboard-multi
- GET /api/schedule/{user_id}
- GET /api/today/{user_id}
- POST /api/checkin
- POST /api/session/complete
- POST /api/reschedule
- GET /api/progress/{user_id}
- GET /api/dashboard/{user_id}
- GET /health

## Android APK

Separate APK artifact in this repository:

```text
apk/dynamic-learning-scheduler-debug.apk
```

Backup copy:

```text
release-assets/dynamic-learning-scheduler-debug.apk
```

Native build output location:

```text
web/android/app/build/outputs/apk/debug/app-debug.apk
```

Build command:

```bash
cd web/android
./gradlew assembleDebug
```

## Notes

- Capacitor is pinned to v6 for Java 17 compatibility.
- If AI provider calls fail, backend and frontend fall back to local/rules-based schedule generation.

## License

This project is currently for hackathon/demo use.
