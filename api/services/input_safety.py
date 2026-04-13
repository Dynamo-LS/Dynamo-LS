from __future__ import annotations

import re

_BAD_WORD_PATTERNS = [
    r"\bf+u+c+k+\b",
    r"\bs+h+i+t+\b",
    r"\bb+i+t+c+h+\b",
    r"\ba+s+s+h+o+l+e+\b",
    r"\bb+a+s+t+a+r+d+\b",
    r"\bd+a+m+n+\b",
    r"\bi+d+i+o+t+\b",
    r"\bm+o+r+o+n+\b",
]

_STUDY_KEYWORDS = {
    "study",
    "studies",
    "learn",
    "learning",
    "exam",
    "test",
    "interview",
    "course",
    "subject",
    "assignment",
    "homework",
    "revision",
    "practice",
    "math",
    "science",
    "physics",
    "chemistry",
    "biology",
    "english",
    "history",
    "geography",
    "coding",
    "programming",
    "programming fundamentals",
    "oop",
    "object oriented programming",
    "python",
    "java",
    "c",
    "c++",
    "javascript",
    "typescript",
    "react",
    "web development",
    "dbms",
    "database",
    "operating systems",
    "os",
    "computer networks",
    "cn",
    "system design",
    "machine learning",
    "ai",
    "sql",
    "dsa",
    "algorithm",
    "algorithms",
    "datastructures",
    "data structures",
    "jee",
    "neet",
    "gate",
    "upsc",
    "ssc",
    "cat",
    "placement",
    "aptitude",
}

_BAD_WORD_RE = re.compile("|".join(_BAD_WORD_PATTERNS), flags=re.IGNORECASE)


def _normalize(text: str) -> str:
    return " ".join(text.strip().lower().split())


def has_bad_words(text: str) -> bool:
    normalized = _normalize(text)
    if not normalized:
        return False
    return bool(_BAD_WORD_RE.search(normalized))


def is_study_related_goal(goal: str) -> bool:
    normalized = _normalize(goal)
    if not normalized:
        return False

    # Support exact token matching and phrase matching (for multi-word keywords).
    compact = normalized.replace("-", " ")
    tokens = set(re.findall(r"[a-z0-9]+", compact))
    for keyword in _STUDY_KEYWORDS:
        if " " in keyword:
            if keyword in compact:
                return True
            continue
        if keyword in tokens:
            return True
    return False


def validate_no_bad_words(text: str, field_name: str) -> None:
    if has_bad_words(text):
        raise ValueError(f"{field_name} contains disallowed language.")


def validate_study_goal(goal: str, field_name: str = "goal") -> None:
    validate_no_bad_words(goal, field_name)
    if not is_study_related_goal(goal):
        raise ValueError(
            f"{field_name} must be study-related. Please enter an academic or learning goal only."
        )
