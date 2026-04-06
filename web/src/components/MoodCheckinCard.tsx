import { useState } from "react";
import type { Mood, Session } from "../types";

interface MoodCheckinCardProps {
  loading: boolean;
  onCheckin: (mood: Mood) => Promise<void>;
  focus: Session | null;
  insight: string;
}

export function MoodCheckinCard({ loading, onCheckin, focus, insight }: MoodCheckinCardProps) {
  const [mood, setMood] = useState<Mood>("okay");

  return (
    <div className="space-y-4">
      <h2 className="font-heading text-2xl text-ink">Daily Mood Check-in</h2>
      <div className="flex flex-wrap gap-2">
        {(["tired", "okay", "energized"] as Mood[]).map((m) => (
          <button
            key={m}
            onClick={() => setMood(m)}
            className={`rounded-full px-3 py-1 text-sm font-semibold capitalize ${
              mood === m ? "bg-ink text-white" : "bg-slate-100 text-slate-700"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      <button className="button-primary" onClick={() => onCheckin(mood)} disabled={loading}>
        {loading ? "Adapting..." : "Generate Today Focus"}
      </button>

      {focus ? (
        <div className="rounded-xl bg-slate-50 p-4">
          <p className="text-xs uppercase tracking-wider text-slate-500">Today Focus</p>
          <h3 className="font-heading text-lg text-ink">{focus.topic}</h3>
          <p className="text-sm text-slate-700">
            {focus.duration_minutes} min • {focus.session_type}
          </p>
        </div>
      ) : null}

      {insight ? (
        <p className="rounded-xl border border-mint/30 bg-mint/10 p-3 text-sm text-emerald-900">{insight}</p>
      ) : null}
    </div>
  );
}
