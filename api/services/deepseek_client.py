from __future__ import annotations

import json
import os
import re
from datetime import date, timedelta
from typing import Any
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

try:
    from dotenv import load_dotenv

    _api_root = os.path.dirname(os.path.dirname(__file__))
    load_dotenv(os.path.join(_api_root, ".env"))
except Exception:
    pass


DEFAULT_BASE_URL = "https://api.deepseek.com"
DEFAULT_MODEL = "deepseek-chat"
ALLOWED_SESSION_TYPES = {"learn", "review", "practice"}
MOCK_SUBJECT_CURRICULA = {
    "mathematics": ["Number Systems", "Algebra", "Linear Equations", "Quadratic Equations", "Trigonometry", "Coordinate Geometry", "Calculus Basics", "Statistics and Probability"],
    "physics": ["Units and Measurements", "Kinematics", "Laws of Motion", "Work, Energy and Power", "Thermodynamics", "Electrostatics", "Current Electricity", "Modern Physics"],
    "chemistry": ["Atomic Structure", "Periodic Table", "Chemical Bonding", "States of Matter", "Thermodynamics", "Equilibrium", "Organic Basics", "Revision and Numericals"],
    "biology": ["Cell Structure", "Human Physiology", "Plant Physiology", "Genetics", "Evolution", "Ecology", "Reproduction", "Revision and Diagrams"],
    "english": ["Grammar Fundamentals", "Vocabulary Building", "Reading Comprehension", "Writing Skills", "Literature Analysis", "Essay Practice", "Spoken English", "Mock Passage Review"],
    "history": ["Ancient Civilizations", "Medieval India", "Modern India", "World Wars", "Freedom Movement", "Post-Independence India", "Important Movements", "Revision Timelines"],
    "geography": ["Earth and Maps", "Climate and Weather", "Physical Geography", "Resources and Agriculture", "Population and Settlement", "India Geography", "World Geography", "Map Practice"],
    "civics": ["Constitution Basics", "Rights and Duties", "Democracy", "Parliament and Law", "Judiciary", "Government Structure", "Elections", "Case Study Revision"],
    "programming fundamentals": ["Problem Solving Logic", "Variables and Data Types", "Conditionals", "Loops", "Functions", "Arrays and Strings", "Basic Recursion", "Mini Coding Drills"],
    "object-oriented programming": ["Classes and Objects", "Encapsulation", "Inheritance", "Polymorphism", "Abstraction", "Constructors", "Interfaces", "OOP Practice"],
    "computer science": ["Number Systems", "Logic Gates", "Computer Architecture", "Operating Systems", "Databases", "Networking Basics", "Software Engineering", "Revision and Practice"],
    "data structures and algorithms": ["Arrays", "Linked Lists", "Stacks and Queues", "Trees", "Graphs", "Sorting and Searching", "Dynamic Programming", "Mock Interview Practice"],
    "database management systems": ["ER Modeling", "Relational Model", "SQL Queries", "Normalization", "Transactions", "Indexing", "Stored Procedures", "DBMS Practice"],
    "operating systems": ["Processes and Threads", "CPU Scheduling", "Memory Management", "Paging and Segmentation", "File Systems", "Deadlocks", "Synchronization", "OS Practice"],
    "computer networks": ["OSI Model", "TCP/IP Basics", "IP Addressing", "Routing and Switching", "DNS and DHCP", "HTTP and HTTPS", "Network Security", "CN Practice"],
    "web development": ["HTML and CSS", "JavaScript Basics", "Responsive Layouts", "DOM and Events", "React Components", "State Management", "API Integration", "Project Build"],
    "java": ["Java Syntax", "Control Flow", "OOP in Java", "Collections", "Exception Handling", "Streams", "Multithreading", "Java Practice"],
    "python": ["Python Syntax", "Data Structures", "Functions and Modules", "File Handling", "OOP in Python", "Libraries and Packages", "Testing", "Python Practice"],
    "system design": ["Scalability Basics", "Caching", "Load Balancing", "Databases at Scale", "Message Queues", "Distributed Systems", "Trade-offs and Patterns", "Design Interview Practice"],
    "machine learning": ["Statistics Basics", "Data Preparation", "Regression", "Classification", "Model Evaluation", "Overfitting and Regularization", "Feature Engineering", "ML Practice"],
    "aptitude": ["Percentages", "Ratio and Proportion", "Time and Work", "Speed and Distance", "Profit and Loss", "Averages", "Permutation and Combination", "Aptitude Practice"],
    "reasoning": ["Series", "Coding-Decoding", "Seating Arrangement", "Syllogisms", "Blood Relations", "Puzzles", "Direction Sense", "Reasoning Practice"],
    "current affairs": ["National News", "International News", "Economy", "Science and Tech", "Sports", "Awards and Honours", "Government Schemes", "Weekly Current Affairs Review"],
    "mock test review": ["Error Analysis", "Speed Review", "Weak Areas", "Time Management", "Accuracy Check", "Revision Sprint", "Formula Drill", "Final Mock Review"],
}

