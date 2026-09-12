// Hidden SVG filter definitions used by the Liquid Glass visual mode.
// Renders nothing visible itself — .liquid-glass panels reference these
// filters via `backdrop-filter: url(#liquid-glass-distort)` in index.css.
// Only Chromium-based browsers currently support SVG filters inside
// backdrop-filter, so everywhere else silently falls back to the
// standard frosted-glass look defined in index.css.
export function LiquidGlassDefs() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      style={{ position: "absolute", width: 0, height: 0, overflow: "hidden" }}
    >
      <defs>
        <filter id="liquid-glass-distort" x="-10%" y="-10%" width="120%" height="120%">
          {/* Organic noise field used to bend the backdrop, like light passing through glass.
              Kept low-res/low-octave on purpose — this filter recalculates every frame
              on Chromium, so a cheaper noise field means noticeably less jank. */}
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.01"
            numOctaves="1"
            seed="7"
            result="noise"
          />
          {/* Push pixels around based on the noise field — this is the "refraction".
              Scale is intentionally subtle so it reads as glass, not a funhouse mirror. */}
          <feDisplacementMap
            in="SourceGraphic"
            in2="noise"
            scale="8"
            xChannelSelector="R"
            yChannelSelector="G"
          />
        </filter>
      </defs>
    </svg>
  );
}
