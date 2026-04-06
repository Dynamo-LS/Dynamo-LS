import { useMemo } from "react";
import type { AppState, Progress } from "../types";

interface Props {
  appState: AppState;
}

export default function DashboardPage({ appState }: Props) {
  const sessions = appState.schedule?.sessions ?? [];

  const progress: Progress | null = useMemo(() => {
    if (!appState.user_id || sessions.length === 0) {
      return appState.progress;
    }

    const planned = sessions.length;
    const completed = sessions.filter((session) => session.completed);
    const completedCount = completed.length;
    const topicsCompleted = Array.from(new Set(completed.map((session) => session.topic)));

    return {
      user_id: appState.user_id,
      total_sessions_planned: planned,
      total_sessions_completed: completedCount,
      current_streak: completedCount,
      topics_completed: topicsCompleted,
      completion_percentage: planned > 0 ? (completedCount / planned) * 100 : 0,
      estimated_completion_date: new Date(Date.now() + Math.max(0, planned - completedCount) * 86400000).toISOString(),
      last_updated: new Date().toISOString(),
    };
  }, [appState.progress, appState.user_id, sessions]);

  const dashboardData = useMemo(() => {
    const topics: Record<string, { total: number; completed: number }> = {};
    for (const session of sessions) {
      const key = session.topic;
      if (!topics[key]) {
        topics[key] = { total: 0, completed: 0 };
      }
      topics[key].total += 1;
      if (session.completed) {
        topics[key].completed += 1;
      }
    }

    return {
      topic_progress: Object.entries(topics).map(([topic, value]) => ({
        topic,
        pct: value.total > 0 ? Math.round((value.completed / value.total) * 100) : 0,
      })),
    };
  }, [sessions]);

  const summary = useMemo(() => {
    if (!progress) return "";
    return [
      `Completed ${progress.total_sessions_completed} of ${progress.total_sessions_planned} planned sessions.`,
      `Current completion is ${Math.round(progress.completion_percentage)}%.`,
      "Keep momentum by finishing at least one planned session daily.",
    ].join("\n");
  }, [progress]);

  if (!appState.user_id) {
    return (
      <div className="p-6 text-center">
        <p className="text-slate-300">Create a plan in the Start tab first.</p>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6">
      <h2 className="text-2xl font-bold text-slate-100">4. Progress Dashboard</h2>

      {progress && (
        <>
          {/* Key Metrics */}
          <div className="grid gap-4 md:grid-cols-4">
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-semibold uppercase text-slate-400">Streak</p>
              <p className="mt-2 text-3xl font-bold text-slate-100">{progress.current_streak}</p>
              <p className="text-sm text-slate-300">days</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-semibold uppercase text-slate-400">Completion</p>
              <p className="mt-2 text-3xl font-bold text-slate-100">
                {Math.round(progress.completion_percentage)}%
              </p>
              <p className="text-sm text-slate-300">
                {progress.total_sessions_completed}/{progress.total_sessions_planned}
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-semibold uppercase text-slate-400">Est. Completion</p>
              <p className="mt-2 text-lg font-bold text-slate-100">
                {new Date(progress.estimated_completion_date).toLocaleDateString()}
              </p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <p className="text-xs font-semibold uppercase text-slate-400">Topics Completed</p>
              <p className="mt-2 text-3xl font-bold text-slate-100">
                {progress.topics_completed.length}
              </p>
            </div>
          </div>

          {/* Topic Progress */}
          {dashboardData?.topic_progress && dashboardData.topic_progress.length > 0 && (
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <h3 className="font-semibold text-slate-100">Topic Breakdown</h3>
              <div className="mt-4 space-y-3">
                {dashboardData.topic_progress.map((topic: any) => (
                  <div key={topic.topic}>
                    <div className="flex justify-between text-sm">
                      <p className="text-slate-200">{topic.topic}</p>
                      <p className="font-semibold text-slate-100">{topic.pct}%</p>
                    </div>
                    <div className="mt-1 h-2 w-full rounded-full bg-slate-700">
                      <div
                        className="h-full rounded-full bg-blue-500"
                        style={{ width: `${topic.pct}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Weekly Summary */}
          {summary && (
            <div className="rounded-lg border border-white/10 bg-white/5 p-4">
              <h3 className="font-semibold text-slate-100">Weekly Insights</h3>
              <p className="mt-3 whitespace-pre-wrap text-sm text-slate-300">{summary}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}