MOCK_SUBJECT_TOPICS = [topic for curriculum in MOCK_SUBJECT_CURRICULA.values() for topic in curriculum]


def _provider() -> str:
    return os.getenv("AI_PROVIDER", "deepseek").strip().lower()


def _env_int(name: str, default: int) -> int:
    raw = os.getenv(name, str(default)).strip()
    try:
        return int(raw)
    except ValueError:
        return default


def _extract_json(text: str) -> dict[str, Any]:
    try:
        return json.loads(text)
    except json.JSONDecodeError:
        match = re.search(r"\{.*\}", text, flags=re.DOTALL)
        if not match:
            raise
        return json.loads(match.group(0))


def _fallback_goal_analysis(goal: str) -> dict[str, Any]:
    goal_text = goal.lower()
    if "react" in goal_text:
        topics = [
            "JSX Basics",
            "State and Props",
            "Hooks Fundamentals",
            "Effects and Data Flow",
            "Forms and Validation",
            "Routing",
            "Performance",
            "Interview Practice",
        ]
    elif "python" in goal_text:
        topics = [
            "Syntax Basics",
            "Control Flow",
            "Functions",
            "Data Structures",
            "Object-Oriented Python",
            "Modules and Packaging",
            "Testing",
            "Projects",
        ]
    else:
        topics = MOCK_SUBJECT_TOPICS

        for keyword, curriculum in MOCK_SUBJECT_CURRICULA.items():
            if keyword in goal_text:
                topics = curriculum
                break

    return {
        "subtopics": [
            {"topic": topic, "hours": 1.5 if index % 3 == 0 else 1, "type": "review" if index == len(topics) - 1 else "learn"}
            for index, topic in enumerate(topics)
        ],
        "weekly_focus": f"Build a stable foundation for {goal} and mix practice with review.",
    }


def _fallback_weekly_summary(progress: dict, sessions: list[dict]) -> str:
    completed = progress.get("total_sessions_completed", 0)
    planned = progress.get("total_sessions_planned", 0)
    streak = progress.get("current_streak", 0)
    completion_pct = progress.get("completion_percentage", 0)

    return (
        f"Weekly Wins:\n"
        f"- Completed {completed} of {planned} planned sessions\n"
        f"- Current streak: {streak}\n"
        f"- Completion: {completion_pct:.0f}%\n\n"
        f"Next Week Focus:\n"
        f"- Keep one review block early in the week\n"
        f"- Protect your streak with short sessions on busy days\n"
        f"- Use high-energy windows for practice-heavy work"
    )


