import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import type { LoginProfile } from "../types";
import { getWorkspaceByName } from "../lib/workspaceStore";

interface Props {
  onLogin: (profile: LoginProfile) => Promise<void>;
}

export default function LoginPage({ onLogin }: Props) {
  const [name, setName] = useState("");
  const [age, setAge] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasSavedWorkspace, setHasSavedWorkspace] = useState(false);

  useEffect(() => {
    let active = true;

    const lookup = async () => {
      const cleanName = name.trim();
      if (!cleanName) {
        if (active) setHasSavedWorkspace(false);
        return;
      }

      try {
        const existing = await getWorkspaceByName(cleanName);
        if (active) {
          setHasSavedWorkspace(Boolean(existing));
        }
      } catch {
        if (active) {
          setHasSavedWorkspace(false);
        }
      }
    };

    lookup();

    return () => {
      active = false;
    };
  }, [name]);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();

    const cleanName = name.trim().replace(/\s+/g, " ");
    const numericAge = Number(age);

    if (!cleanName) {
      setError("Enter your name to continue.");
      return;
    }

    if (!Number.isFinite(numericAge) || numericAge < 5 || numericAge > 120) {
      setError("Enter a valid age between 5 and 120.");
      return;
    }

    setError("");
    setLoading(true);
    try {
      await onLogin({
        name: cleanName,
        age: numericAge,
        created_at: new Date().toISOString(),
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="relative mx-auto flex min-h-screen max-w-6xl items-center px-4 py-10">
      <motion.div
        className="grid w-full gap-6 lg:grid-cols-[1.15fr_0.85fr]"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.55, ease: "easeOut" }}
      >
        <div className="glass-panel overflow-hidden p-8 md:p-10">
          <p className="text-xs font-semibold uppercase tracking-[0.26em] text-cyan-200/80">
            Dynamic Learning Scheduler
          </p>
          <h1 className="mt-3 max-w-xl bg-gradient-to-r from-cyan-100 via-blue-100 to-violet-100 bg-clip-text text-4xl font-extrabold tracking-tight text-transparent md:text-6xl">
            Enter once. Stay signed in until logout.
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-7 text-slate-300 md:text-lg">
            Save your identity in IndexedDB, then move into the study planner without repeated logins.
            Your name powers the dashboard, and your profile stays available until you explicitly log out.
          </p>

          <div className="mt-8 grid gap-3 sm:grid-cols-3">
            {[
              "Name and age captured once",
              "Profile cached locally",
              "Same name restores data",
            ].map((item) => (
              <div key={item} className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-slate-200">
                {item}
              </div>
            ))}
          </div>
        </div>

        <motion.form
          onSubmit={handleSubmit}
          className="glass-panel p-8 md:p-10"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.08, duration: 0.55, ease: "easeOut" }}
        >
          <div className="mb-6">
            <p className="text-sm font-semibold uppercase tracking-[0.22em] text-cyan-200/70">Login</p>
            <h2 className="mt-2 text-2xl font-bold text-white">Welcome back</h2>
            <p className="mt-2 text-sm leading-6 text-slate-300">
                Log in with your name to restore your saved data. If this name already exists, your previous schedule and progress are loaded.
            </p>
          </div>

          <div className="space-y-4">
            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-200">Your name</span>
              <input
                value={name}
                onChange={(event) => setName(event.target.value)}
                placeholder="Alex Chen"
                className="input"
                autoComplete="name"
              />
              {hasSavedWorkspace ? (
                <p className="text-xs text-cyan-200">
                  Existing workspace found for this name. Your previous schedule and progress will be restored.
                </p>
              ) : null}
            </label>

            <label className="block space-y-2">
              <span className="text-sm font-medium text-slate-200">Your age</span>
              <input
                value={age}
                onChange={(event) => setAge(event.target.value)}
                placeholder="21"
                type="number"
                min={5}
                max={120}
                className="input"
                autoComplete="off"
              />
            </label>
          </div>

          <button type="submit" disabled={loading} className="button-primary mt-6 w-full py-3 disabled:opacity-60">
            {loading ? "Opening your workspace..." : "Continue to planner"}
          </button>

          {error ? <p className="mt-4 rounded-xl border border-red-400/20 bg-red-400/10 p-3 text-sm text-red-100">{error}</p> : null}
        </motion.form>
      </motion.div>
    </div>
  );
}