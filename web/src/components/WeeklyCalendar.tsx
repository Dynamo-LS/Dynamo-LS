import type { WeeklySchedule } from "../types";

interface WeeklyCalendarProps {
  week: WeeklySchedule | null;
}

export function WeeklyCalendar({ week }: WeeklyCalendarProps) {
  if (!week) {
    return <p className="text-slate-600">Generate a schedule to see your weekly calendar.</p>;
  }

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full border-separate border-spacing-y-2 text-left">
        <thead>
          <tr className="text-xs uppercase tracking-wider text-slate-500">
            <th>Day</th>
            <th>Topic</th>
            <th>Type</th>
            <th>Duration</th>
            <th>Intensity</th>
          </tr>
        </thead>
        <tbody>
          {week.sessions.map((s) => (
            <tr key={s.id} className="rounded-xl bg-white/80 text-sm text-slate-700">
              <td className="rounded-l-xl px-3 py-2 font-semibold">{s.scheduled_date}</td>
              <td className="px-3 py-2">{s.topic}</td>
              <td className="px-3 py-2 capitalize">{s.session_type}</td>
              <td className="px-3 py-2">{s.duration_minutes} min</td>
              <td className="rounded-r-xl px-3 py-2 capitalize">{s.completed ? "done" : "pending"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
