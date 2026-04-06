import type { WeeklySchedule, Mood, Progress } from "./types";

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? "http://localhost:8000";

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const response = await fetch(`${BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options?.headers ?? {}),
    },
    ...options,
  });

  if (!response.ok) {
    const text = await response.text();
    let message = text || `Request failed: ${response.status}`;

    try {
      const parsed = JSON.parse(text) as { detail?: string; message?: string };
      message = parsed.detail || parsed.message || message;
    } catch {
      message = text || `Request failed: ${response.status}`;
    }

    throw new Error(message);
  }

  return response.json() as Promise<T>;
}

export function onboard(payload: {
  name: string;
  goal: string;
  deadline: string;
  hours_per_day: number;
  learning_style: "visual" | "reading" | "practice";
  skill_level: "beginner" | "intermediate" | "advanced";
}) {
  return request<{ user: any; schedule: WeeklySchedule }>("/api/onboard", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function onboardMulti(payload: {
  name: string;
  plans: Array<{
    goal: string;
    deadline: string;
    hours_per_day: number;
    learning_style: "visual" | "reading" | "practice";
    skill_level: "beginner" | "intermediate" | "advanced";
  }>;
}) {
  return request<{ user: any; schedule: WeeklySchedule }>("/api/onboard-multi", {
    method: "POST",
    body: JSON.stringify(payload),
  });
}

export function getSchedule(user_id: string) {
  return request<WeeklySchedule>(`/api/schedule/${user_id}`);
}

export function getToday(user_id: string) {
  return request<{ session: any | null; all_today: any[]; message?: string }>(
    `/api/today/${user_id}`
  );
}

export function checkin(user_id: string, mood: Mood) {
  return request<{
    check_in: any;
    adapted_schedule: WeeklySchedule;
    tip: string;
  }>("/api/checkin", {
    method: "POST",
    body: JSON.stringify({ user_id, mood }),
  });
}

export function completeSession(
  user_id: string,
  session_index: number,
  mood: Mood,
  notes?: string
) {
  return request<{ session: any; progress: Progress; message: string }>(
    "/api/session/complete",
    {
      method: "POST",
      body: JSON.stringify({ user_id, session_index, mood, notes }),
    }
  );
}

export function getProgress(user_id: string) {
  return request<{ progress: Progress; weekly_summary: string }>(
    `/api/progress/${user_id}`
  );
}

export function reschedule(
  user_id: string,
  reason: string,
  available_minutes?: number,
  days_unavailable?: string[]
) {
  return request<{
    updated_schedule: WeeklySchedule;
    reason: string;
    message: string;
  }>("/api/reschedule", {
    method: "POST",
    body: JSON.stringify({
      user_id,
      reason,
      available_minutes,
      days_unavailable,
    }),
  });
}

export function getDashboard(user_id: string) {
  return request<{
    user: { name: string; goal: string };
    progress: Progress;
    topic_progress: any[];
    sessions_today: any[];
  }>(`/api/dashboard/${user_id}`);
}
