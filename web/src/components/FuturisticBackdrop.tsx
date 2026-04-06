import { motion, useMotionValue, useSpring } from "framer-motion";
import { useEffect } from "react";

export default function FuturisticBackdrop() {
  const mx = useMotionValue(0);
  const my = useMotionValue(0);

  const sx = useSpring(mx, { stiffness: 120, damping: 18, mass: 0.5 });
  const sy = useSpring(my, { stiffness: 120, damping: 18, mass: 0.5 });

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      mx.set(e.clientX - 140);
      my.set(e.clientY - 140);
    };

    window.addEventListener("mousemove", onMove);
    return () => window.removeEventListener("mousemove", onMove);
  }, [mx, my]);

  return (
    <>
      <div className="app-noise" />
      <div className="app-grid" />

      <motion.div
        className="cursor-aura"
        style={{ x: sx, y: sy }}
      />

      <motion.div
        className="ambient-orb ambient-orb-1"
        animate={{ x: [0, 20, -10, 0], y: [0, 24, 6, 0], scale: [1, 1.08, 0.95, 1] }}
        transition={{ duration: 14, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        className="ambient-orb ambient-orb-2"
        animate={{ x: [0, -18, 14, 0], y: [0, -20, 12, 0], scale: [1, 0.94, 1.05, 1] }}
        transition={{ duration: 16, repeat: Infinity, ease: "easeInOut" }}
      />
    </>
  );
}
