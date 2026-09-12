import { useCallback, useRef, useState } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { Footer } from "@/components/Footer";
import { Copy, Check } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ColorCodeSelectorProps {
  isAdmin: boolean;
}

// Same 10 snap positions as the in-game slider.
const RGB_SNAP_VALUES = [0, 28, 57, 85, 113, 142, 170, 198, 227, 255];
const MAX_INDEX = RGB_SNAP_VALUES.length - 1; // 9

// A single vertical notch-track slider — the wooden groove with tick marks
// down the side and a chunky colored knob, matching the in-game panel.
const ChannelSlider = ({
  value,
  onChange,
  knobColor,
  trackRef,
}: {
  value: number; // 0-9
  onChange: (v: number) => void;
  knobColor: string;
  trackRef: (el: HTMLDivElement | null) => void;
}) => {
  const dragging = useRef(false);

  const setFromClientY = useCallback(
    (clientY: number, el: HTMLDivElement) => {
      const rect = el.getBoundingClientRect();
      const pad = 14; // keep the knob center within the track ends
      const usable = rect.height - pad * 2;
      const rel = Math.min(Math.max(clientY - rect.top - pad, 0), usable);
      // Top of the track = max value (9), bottom = 0 — matches the in-game
      // slider where pushing the block UP increases the number.
      const idx = Math.round(MAX_INDEX - (rel / usable) * MAX_INDEX);
      onChange(Math.min(Math.max(idx, 0), MAX_INDEX));
    },
    [onChange],
  );

  const trackElRef = useRef<HTMLDivElement | null>(null);

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    dragging.current = true;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    if (trackElRef.current) setFromClientY(e.clientY, trackElRef.current);
  };
  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!dragging.current || !trackElRef.current) return;
    setFromClientY(e.clientY, trackElRef.current);
  };
  const handlePointerUp = () => {
    dragging.current = false;
  };

  const knobTopPct = ((MAX_INDEX - value) / MAX_INDEX) * 100;

  return (
    <div
      ref={(el) => {
        trackElRef.current = el;
        trackRef(el);
      }}
      onPointerDown={handlePointerDown}
      onPointerMove={handlePointerMove}
      onPointerUp={handlePointerUp}
      onPointerCancel={handlePointerUp}
      role="slider"
      aria-valuemin={0}
      aria-valuemax={MAX_INDEX}
      aria-valuenow={value}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === "ArrowUp") onChange(Math.min(value + 1, MAX_INDEX));
        if (e.key === "ArrowDown") onChange(Math.max(value - 1, 0));
      }}
      className="relative h-64 w-14 cursor-pointer select-none touch-none outline-none focus-visible:ring-2 focus-visible:ring-white/40 rounded"
    >
      {/* The groove */}
      <div
        className="absolute left-1/2 top-3 bottom-3 w-1.5 -translate-x-1/2 rounded-full"
        style={{ background: "linear-gradient(180deg, #0a0a0a, #1c1712)", boxShadow: "inset 0 0 3px rgba(0,0,0,0.9)" }}
      />
      {/* Tick marks down the side, like the wood notches */}
      <div className="absolute -left-1.5 top-3 bottom-3 flex flex-col justify-between">
        {Array.from({ length: 10 }).map((_, i) => (
          <div key={i} className="h-[2px] w-2.5 rounded-sm bg-[#d8c9a8]/70" />
        ))}
      </div>
      {/* The knob */}
      <div
        className="absolute left-1/2 h-9 w-9 -translate-x-1/2 -translate-y-1/2 rounded-[3px]"
        style={{
          top: `calc(${knobTopPct}% + ${14 - knobTopPct * 0.02}px)`,
          background: `linear-gradient(145deg, ${knobColor}, ${knobColor}cc)`,
          boxShadow: "0 3px 0 rgba(0,0,0,0.45), inset 0 2px 3px rgba(255,255,255,0.35), inset 0 -3px 4px rgba(0,0,0,0.35)",
          border: "1px solid rgba(0,0,0,0.35)",
        }}
      >
        {/* horizontal ridge lines for that blocky plastic-knob look */}
        <div className="absolute inset-1 flex flex-col justify-between py-0.5">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-[1px] w-full bg-black/15" />
          ))}
        </div>
      </div>
    </div>
  );
};

// A single digit in the black LCD-style readout — matches the blocky
// pixel-font numbers on the in-game panel.
const DigitReadout = ({ value }: { value: number }) => (
  <div
    className="flex h-14 w-12 items-center justify-center rounded-[2px]"
    style={{
      background: "#050505",
      boxShadow: "inset 0 0 5px rgba(0,0,0,0.9), inset 0 3px 4px rgba(0,0,0,0.7), 0 1px 0 rgba(255,255,255,0.08)",
      border: "1px solid rgba(0,0,0,0.6)",
    }}
  >
    <span
      className="font-mono font-black text-3xl leading-none"
      style={{ color: "#f5f5f5", textShadow: "0 0 8px rgba(255,255,255,0.45)", fontStretch: "condensed" as const }}
    >
      {value}
    </span>
  </div>
);

