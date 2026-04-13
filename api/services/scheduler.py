from __future__ import annotations

from datetime import date, timedelta
from math import floor

from models import Session, WeekPlan

DAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"]
MOCK_SUBJECT_CURRICULA = {
    "mathematics": [
        "Number Systems",
        "Algebra",
        "Linear Equations",
        "Quadratic Equations",
        "Trigonometry",
        "Coordinate Geometry",
        "Calculus Basics",
        "Statistics and Probability",
    ],
    "physics": [
        "Units and Measurements",
        "Kinematics",
        "Laws of Motion",
        "Work, Energy and Power",
        "Thermodynamics",
        "Electrostatics",
        "Current Electricity",
        "Modern Physics",
    ],
    "chemistry": [
        "Atomic Structure",
        "Periodic Table",
        "Chemical Bonding",
        "States of Matter",
        "Thermodynamics",
        "Equilibrium",
        "Organic Basics",
        "Revision and Numericals",
    ],
    "biology": [
        "Cell Structure",
        "Human Physiology",
        "Plant Physiology",
        "Genetics",
        "Evolution",
        "Ecology",
        "Reproduction",
        "Revision and Diagrams",
    ],
    "english": [
        "Grammar Fundamentals",
        "Vocabulary Building",
        "Reading Comprehension",
        "Writing Skills",
        "Literature Analysis",
        "Essay Practice",
        "Spoken English",
        "Mock Passage Review",
    ],
    "history": [
        "Ancient Civilizations",
        "Medieval India",
        "Modern India",
        "World Wars",
        "Freedom Movement",
        "Post-Independence India",
        "Important Movements",
        "Revision Timelines",
    ],
    "geography": [
        "Earth and Maps",
        "Climate and Weather",
        "Physical Geography",
        "Resources and Agriculture",
        "Population and Settlement",
        "India Geography",
        "World Geography",
        "Map Practice",
    ],
    "civics": [
        "Constitution Basics",
        "Rights and Duties",
        "Democracy",
        "Parliament and Law",
        "Judiciary",
        "Government Structure",
        "Elections",
        "Case Study Revision",
    ],
    "programming fundamentals": [
        "Problem Solving Logic",
        "Variables and Data Types",
        "Conditionals",
        "Loops",
        "Functions",
        "Arrays and Strings",
        "Basic Recursion",
        "Mini Coding Drills",
    ],
    "object-oriented programming": [
        "Classes and Objects",
        "Encapsulation",
        "Inheritance",
        "Polymorphism",
        "Abstraction",
        "Constructors",
        "Interfaces",
        "OOP Practice",
    ],
    "computer science": [
        "Number Systems",
        "Logic Gates",
        "Computer Architecture",
        "Operating Systems",
        "Databases",
        "Networking Basics",
        "Software Engineering",
        "Revision and Practice",
    ],
    "data structures and algorithms": [
        "Arrays",
        "Linked Lists",
        "Stacks and Queues",
        "Trees",
        "Graphs",
        "Sorting and Searching",
        "Dynamic Programming",
        "Mock Interview Practice",
    ],
    "database management systems": [
        "ER Modeling",
        "Relational Model",
        "SQL Queries",
        "Normalization",
        "Transactions",
        "Indexing",
        "Stored Procedures",
        "DBMS Practice",
    ],
    "operating systems": [
        "Processes and Threads",
        "CPU Scheduling",
        "Memory Management",
        "Paging and Segmentation",
        "File Systems",
        "Deadlocks",
        "Synchronization",
        "OS Practice",
    ],
    "computer networks": [
        "OSI Model",
        "TCP/IP Basics",
        "IP Addressing",
        "Routing and Switching",
        "DNS and DHCP",
        "HTTP and HTTPS",
        "Network Security",
        "CN Practice",
    ],
    "web development": [
        "HTML and CSS",
        "JavaScript Basics",
        "Responsive Layouts",
        "DOM and Events",
        "React Components",
        "State Management",
        "API Integration",
        "Project Build",
    ],
    "java": [
        "Java Syntax",
        "Control Flow",
        "OOP in Java",
        "Collections",
        "Exception Handling",
        "Streams",
        "Multithreading",
        "Java Practice",
    ],
    "python": [
        "Python Syntax",
        "Data Structures",
        "Functions and Modules",
        "File Handling",
        "OOP in Python",
        "Libraries and Packages",
        "Testing",
        "Python Practice",
    ],
    "system design": [
        "Scalability Basics",
        "Caching",
        "Load Balancing",
        "Databases at Scale",
        "Message Queues",
        "Distributed Systems",
        "Trade-offs and Patterns",
        "Design Interview Practice",
    ],
    "machine learning basics": [
        "Statistics Basics",
        "Data Preparation",
        "Regression",
        "Classification",
        "Model Evaluation",
        "Overfitting and Regularization",
        "Feature Engineering",
        "ML Practice",
    ],
    "aptitude": [
        "Percentages",
        "Ratio and Proportion",
        "Time and Work",
        "Speed and Distance",
        "Profit and Loss",
        "Averages",
        "Permutation and Combination",
        "Aptitude Practice",
    ],
    "reasoning": [
        "Series",
        "Coding-Decoding",
        "Seating Arrangement",
        "Syllogisms",
        "Blood Relations",
        "Puzzles",
        "Direction Sense",
        "Reasoning Practice",
    ],
    "current affairs": [
        "National News",
        "International News",
        "Economy",
        "Science and Tech",
        "Sports",
        "Awards and Honours",
        "Government Schemes",
        "Weekly Current Affairs Review",
    ],
    "mock test review": [
        "Error Analysis",
        "Speed Review",
        "Weak Areas",
        "Time Management",
        "Accuracy Check",
        "Revision Sprint",
        "Formula Drill",
        "Final Mock Review",
    ],
}

MOCK_SUBJECT_TOPICS = [topic for curriculum in MOCK_SUBJECT_CURRICULA.values() for topic in curriculum]


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

    for keyword, curriculum in MOCK_SUBJECT_CURRICULA.items():
        if keyword in g:
            return curriculum

    return MOCK_SUBJECT_TOPICS


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
