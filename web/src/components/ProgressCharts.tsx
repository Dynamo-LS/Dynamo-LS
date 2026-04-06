import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

interface ProgressChartsProps {
  topicProgress: Array<{ topic: string; pct: number }>;
}

export function ProgressCharts({ topicProgress }: ProgressChartsProps) {
  if (!topicProgress.length) {
    return <p className="text-slate-600">Complete sessions to unlock topic progress analytics.</p>;
  }

  return (
    <div className="h-80 w-full">
      <ResponsiveContainer>
        <BarChart data={topicProgress}>
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis dataKey="topic" tick={{ fontSize: 11 }} />
          <YAxis domain={[0, 100]} />
          <Tooltip />
          <Bar dataKey="pct" fill="#ff6b35" radius={[6, 6, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
