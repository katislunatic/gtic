import { useEffect, useRef } from "react";
import { SITE_THEMES, useActiveSiteTheme } from "@/lib/siteThemes";
import { useThemeEffects } from "@/hooks/use-theme-effects";

// Full-screen seasonal particles (snow for Christmas, bats/pumpkins for
// Halloween). Drawn on a single canvas that is pointer-events-none, so it can
// never block a click, hover, or scroll, and it sits below the nav bar and any
// dialogs. Turned off when the visitor switches it off in Settings, when the
// theme has no effect, and for people who prefer reduced motion.

const HALLOWEEN_GLYPHS = ["🦇", "🎃", "🦇", "🍂", "👻"];
const EMOJI_FONT = `"Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif`;

interface Particle {
  x: number;
  y: number;
  size: number; // radius for snow, font size for emoji
  speed: number; // px per second, downward
  phase: number;
  phaseSpeed: number;
  sway: number; // horizontal sway amplitude in px
  alpha: number;
  glyph?: string;
  rot: number;
  rotSpeed: number;
}

const rand = (min: number, max: number) => min + Math.random() * (max - min);

export const ThemeEffects = () => {
  const themeId = useActiveSiteTheme();
  const { enabled } = useThemeEffects();
  const effect = SITE_THEMES[themeId].effect;
  const reducedMotion =
    typeof window !== "undefined" && window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
  const active = enabled && effect !== "none" && !reducedMotion;
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    if (!active) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    let w = 0;
    let h = 0;
    let raf = 0;
    let last = performance.now();
    let particles: Particle[] = [];

    const make = (startAnywhere: boolean): Particle => {
      const isSnow = effect === "snow";
      const size = isSnow ? rand(1.2, 4) : rand(16, 30);
      return {
        x: rand(0, w),
        y: startAnywhere ? rand(0, h) : rand(-40, -8),
        size,
        speed: isSnow ? rand(35, 55) + size * 9 : rand(22, 48),
        phase: rand(0, Math.PI * 2),
        phaseSpeed: rand(0.4, 1.2),
        sway: isSnow ? rand(8, 26) : rand(14, 36),
        alpha: isSnow ? rand(0.45, 0.95) : rand(0.7, 0.95),
        glyph: isSnow ? undefined : HALLOWEEN_GLYPHS[Math.floor(Math.random() * HALLOWEEN_GLYPHS.length)],
        rot: rand(-0.4, 0.4),
        rotSpeed: rand(-0.5, 0.5),
      };
    };

    const resize = () => {
      const dpr = Math.min(window.devicePixelRatio || 1, 2);
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = Math.floor(w * dpr);
      canvas.height = Math.floor(h * dpr);
      canvas.style.width = `${w}px`;
      canvas.style.height = `${h}px`;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

      const target =
        effect === "snow"
          ? Math.min(150, Math.max(45, Math.round((w * h) / 13000)))
          : Math.min(30, Math.max(10, Math.round((w * h) / 55000)));
      while (particles.length < target) particles.push(make(true));
      if (particles.length > target) particles.length = target;
    };

    const frame = (now: number) => {
      // Clamp so a throttled/background tab doesn't make everything jump.
      const dt = Math.min((now - last) / 1000, 0.1);
      last = now;
      ctx.clearRect(0, 0, w, h);

      for (const p of particles) {
        p.y += p.speed * dt;
        p.phase += p.phaseSpeed * dt;
        p.rot += p.rotSpeed * dt;
        if (p.y > h + 40) Object.assign(p, make(false));

        const x = p.x + Math.sin(p.phase) * p.sway;
        ctx.globalAlpha = p.alpha;
        if (effect === "snow") {
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.arc(x, p.y, p.size, 0, Math.PI * 2);
          ctx.fill();
        } else if (p.glyph) {
          ctx.save();
          ctx.translate(x, p.y);
          ctx.rotate(Math.sin(p.rot) * 0.5);
          ctx.font = `${p.size}px ${EMOJI_FONT}`;
          ctx.textAlign = "center";
          ctx.textBaseline = "middle";
          ctx.fillText(p.glyph, 0, 0);
          ctx.restore();
        }
      }
      ctx.globalAlpha = 1;
      raf = requestAnimationFrame(frame);
    };

    resize();
    window.addEventListener("resize", resize);
    raf = requestAnimationFrame(frame);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", resize);
      ctx.clearRect(0, 0, w, h);
    };
  }, [active, effect]);

  if (!active) return null;

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      className="fixed inset-0 z-[45] pointer-events-none"
    />
  );
};
