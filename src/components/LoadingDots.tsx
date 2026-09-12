import { useEffect, useState } from "react";

interface LoadingDotsProps {
  /** Text shown before the animated dots, e.g. "Loading" */
  label?: string;
  /** How fast the dots cycle, in ms */
  intervalMs?: number;
}

/**
 * A small branded spinner (blue-to-red ring, matching the site's gradient)
 * above a "Loading." -> "Loading.." -> "Loading..." label on a loop.
 * Used as a placeholder while async data (like Discord member counts) or a
 * lazy-loaded page is still being fetched, instead of a bare loading string
 * or a stale/fake number.
 */
export function LoadingDots({ label = "Loading", intervalMs = 450 }: LoadingDotsProps) {
  const [dotCount, setDotCount] = useState(1);

  useEffect(() => {
    const id = setInterval(() => {
      setDotCount((prev) => (prev % 3) + 1);
    }, intervalMs);
    return () => clearInterval(id);
  }, [intervalMs]);

  return (
    // Stays a single inline unit (span, not a block/flex-col container) —
    // this gets dropped straight into places like a stat card's big number
    // slot, or inline next to a small status dot, so it can't change from
    // an inline flow element to a block one without breaking those layouts.
    <span aria-live="polite" className="inline-flex items-center gap-1.5 align-middle">
      <span
        role="presentation"
        className="inline-block h-3.5 w-3.5 shrink-0 rounded-full border-2 border-transparent border-t-primary border-r-secondary animate-spin"
        style={{ animationDuration: "700ms" }}
      />
      <span className="text-muted-foreground">
        {label}
        {/* Fixed-width reservation for the dots so the label doesn't shift
            side to side as the dot count cycles. */}
        <span className="inline-block w-[1.5ch] text-left">{".".repeat(dotCount)}</span>
      </span>
    </span>
  );
}
