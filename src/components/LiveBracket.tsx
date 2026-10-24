import { useLayoutEffect, useRef, useState } from "react";
import type { LiveBracketData } from "@/lib/gtecApi";

// Draws the live elimination bracket: the blank bracket template with each
// team's tag written into its box, exactly like the bot's own bracket image
// (same box positions, measured from the template, which is 1777x885).
//
// Needs the blank template at public/bracket-template.png. The optional custom
// font goes in public/fonts/BracketFont.ttf (same file the bot uses).

const W = 1777;
const H = 885;

// [x, y, width, height] of each white box on the template.
type Box = [number, number, number, number];

const R1_LEFT: Box[] = [[51, 79, 192, 64], [51, 173, 192, 65], [51, 270, 192, 66], [51, 369, 192, 65], [51, 466, 192, 64], [51, 564, 192, 65], [51, 661, 192, 65], [51, 759, 192, 64]];
const R1_RIGHT: Box[] = [[1533, 79, 193, 64], [1534, 173, 192, 65], [1534, 270, 191, 66], [1534, 369, 191, 65], [1534, 466, 191, 64], [1534, 564, 191, 65], [1534, 661, 191, 65], [1534, 759, 191, 64]];
const R2_LEFT: Box[] = [[301, 133, 181, 65], [301, 323, 181, 66], [301, 518, 181, 66], [301, 711, 181, 65]];
const R2_RIGHT: Box[] = [[1294, 134, 181, 64], [1294, 323, 182, 65], [1294, 518, 182, 66], [1294, 711, 181, 65]];
const R3_LEFT: Box[] = [[540, 226, 183, 64], [540, 611, 180, 63]];
const R3_RIGHT: Box[] = [[1052, 225, 184, 64], [1053, 611, 183, 63]];
const R4: Box[] = [[777, 294, 217, 65], [777, 573, 217, 65]];

// Slot key is "R{round}-{index}"; index is the position in these arrays.
const BOX_MAP: Record<number, Box[]> = {
  1: [...R1_LEFT, ...R1_RIGHT],
  2: [...R2_LEFT, ...R2_RIGHT],
  3: [...R3_LEFT, ...R3_RIGHT],
  4: R4,
};

const BASE_URL = import.meta.env.BASE_URL || "/";
export const BRACKET_TEMPLATE_URL = `${BASE_URL}bracket-template.png`;
const FONT_URL = `${BASE_URL}fonts/BracketFont.ttf`;

const FONT_FAMILY = "'BracketFont', Arial, sans-serif";
const BASE_SIZE = 34;
const MIN_SIZE = 14;
const PAD_X = 12;

// One team label, shrunk until it fits inside its box.
const FitText = ({ box, label }: { box: Box; label: string }) => {
  const ref = useRef<SVGTextElement>(null);
  const [size, setSize] = useState(BASE_SIZE);
  const [x, y, w, h] = box;

  useLayoutEffect(() => {
    const el = ref.current;
    if (!el) return;
    const fit = () => {
      const current = parseFloat(el.getAttribute("font-size") || String(BASE_SIZE));
      const len = el.getComputedTextLength();
      if (!len || !current) return;
      // Text width grows in proportion to font size, so one step is enough.
      const next = Math.floor((current * (w - PAD_X * 2)) / len);
      setSize(Math.max(MIN_SIZE, Math.min(BASE_SIZE, next)));
    };
    fit();
    // Re-measure once the custom font has actually loaded.
    document.fonts?.ready.then(fit).catch(() => undefined);
  }, [label, w]);

  return (
    <text
      ref={ref}
      x={x + w / 2}
      y={y + h / 2}
      dy="0.35em"
      textAnchor="middle"
      fontSize={size}
      fontWeight={700}
      fill="#111111"
      style={{ fontFamily: FONT_FAMILY }}
    >
      {label}
    </text>
  );
};

export const LiveBracket = ({ bracket }: { bracket: LiveBracketData }) => {
  return (
    <svg
      viewBox={`0 0 ${W} ${H}`}
      className="w-full h-auto"
      role="img"
      aria-label={`GTEC Season ${bracket.season ?? ""} bracket`}
    >
      <style>{`@font-face { font-family: 'BracketFont'; src: url('${FONT_URL}') format('truetype'); font-weight: 700; font-display: swap; }`}</style>
      <image href={BRACKET_TEMPLATE_URL} x={0} y={0} width={W} height={H} />
      {Object.entries(BOX_MAP).map(([round, boxes]) =>
        boxes.map((box, i) => {
          const slot = bracket.slots[`R${round}-${i}`];
          if (!slot) return null;
          const label = round === "1" && slot.seed != null ? `(${slot.seed}) ${slot.abbr}` : slot.abbr;
          return <FitText key={`${round}-${i}`} box={box} label={label} />;
        })
      )}
    </svg>
  );
};
