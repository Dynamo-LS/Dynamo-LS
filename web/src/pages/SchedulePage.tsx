import { useState } from "react";
import { reschedule } from "../api";
import type { AppState } from "../types";

interface Props {
  appState: AppState;
  setAppState: (update: Partial<AppState>) => void;
}

export default function SchedulePage({ appState, setAppState }: Props) {
  const [rescheduleMessage, setRescheduleMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showAdjustPanel, setShowAdjustPanel] = useState(false);

  const applyLocalReschedule = (message: string) => {
    if (!appState.schedule) return;
    const match = message.match(/(\d+)\s*(min|minutes)/i);
    if (!match) return;

    const minutes = Math.max(10, Math.min(120, Number(match[1])));
    const nextPending = appState.schedule.sessions.findIndex((s) => !s.completed);
    if (nextPending < 0) return;

    const sessions = [...appState.schedule.sessions];
    sessions[nextPending] = {
      ...sessions[nextPending],
      duration_minutes: minutes,
      notes: "Locally adjusted based on your time constraint",
    };

    setAppState({
      schedule: {
        ...appState.schedule,
        sessions,
        generated_at: new Date().toISOString(),
      },
    });
  };

  if (!appState.schedule) {
    return (
      <div className="p-6 text-center">
        <p className="text-slate-300">Create a plan in the Start tab to view your schedule.</p>
        {error ? <p className="mt-2 text-sm text-red-300">{error}</p> : null}
      </div>
    );
  }

  const handleReschedule = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    try {
      const result = await reschedule(appState.user_id, rescheduleMessage);
      setAppState({ schedule: result.updated_schedule });
      setRescheduleMessage("");
    } catch (err) {
      applyLocalReschedule(rescheduleMessage);
      setRescheduleMessage("");
      setError("Server unavailable. Applied local reschedule from your saved plan.");
    } finally {
      setLoading(false);
    }
  };

  const days = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
  const topicStages = [
    "Foundations",
    "Syntax Basics",
    "Core Concepts",
    "Hands-on Practice",
    "Applied Exercises",
    "Review and Reinforcement",
    "Assessment and Recap",
  ];
  const sessionsByDay: Record<string, typeof appState.schedule.sessions> = {};
  
  days.forEach((day) => {
    sessionsByDay[day] = [];
  });

  appState.schedule.sessions.forEach((session) => {
    const dateObj = new Date(session.scheduled_date);
    const dayIndex = dateObj.getDay();
    const dayName = days[(dayIndex + 6) % 7]; // Adjust for Mon=0
    if (sessionsByDay[dayName]) {
      sessionsByDay[dayName].push(session);
    }
  });

  const totalSessions = appState.schedule.sessions.length;
  const completedSessions = appState.schedule.sessions.filter((session) => session.completed).length;
  const plannedMinutes = appState.schedule.sessions.reduce((sum, session) => sum + session.duration_minutes, 0);
  const restDays = days.filter((day) => sessionsByDay[day].length === 0).length;

  const typeClassMap: Record<string, string> = {
    learn: "border-blue-300/40 bg-blue-500/15 text-blue-100",
    practice: "border-emerald-300/35 bg-emerald-500/15 text-emerald-100",
    review: "border-amber-300/35 bg-amber-500/15 text-amber-100",
  };

  const getSessionHeadline = (session: (typeof appState.schedule.sessions)[number], dayIndex: number) => {
    const stage = topicStages[dayIndex % topicStages.length];
    const baseTopic = session.topic.replace(/\s*[-–—]\s*(Foundations|Syntax Basics|Core Concepts|Hands-on Practice|Applied Exercises|Review and Reinforcement|Assessment and Recap)$/i, "");

    if (baseTopic.trim().length > 0 && baseTopic !== session.topic) {
      return `${baseTopic.trim()} • ${stage}`;
    }

    return `${stage}`;
  };

  return (
    <div className="space-y-6 p-6">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-white/10 via-white/[0.04] to-transparent p-5 shadow-[0_20px_70px_rgba(12,24,60,0.35)]">
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-cyan-200/80">Routine Intelligence</p>
            <h2 className="mt-2 text-3xl font-bold text-white">2. Your Weekly Schedule</h2>
            <p className="mt-2 text-sm text-slate-300">A competitive routine board with clear load, momentum, and room to adapt.</p>
          </div>
          <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
            <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center">
              <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Sessions</p>
              <p className="mt-1 text-lg font-bold text-slate-100">{totalSessions}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center">
              <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Completed</p>
              <p className="mt-1 text-lg font-bold text-emerald-200">{completedSessions}</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center">
              <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Load</p>
              <p className="mt-1 text-lg font-bold text-blue-200">{plannedMinutes}m</p>
            </div>
            <div className="rounded-xl border border-white/10 bg-white/5 px-3 py-2 text-center">
              <p className="text-[11px] uppercase tracking-[0.16em] text-slate-400">Rest Days</p>
              <p className="mt-1 text-lg font-bold text-amber-200">{restDays}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="space-y-3 md:hidden">
        {days.map((day, dayIndex) => {
          const daySessions = sessionsByDay[day];
          const dayMinutes = daySessions.reduce((sum, session) => sum + session.duration_minutes, 0);

          return (
            <div
              key={day}
              className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.03] p-4"
            >
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-lg font-bold text-white">{day}</h3>
                <span className="rounded-full border border-white/15 bg-white/5 px-2 py-1 text-[11px] text-slate-300">
                  {daySessions.length === 0 ? "Rest" : `${dayMinutes}m`}
                </span>
              </div>

              {daySessions.length === 0 ? (
                <p className="rounded-lg border border-dashed border-white/15 bg-white/[0.02] px-3 py-3 text-sm text-slate-400">
                  Recovery block. No active sessions today.
                </p>
              ) : (
                <div className="space-y-2">
                  {daySessions.map((session) => (
                    <div
                      key={session.id}
                      className={`rounded-xl border px-3 py-2 text-sm ${typeClassMap[session.session_type] ?? "border-white/20 bg-white/10 text-slate-100"}`}
                    >
                      <p className="font-semibold">{getSessionHeadline(session, dayIndex)}</p>
                      <p className="mt-1 text-xs opacity-90">{session.topic}</p>
                      <p className="mt-1 text-xs opacity-90">{session.duration_minutes} min • {session.session_type}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.7fr_1fr]">
        <div className="hidden gap-3 md:grid md:grid-cols-2 xl:grid-cols-3">
          {days.map((day, dayIndex) => {
            const daySessions = sessionsByDay[day];
            const dayMinutes = daySessions.reduce((sum, session) => sum + session.duration_minutes, 0);

            return (
              <div
                key={day}
                className="group rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.07] to-white/[0.03] p-4 transition duration-200 hover:border-cyan-300/40 hover:shadow-[0_10px_35px_rgba(34,211,238,0.12)]"
              >
                <div className="flex items-center justify-between">
                  <h3 className="text-xl font-semibold text-slate-100">{day}</h3>
                  <span className="rounded-full border border-white/15 bg-white/5 px-2 py-1 text-[11px] font-semibold uppercase tracking-[0.12em] text-slate-300">
                    {daySessions.length === 0 ? "Rest" : `${dayMinutes}m`}
                  </span>
                </div>

                <div className="mt-3 space-y-2">
                  {daySessions.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-white/15 bg-white/[0.03] px-3 py-4 text-center text-sm text-slate-400">
                      Recovery block
                    </div>
                  ) : (
                    daySessions.map((session) => (
                      <div
                        key={session.id}
                        className={`rounded-xl border px-3 py-2 text-sm ${typeClassMap[session.session_type] ?? "border-white/20 bg-white/10 text-slate-100"}`}
                      >
                        <p className="truncate font-semibold" title={session.topic}>{getSessionHeadline(session, dayIndex)}</p>
                        <p className="mt-1 truncate text-xs opacity-90" title={session.topic}>{session.topic}</p>
                        <p className="mt-1 text-xs opacity-90">{session.duration_minutes} min • {session.session_type}</p>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>

        <div className="rounded-2xl border border-white/10 bg-gradient-to-b from-white/[0.08] to-white/[0.03] p-5">
          <h3 className="text-3xl font-bold text-slate-100">Adjust Your Plan</h3>
          <p className="mt-2 text-base text-slate-300">
            Drop a natural-language constraint and the routine recalibrates instantly.
          </p>

          <button
            type="button"
            onClick={() => setShowAdjustPanel((prev) => !prev)}
            className="mt-4 w-full rounded-xl border border-white/15 bg-white/5 px-3 py-2 text-left text-sm font-semibold text-slate-200 transition hover:border-cyan-400/50 lg:hidden"
          >
            {showAdjustPanel ? "Hide adjust controls" : "Show adjust controls"}
          </button>

          <form onSubmit={handleReschedule} className={`mt-5 space-y-3 ${showAdjustPanel ? "block" : "hidden lg:block"}`}>
            <textarea
              value={rescheduleMessage}
              onChange={(e) => setRescheduleMessage(e.target.value)}
              placeholder="I missed 2 days and only have 20 minutes tomorrow"
              className="min-h-24 w-full resize-none rounded-xl border border-white/15 bg-white/5 px-3 py-3 text-sm text-slate-100 placeholder:text-slate-400 focus:border-cyan-400 focus:outline-none"
            />
            <div className="flex flex-wrap gap-2">
              {[
                "Missed 2 days",
                "Only 15 minutes today",
                "Traveling Mon-Wed",
                "Need lower intensity",
              ].map((idea) => (
                <button
                  key={idea}
                  type="button"
                  onClick={() => setRescheduleMessage(idea)}
                  className="rounded-full border border-white/15 bg-white/5 px-3 py-1 text-xs text-slate-200 hover:border-cyan-300/50 hover:bg-cyan-300/10"
                >
                  {idea}
                </button>
              ))}
            </div>
            <button
              type="submit"
              disabled={loading || !rescheduleMessage.trim()}
              className="w-full rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 px-3 py-3 text-sm font-semibold text-white hover:from-cyan-400 hover:to-blue-500 disabled:cursor-not-allowed disabled:from-slate-600 disabled:to-slate-500"
            >
              {loading ? "Rescheduling..." : "Generate New Schedule"}
            </button>
          </form>

          {error ? (
            <div className="mt-3 rounded-xl border border-red-400/30 bg-red-500/15 p-3 text-sm text-red-200">
              {error}
            </div>
          ) : null}

          <div className="mt-5 rounded-xl border border-white/10 bg-white/5 p-3 hidden lg:block">
            <p className="text-xs font-semibold uppercase tracking-[0.14em] text-slate-300">Prompt Ideas</p>
            <ul className="mt-2 space-y-2 text-sm text-slate-200">
              <li>Missed two days this week</li>
              <li>Only have 15 minutes today</li>
              <li>Traveling Monday to Wednesday</li>
              <li>Need a lower intensity plan</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
}
