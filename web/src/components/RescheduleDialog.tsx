import { useState } from "react";

interface RescheduleDialogProps {
  onSubmit: (message: string) => Promise<void>;
  loading: boolean;
}

const QUICK_MESSAGES = [
  "I missed 2 days and only have 10 minutes tonight",
  "I'm traveling Mon-Wed, adjust my plan",
  "I feel burnout, lighten this week",
];

export function RescheduleDialog({ onSubmit, loading }: RescheduleDialogProps) {
  const [message, setMessage] = useState(QUICK_MESSAGES[0]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onSubmit(message);
  };

  return (
    <form onSubmit={submit} className="space-y-3">
      <h3 className="font-heading text-xl text-ink">Reschedule / Adjust Plan</h3>
      <p className="text-sm text-slate-600">Use natural language to reshape your week in seconds.</p>

      <select className="input" value={message} onChange={(e) => setMessage(e.target.value)}>
        {QUICK_MESSAGES.map((msg) => (
          <option key={msg} value={msg}>
            {msg}
          </option>
        ))}
      </select>

      <textarea
        className="input min-h-24"
        value={message}
        onChange={(e) => setMessage(e.target.value)}
      />

      <button className="button-accent" type="submit" disabled={loading}>
        {loading ? "Rescheduling..." : "Apply AI Reschedule"}
      </button>
    </form>
  );
}
