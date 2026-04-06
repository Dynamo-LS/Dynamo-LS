import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import Particles from "react-tsparticles";
import { loadSlim } from "tsparticles-slim";
import type { Engine } from "tsparticles-engine";
import type { ISourceOptions } from "tsparticles-engine";

interface CinematicIntroProps {
  onComplete: () => void;
}

const INTRO_DURATION_MS = 9000;

export default function CinematicIntro({ onComplete }: CinematicIntroProps) {
  const [elapsedMs, setElapsedMs] = useState(0);

  useEffect(() => {
    const started = performance.now();
    let rafId = 0;

    const tick = () => {
      const now = performance.now();
      const elapsed = now - started;
      setElapsedMs(elapsed);
      if (elapsed >= INTRO_DURATION_MS) {
        onComplete();
        return;
      }
      rafId = requestAnimationFrame(tick);
    };

    rafId = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(rafId);
  }, [onComplete]);

  const particlesInit = useCallback(async (engine: Engine) => {
    await loadSlim(engine);
  }, []);

  const particleOptions = useMemo<ISourceOptions>(
    () => ({
      fullScreen: { enable: false },
      background: { color: { value: "transparent" } },
      particles: {
        number: { value: 60, density: { enable: true, area: 1000 } },
        color: { value: ["#2dd4ff", "#5f7cff", "#a855f7"] },
        links: {
          enable: true,
          distance: 130,
          opacity: 0.22,
          color: "#60a5fa",
          width: 1,
        },
        move: {
          enable: true,
          speed: 0.8,
          outModes: { default: "out" as const },
        },
        opacity: { value: { min: 0.15, max: 0.55 } },
        size: { value: { min: 1, max: 3.2 } },
      },
      detectRetina: true,
    }),
    []
  );

  const finalPhase = elapsedMs >= 7000;

  return (
    <div className="fixed inset-0 z-[100] overflow-hidden bg-[#060a16] text-white">
      <div className="absolute inset-0 intro-grid" />

      <motion.div
        className="absolute inset-0 bg-[radial-gradient(circle_at_50%_48%,rgba(80,170,255,0.34),transparent_45%)]"
        initial={{ opacity: 0.2 }}
        animate={{ opacity: [0.2, 0.5, 0.25] }}
        transition={{ duration: 2, repeat: 1, ease: "easeInOut" }}
      />

      <motion.div
        className="absolute inset-0"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.8 }}
      >
        <Particles id="dls-intro-particles" init={particlesInit} options={particleOptions} />
      </motion.div>

      <motion.div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[34rem] w-[34rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/25"
        initial={{ opacity: 0, scale: 0.7 }}
        animate={{ opacity: [0, 0.8, 0.25], scale: [0.7, 1.18, 1.35] }}
        transition={{ delay: 0.2, duration: 2.3, ease: "easeOut" }}
      />

      <motion.div
        className="pointer-events-none absolute left-1/2 top-1/2 h-96 w-96 -translate-x-1/2 -translate-y-1/2 rounded-full bg-[conic-gradient(from_0deg,#2dd4ff_0deg,#6366f1_140deg,#a855f7_260deg,#2dd4ff_360deg)] opacity-35 blur-3xl"
        initial={{ opacity: 0, rotate: 0, scale: 0.4 }}
        animate={{ opacity: [0, 0.5, 0.25], rotate: 360, scale: [0.4, 1, 1] }}
        transition={{ delay: 2, duration: 2.3, ease: "easeOut" }}
      />

      <motion.div
        className="pointer-events-none absolute left-1/2 top-1/2 h-[22rem] w-[22rem] -translate-x-1/2 -translate-y-1/2 rounded-full border border-violet-400/40"
        initial={{ opacity: 0, rotate: 0 }}
        animate={{ opacity: [0, 0.6, 0.2], rotate: 390 }}
        transition={{ delay: 2.2, duration: 2.2, ease: "easeInOut" }}
      />

      <motion.div
        className="pointer-events-none absolute left-1/2 top-1/2 h-64 w-64 -translate-x-1/2 -translate-y-1/2 rounded-full border border-cyan-300/50"
        initial={{ opacity: 0, rotate: 320, scale: 0.85 }}
        animate={{ opacity: [0, 0.7, 0.2], rotate: -120, scale: [0.85, 1, 1] }}
        transition={{ delay: 2.1, duration: 2.4, ease: "easeInOut" }}
      />

      <div className="absolute inset-0 flex flex-col items-center justify-center px-6 text-center">
        <motion.svg
          viewBox="0 0 220 220"
          className="mb-8 h-28 w-28"
          initial={{ opacity: 0, scale: 0.75, rotate: -20 }}
          animate={{ opacity: 1, scale: 1, rotate: 0 }}
          transition={{ delay: 3.8, duration: 0.8, ease: [0.2, 0.8, 0.2, 1] }}
        >
          <defs>
            <linearGradient id="dynamoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="#22d3ee" />
              <stop offset="48%" stopColor="#4f46e5" />
              <stop offset="100%" stopColor="#a855f7" />
            </linearGradient>
          </defs>
          <motion.circle
            cx="110"
            cy="110"
            r="78"
            fill="none"
            stroke="url(#dynamoGradient)"
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray="490"
            strokeDashoffset="490"
            animate={{ strokeDashoffset: 0 }}
            transition={{ delay: 4, duration: 1.1, ease: "easeOut" }}
          />
          <motion.path
            d="M70 130 C85 82, 134 82, 150 130"
            fill="none"
            stroke="url(#dynamoGradient)"
            strokeWidth="9"
            strokeLinecap="round"
            strokeDasharray="210"
            strokeDashoffset="210"
            animate={{ strokeDashoffset: 0 }}
            transition={{ delay: 4.2, duration: 1, ease: "easeOut" }}
          />
          <motion.line
            x1="110"
            y1="32"
            x2="110"
            y2="74"
            stroke="#8ce9ff"
            strokeWidth="8"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            transition={{ delay: 4.1, duration: 0.6 }}
          />
          <motion.circle
            cx="110"
            cy="110"
            r="10"
            fill="#9ae6ff"
            initial={{ scale: 0 }}
            animate={{ scale: [0, 1.25, 1] }}
            transition={{ delay: 4.5, duration: 0.55 }}
          />
        </motion.svg>

        <motion.h1
          className="intro-glitch relative font-heading text-5xl font-bold tracking-tight text-white drop-shadow-[0_0_20px_rgba(80,190,255,0.45)] md:text-7xl"
          initial={{ opacity: 0, y: 26, filter: "blur(8px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          transition={{ delay: 4.2, duration: 1.1, ease: [0.2, 0.8, 0.2, 1] }}
        >
          Dynamo LS
        </motion.h1>

        <motion.p
          className="mt-5 text-sm font-medium tracking-[0.18em] text-cyan-100/90 md:text-base"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 6, duration: 0.8, ease: "easeOut" }}
        >
          Power Your Learning. Dynamically.
        </motion.p>

        <motion.div
          className="pointer-events-none absolute h-56 w-56 rounded-full border border-cyan-200/25"
          initial={{ opacity: 0, scale: 0.6 }}
          animate={
            finalPhase
              ? { opacity: [0, 0.9, 0.1], scale: [0.8, 1.35, 1.65] }
              : { opacity: 0 }
          }
          transition={{ duration: 1.2, ease: "easeOut" }}
        />
      </div>

      <motion.button
        type="button"
        className="absolute right-5 top-5 rounded-full border border-white/25 bg-white/10 px-4 py-2 text-xs font-semibold tracking-[0.2em] text-white/80 backdrop-blur hover:bg-white/20"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7, duration: 0.4 }}
        onClick={onComplete}
      >
        SKIP
      </motion.button>
    </div>
  );
}