export const ColorCodeSelector = ({ isAdmin }: ColorCodeSelectorProps) => {
  const { toast } = useToast();

  const [red, setRed] = useState(0);
  const [green, setGreen] = useState(0);
  const [blue, setBlue] = useState(0);
  const [previewHeight, setPreviewHeight] = useState([125]);
  const [copiedField, setCopiedField] = useState<"rgb" | "hex" | null>(null);

  const resetToDefault = () => {
    setRed(0);
    setGreen(0);
    setBlue(0);
    setPreviewHeight([125]);
  };

  const r = RGB_SNAP_VALUES[red];
  const g = RGB_SNAP_VALUES[green];
  const b = RGB_SNAP_VALUES[blue];
  const rgbColor = `rgb(${r}, ${g}, ${b})`;
  const hexColor = `#${[r, g, b].map((c) => c.toString(16).padStart(2, "0")).join("").toUpperCase()}`;

  const copyToClipboard = async (value: string, field: "rgb" | "hex") => {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedField(field);
      setTimeout(() => setCopiedField((prev) => (prev === field ? null : prev)), 1500);
    } catch {
      toast({ title: "Couldn't copy", description: "Copy this manually instead.", variant: "destructive" });
    }
  };

  return (
    <div className="min-h-screen pt-20 pb-8">
      <div className="container mx-auto px-4 max-w-2xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="hero-text">Color Code Selector</span>
          </h1>
          <p className="text-lg text-muted-foreground mb-2">
            A tool for selecting and visualizing colors using RGB values. Adjust the sliders to create your perfect
            color combination.
          </p>
          <p className="text-sm text-muted-foreground">
            Built to match the in-game color slider panel — same 10 snap positions on each channel.
          </p>
        </div>

        <Card className="glass-panel text-card-foreground">
          <CardContent className="p-6 sm:p-10 flex flex-col items-center">
            {/* The wooden panel itself */}
            <div
              className="relative w-full max-w-sm rounded-md p-6 pb-10"
              style={{
                background:
                  "repeating-linear-gradient(135deg, #6b4a30 0px, #6b4a30 10px, #5a3d27 10px, #5a3d27 20px), linear-gradient(180deg, #6b4a30, #4d3420)",
                boxShadow: "0 12px 28px -10px rgba(0,0,0,0.6), inset 0 0 40px rgba(0,0,0,0.35)",
                border: "3px solid #3a2717",
              }}
            >
              {/* Color preview bar at the top — height adjustable below */}
              <div
                className="w-full rounded-sm mb-4 transition-[height] duration-150"
                style={{
                  height: `${previewHeight[0]}px`,
                  backgroundColor: rgbColor,
                  boxShadow: "0 4px 0 rgba(0,0,0,0.35), inset 0 2px 4px rgba(255,255,255,0.25), inset 0 -3px 6px rgba(0,0,0,0.3)",
                  border: "1px solid rgba(0,0,0,0.4)",
                }}
              />

              {/* Digit readouts */}
              <div className="flex justify-center gap-2 mb-6">
                <DigitReadout value={red} />
                <DigitReadout value={green} />
                <DigitReadout value={blue} />
              </div>

              {/* The three sliders */}
              <div className="flex justify-center gap-6">
                <ChannelSlider value={red} onChange={setRed} knobColor="#e0342f" trackRef={() => {}} />
                <ChannelSlider value={green} onChange={setGreen} knobColor="#3fbf3f" trackRef={() => {}} />
                <ChannelSlider value={blue} onChange={setBlue} knobColor="#3d7fd6" trackRef={() => {}} />
              </div>

              <div className="flex justify-center gap-6 mt-2">
                <span className="w-14 text-center text-xs font-bold text-red-300">R</span>
                <span className="w-14 text-center text-xs font-bold text-green-300">G</span>
                <span className="w-14 text-center text-xs font-bold text-blue-300">B</span>
              </div>
            </div>

            {/* Preview bar height control */}
            <div className="w-full max-w-sm mt-6 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium">Preview Box Height</label>
                <span className="text-sm text-muted-foreground">{previewHeight[0]}px</span>
              </div>
              <Slider value={previewHeight} onValueChange={setPreviewHeight} min={32} max={400} step={4} />
            </div>

            {/* Default button */}
            <Button onClick={resetToDefault} variant="outline" className="mt-6">
              Default
            </Button>

            {/* Color info */}
            <div className="bg-muted/20 rounded-lg p-4 space-y-3 w-full mt-6">
              <p className="text-sm text-muted-foreground text-center">Current Color:</p>
              <div className="flex items-center justify-center gap-2">
                <span className="font-mono text-sm">
                  R: {r}, G: {g}, B: {b}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => copyToClipboard(rgbColor, "rgb")}
                  aria-label="Copy RGB value"
                >
                  {copiedField === "rgb" ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </div>
              <div className="flex items-center justify-center gap-2">
                <span className="font-mono text-sm">{hexColor}</span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-7 w-7"
                  onClick={() => copyToClipboard(hexColor, "hex")}
                  aria-label="Copy hex value"
                >
                  {copiedField === "hex" ? <Check className="h-3.5 w-3.5 text-primary" /> : <Copy className="h-3.5 w-3.5" />}
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};

export default ColorCodeSelector;
