import { useEffect, useState } from "react";
import { checkin, getToday, completeSession } from "../api";
import type { AppState, Mood } from "../types";

interface Props {
  appState: AppState;
  setAppState: (update: Partial<AppState>) => void;
}

export default function TodayPage({ appState, setAppState }: Props) {
  const [mood, setMood] = useState<Mood | null>(null);
  const [todaySession, setTodaySession] = useState<any | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [completed, setCompleted] = useState(false);
  const [sessionNotes, setSessionNotes] = useState("");

  useEffect(() => {
    if (!appState.schedule) {
      setTodaySession(null);
      return;
    }

    const localToday = appState.schedule.sessions.find(
      (session) => session.scheduled_date === new Date().toISOString().slice(0, 10)
    );
    setTodaySession(localToday || null);
  }, [appState.schedule]);

  useEffect(() => {
    if (!appState.user_id || !appState.schedule) return;
    const loadToday = async () => {
      try {
        const result = await getToday(appState.user_id);
        setTodaySession(result.session || null);
      } catch (err) {
        console.error(err);
      }
    };
    loadToday();
  }, [appState.user_id, appState.schedule]);

  const computeLocalProgress = () => {
    const sessions = appState.schedule?.sessions ?? [];
    const planned = sessions.length;
    const completedCount = sessions.filter((session) => session.completed).length;
    const topics = Array.from(new Set(sessions.filter((s) => s.completed).map((s) => s.topic)));

    return {
      user_id: appState.user_id,
      total_sessions_planned: planned,
      total_sessions_completed: completedCount,
      current_streak: completedCount,
      topics_completed: topics,
      completion_percentage: planned > 0 ? (completedCount / planned) * 100 : 0,
      estimated_completion_date: new Date(Date.now() + Math.max(0, planned - completedCount) * 86400000).toISOString(),
      last_updated: new Date().toISOString(),
    };
  };

  const applyCompletionToLocalSchedule = (sessionId: string, notes: string, selectedMood: Mood) => {
    if (!appState.schedule) return null;

    const sessions = appState.schedule.sessions.map((session) =>
      session.id === sessionId
        ? {
            ...session,
            completed: true,
            completed_at: new Date().toISOString(),
            mood_before: selectedMood,
            notes,
          }
        : session
    );

    const nextSchedule = {
      ...appState.schedule,
      sessions,
    };

    const nextProgress = {
      ...computeLocalProgress(),
      total_sessions_completed: sessions.filter((session) => session.completed).length,
      topics_completed: Array.from(new Set(sessions.filter((session) => session.completed).map((session) => session.topic))),
      completion_percentage: sessions.length > 0 ? (sessions.filter((session) => session.completed).length / sessions.length) * 100 : 0,
      last_updated: new Date().toISOString(),
    };

    setTodaySession(
      sessions.find((session) => session.id === sessionId) || null
    );

    setAppState({
      schedule: nextSchedule,
      progress: nextProgress,
    });

    return nextProgress;
  };

  const applyLocalMoodAdaptation = (selectedMood: Mood) => {
    if (!appState.schedule) return;
    const today = new Date().toISOString().slice(0, 10);
    const idx = appState.schedule.sessions.findIndex((session) => session.scheduled_date === today && !session.completed);
    if (idx < 0) return;

    const sessions = [...appState.schedule.sessions];
    const current = sessions[idx];
    const adjustedMinutes =
      selectedMood === "tired"
        ? Math.max(15, Math.round(current.duration_minutes * 0.7))
        : selectedMood === "energized"
        ? Math.min(120, Math.round(current.duration_minutes * 1.1))
        : current.duration_minutes;

    sessions[idx] = {
      ...current,
      duration_minutes: adjustedMinutes,
      mood_before: selectedMood,
    };

    setAppState({
      schedule: {
        ...appState.schedule,
        sessions,
      },
    });
    setTodaySession(sessions[idx]);
  };

  const handleMoodSelect = async (selectedMood: Mood) => {
    setMood(selectedMood);
    setLoading(true);
    setError("");
    try {
      const result = await checkin(appState.user_id, selectedMood);
      setTodaySession(result.adapted_schedule.sessions[0] || null);
    } catch (err) {
      applyLocalMoodAdaptation(selectedMood);
      setError("Server unavailable. Applied local mood adaptation.");
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async () => {
    if (!todaySession || !mood) return;
    setLoading(true);
    setError("");
    try {
      const sessionIndex = appState.schedule?.sessions.findIndex((session) => session.id === todaySession.id) ?? -1;
      if (sessionIndex < 0) {
        throw new Error("Could not find the active session in your schedule");
      }

      const result = await completeSession(appState.user_id, sessionIndex, mood, sessionNotes);
      applyCompletionToLocalSchedule(todaySession.id, sessionNotes, mood);
      setAppState({ progress: result.progress });
      setCompleted(true);
    } catch (err) {
      if (appState.schedule) {
        const nextProgress = applyCompletionToLocalSchedule(todaySession.id, sessionNotes, mood);
        if (nextProgress) {
          setCompleted(true);
          setError("Session saved locally. Backend sync is unavailable.");
        } else {
          setError(err instanceof Error ? err.message : "Failed to mark complete");
        }
      } else {
        setError(err instanceof Error ? err.message : "Failed to mark complete");
      }
    } finally {
      setLoading(false);
    }
  };

  if (!appState.user_id) {
    return (
      <div className="p-6 text-center">
        <p className="text-slate-300">Create a plan in the Start tab first.</p>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="mb-4 text-2xl font-bold text-slate-100">3. Daily Check-in</h2>

      {!mood ? (
        <div className="max-w-2xl">
          <p className="mb-6 text-slate-300">How are you feeling today?</p>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              {
                value: "tired" as Mood,
                label: "😴 Tired",
                desc: "Low energy, need lighter sessions",
              },
              {
                value: "okay" as Mood,
                label: "😐 Okay",
                desc: "Normal energy, steady pace",
              },
              {
                value: "energized" as Mood,
                label: "⚡ Energized",
                desc: "High energy, ready for challenges",
              },
            ].map((option) => (
              <button
                key={option.value}
                onClick={() => handleMoodSelect(option.value)}
                disabled={loading}
                className="rounded-lg border-2 border-white/15 bg-white/5 p-4 transition hover:border-cyan-400 hover:bg-cyan-400/10 disabled:bg-slate-800"
              >
                <p className="text-2xl">{option.label.split(" ")[0]}</p>
                <p className="text-sm font-semibold text-slate-100">{option.label.split(" ").slice(1).join(" ")}</p>
                <p className="text-xs text-slate-300">{option.desc}</p>
              </button>
            ))}
          </div>
        </div>
      ) : (
        <div className="max-w-2xl space-y-6">
          <div className="rounded-lg border border-blue-400/30 bg-blue-500/15 p-4">
            <p className="text-sm text-slate-100">
              Feeling <strong>{mood}</strong> — your session has been adjusted
            </p>
          </div>

          {todaySession ? (
            <div className="space-y-4">
              <div className="rounded-lg border border-white/10 bg-white/5 p-4">
                <h3 className="font-semibold text-slate-100">{todaySession.topic}</h3>
                <p className="mt-2 text-sm text-slate-300">
                  {todaySession.duration_minutes} minutes • {todaySession.session_type}
                </p>
              </div>

              {!completed && (
                <>
                  <label>
                    <span className="block text-sm font-semibold text-slate-200">Session Notes (optional)</span>
                    <textarea
                      value={sessionNotes}
                      onChange={(e) => setSessionNotes(e.target.value)}
                      placeholder="How did the session go? What did you learn?"
                      className="mt-2 w-full rounded border border-white/15 bg-white/5 px-3 py-2 text-slate-100 placeholder:text-slate-400 focus:border-cyan-400 focus:outline-none"
                      rows={3}
                    />
                  </label>

                  <button
                    onClick={handleComplete}
                    disabled={loading}
                    className="w-full rounded-lg bg-green-600 px-6 py-3 font-semibold text-white hover:bg-green-700 disabled:bg-slate-300"
                  >
                    {loading ? "Marking as complete..." : "✓ Mark Session Complete"}
                  </button>
                </>
              )}

              {completed && (
                <div className="rounded-lg border border-green-400/30 bg-green-500/15 p-4 text-center text-green-200">
                  <p className="font-semibold">🎉 Great job! Session completed.</p>
                  <button
                    onClick={() => {
                      setMood(null);
                      setCompleted(false);
                      setSessionNotes("");
                    }}
                    className="mt-2 text-sm font-semibold underline"
                  >
                    Check in again for tomorrow
                  </button>
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-lg border border-white/10 bg-white/5 p-4 text-center">
              <p className="text-slate-300">No sessions scheduled for today. Great job staying ahead!</p>
            </div>
          )}
        </div>
      )}

      {error && <div className="mt-4 rounded border border-red-400/30 bg-red-500/15 p-3 text-sm text-red-200">{error}</div>}
    </div>
  );
}
