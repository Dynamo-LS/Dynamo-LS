export type SessionType = "learn" | "review" | "practice";
export type Mood = "tired" | "okay" | "energized";

export interface Session {
  id: string;
  topic: string;
  duration_minutes: number;
  session_type: SessionType;
  scheduled_date: string;
  completed: boolean;
  completed_at?: string;
  mood_before?: Mood;
  notes?: string;
}

export interface WeeklySchedule {
  id: string;
  user_id: string;
  week_start_date: string;
  sessions: Session[];
  generated_at: string;
  ai_summary?: string;
}

export interface Progress {
  user_id: string;
  total_sessions_planned: number;
  total_sessions_completed: number;
  current_streak: number;
  topics_completed: string[];
  completion_percentage: number;
  estimated_completion_date: string;
  last_updated: string;
}

export interface AppState {
  user_id: string;
  user_name: string;
  user_age: number | null;
  goal: string;
  schedule: WeeklySchedule | null;
  progress: Progress | null;
}

export interface LoginProfile {
  name: string;
  age: number;
  created_at: string;
}