def _fallback_week_sessions(goal: str, start_date: date, hours_per_day: float) -> list[dict[str, Any]]:
    analysis = _fallback_goal_analysis(goal)
    subtopics = analysis.get("subtopics", [])
    if not subtopics:
        return []

    sessions: list[dict[str, Any]] = []
    topic_idx = 0
    session_id = 0
    for day in range(7):
        d = start_date + timedelta(days=day)
        daily_minutes = int(hours_per_day * 60)
        plan: list[tuple[int, str]]
        if daily_minutes >= 120:
            plan = [(60, "learn"), (45, "practice")]
        elif daily_minutes >= 75:
            plan = [(45, "learn"), (30, "review")]
        elif daily_minutes >= 45:
            plan = [(30, "learn")]
        else:
            plan = [(20, "review")]

        for duration, kind in plan:
            topic = subtopics[topic_idx % len(subtopics)]["topic"]
            sessions.append(
                {
                    "id": session_id,
                    "topic": topic,
                    "duration_minutes": duration,
                    "session_type": kind,
                    "scheduled_date": d.isoformat(),
                    "completed": False,
                }
            )
            session_id += 1
            topic_idx += 1

    return sessions


def _normalize_session_type(raw: str) -> str:
    lowered = str(raw).strip().lower()
    if lowered in ALLOWED_SESSION_TYPES:
        return lowered
    if "rev" in lowered:
        return "review"
    if "prac" in lowered:
        return "practice"
    return "learn"


def _validate_sessions(
    candidate_sessions: list[dict[str, Any]], start_date: date, hours_per_day: float
) -> list[dict[str, Any]]:
    max_minutes = max(20, int(hours_per_day * 60))
    allowed_dates = {(start_date + timedelta(days=i)).isoformat() for i in range(7)}

    cleaned: list[dict[str, Any]] = []
    for index, session in enumerate(candidate_sessions):
        topic = str(session.get("topic", "")).strip()
        if not topic:
            continue

        raw_minutes = session.get("duration_minutes", session.get("durationMin", 30))
        try:
            minutes = int(raw_minutes)
        except (TypeError, ValueError):
            minutes = 30
        minutes = max(15, min(minutes, max_minutes))

        session_type = _normalize_session_type(session.get("session_type", session.get("type", "learn")))

        raw_date = str(session.get("scheduled_date", "")).strip()
        if raw_date not in allowed_dates:
            raw_date = (start_date + timedelta(days=index % 7)).isoformat()

        cleaned.append(
            {
                "id": index,
                "topic": topic,
                "duration_minutes": minutes,
                "session_type": session_type,
                "scheduled_date": raw_date,
                "completed": False,
            }
        )

    if not cleaned:
        return []

    if not any(s["session_type"] == "review" for s in cleaned):
        cleaned[-1]["session_type"] = "review"

    return cleaned


def _call_deepseek(messages: list[dict[str, str]], model: str | None = None) -> dict[str, Any]:
    api_key = os.getenv("DEEPSEEK_API_KEY", "").strip()
    if not api_key:
        raise RuntimeError("DEEPSEEK_API_KEY not configured")

    base_url = os.getenv("DEEPSEEK_BASE_URL", DEFAULT_BASE_URL).rstrip("/")
    path = os.getenv("DEEPSEEK_CHAT_PATH", "/chat/completions")
    timeout = _env_int("DEEPSEEK_TIMEOUT", 30)

    payload = {
        "model": model or os.getenv("DEEPSEEK_MODEL", DEFAULT_MODEL),
        "messages": messages,
        "temperature": 0.2,
    }

    request = Request(
        f"{base_url}{path}",
        data=json.dumps(payload).encode("utf-8"),
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {api_key}",
        },
        method="POST",
    )

    try:
        with urlopen(request, timeout=timeout) as response:
            return json.loads(response.read().decode("utf-8"))
    except (HTTPError, URLError, TimeoutError, ValueError) as exc:
        raise RuntimeError(f"DeepSeek request failed: {exc}") from exc


def _call_ollama(messages: list[dict[str, str]], model: str | None = None) -> dict[str, Any]:
    base_url = os.getenv("OLLAMA_BASE_URL", "http://127.0.0.1:11434").rstrip("/")
    timeout = _env_int("OLLAMA_TIMEOUT", 60)
    payload = {
        "model": model or os.getenv("OLLAMA_MODEL", "qwen2.5:7b"),
        "messages": messages,
        "stream": False,
        "format": "json",
    }

    request = Request(
        f"{base_url}/api/chat",
        data=json.dumps(payload).encode("utf-8"),
        headers={"Content-Type": "application/json"},
        method="POST",
    )

    try:
        with urlopen(request, timeout=timeout) as response:
            return json.loads(response.read().decode("utf-8"))
    except (HTTPError, URLError, TimeoutError, ValueError) as exc:
        raise RuntimeError(f"Ollama request failed: {exc}") from exc


