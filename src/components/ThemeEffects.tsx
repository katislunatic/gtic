import { useEffect, useMemo, useState, type CSSProperties } from "react";
import { useSiteTheme } from "@/lib/siteThemes";

// Decoration only: a full-screen, click-through layer of drifting particles
// that appears when a seasonal theme is active. Colors, speeds and the tint
// live in src/themes.css so nothing here hardcodes palette values.

type Particle = {
  left: number;
  size: number;
  opacity: number;
  delay: number;
  duration: number;
  drift: number;
};

const PARTICLE_COUNT = 18;

// Deterministic pseudo-random so the layout is identical on every render
// instead of jumping around whenever the component re-renders.
const makeRandom = (seed: number) => {
  let state = seed;
  return () => {
    state = (state * 1664525 + 1013904223) % 4294967296;
    return state / 4294967296;
  };
};

export const ThemeEffects = () => {
  const theme = useSiteTheme();
  const [motionOk, setMotionOk] = useState(false);

  // The drifting layer is pure decoration, so it is skipped entirely for
  // visitors who ask their device for reduced motion.
  useEffect(() => {
    if (typeof window === "undefined" || !window.matchMedia) return;
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const apply = () => setMotionOk(!query.matches);
    apply();
    query.addEventListener("change", apply);
    return () => query.removeEventListener("change", apply);
  }, []);

  const particles = useMemo<Particle[]>(() => {
    const random = makeRandom(20261024);
    return Array.from({ length: PARTICLE_COUNT }, () => ({
      left: random() * 100,
      size: 4 + random() * 8,
      opacity: 0.2 + random() * 0.4,
      delay: -random() * 24,
      duration: 14 + random() * 18,
      drift: (random() - 0.5) * 140,
    }));
  }, []);

  if (theme === "default" || !motionOk) return null;

  return (
    <div aria-hidden className="gte-theme-layer">
      {particles.map((particle, index) => (
        <span
          key={index}
          className="gte-theme-particle"
          style={
            {
              left: `${particle.left}%`,
              width: `${particle.size}px`,
              height: `${particle.size}px`,
              opacity: particle.opacity,
              animationDelay: `${particle.delay}s`,
              animationDuration: `${particle.duration}s`,
              "--gte-drift": `${particle.drift}px`,
            } as CSSProperties
          }
        />
      ))}
    </div>
  );
};