def _llm_response_content(messages: list[dict[str, str]]) -> str:
    provider = _provider()
    if provider == "ollama":
        response = _call_ollama(messages)
        message = response.get("message", {}) if isinstance(response, dict) else {}
        content = message.get("content", "")
        if not content:
            raise RuntimeError("Ollama returned empty content")
        return str(content)

    response = _call_deepseek(messages)
    content = response["choices"][0]["message"]["content"]
    return str(content)


def deepseek_goal_analysis(
    goal: str,
    deadline: date,
    hours_per_day: float,
    skill_level: str,
    learning_style: str,
) -> dict[str, Any]:
    prompt = {
        "goal": goal,
        "deadline": deadline.isoformat(),
        "hours_per_day": hours_per_day,
        "skill_level": skill_level,
        "learning_style": learning_style,
    }

    messages = [
        {
            "role": "system",
            "content": (
                "You are a study-plan assistant. Return JSON only with keys: subtopics, weekly_focus. "
                "Each subtopic must include topic, hours, and type (learn, review, practice)."
            ),
        },
        {
            "role": "user",
            "content": json.dumps(prompt, ensure_ascii=False),
        },
    ]

    try:
        content = _llm_response_content(messages)
        parsed = _extract_json(content)
        if isinstance(parsed, dict) and "subtopics" in parsed:
            return parsed
    except Exception:
        pass

    return _fallback_goal_analysis(goal)


def deepseek_weekly_schedule(
    goal: str,
    deadline: date,
    hours_per_day: float,
    skill_level: str,
    learning_style: str,
    start_date: date,
) -> tuple[list[dict[str, Any]], str, str | None]:
    payload = {
        "goal": goal,
        "deadline": deadline.isoformat(),
        "start_date": start_date.isoformat(),
        "hours_per_day": hours_per_day,
        "skill_level": skill_level,
        "learning_style": learning_style,
        "requirements": {
            "range_days": 7,
            "session_types": ["learn", "review", "practice"],
            "at_least_one_review": True,
        },
    }

    messages = [
        {
            "role": "system",
            "content": (
                "Return JSON only with key 'sessions'. Each session must include: "
                "topic, duration_minutes, session_type (learn/review/practice), scheduled_date (YYYY-MM-DD). "
                "Generate exactly 7 days worth of realistic sessions within hours_per_day."
            ),
        },
        {
            "role": "user",
            "content": json.dumps(payload, ensure_ascii=False),
        },
    ]

    provider = _provider()

    try:
        content = _llm_response_content(messages)
        parsed = _extract_json(content)
        sessions = parsed.get("sessions", []) if isinstance(parsed, dict) else []
        if isinstance(sessions, list):
            validated = _validate_sessions(sessions, start_date, hours_per_day)
            if validated:
                return validated, provider, None
    except Exception as exc:
        return (
            _fallback_week_sessions(goal, start_date, hours_per_day),
            "rules-fallback",
            f"{provider.capitalize()} unavailable, using rules fallback: {exc}",
        )

    return (
        _fallback_week_sessions(goal, start_date, hours_per_day),
        "rules-fallback",
        f"{provider.capitalize()} did not return valid session JSON. Using rules fallback.",
    )


def deepseek_weekly_summary(progress: dict, sessions: list[dict]) -> str:
    messages = [
        {
            "role": "system",
            "content": (
                "You are a study coach. Give a concise weekly summary in plain text with sections: "
                "Wins, Weak Areas, Next Week Focus, and keep it encouraging."
            ),
        },
        {
            "role": "user",
            "content": json.dumps({"progress": progress, "sessions": sessions}, ensure_ascii=False),
        },
    ]

    try:
        content = _llm_response_content(messages)
        return content.strip()
    except Exception:
        return _fallback_weekly_summary(progress, sessions)
