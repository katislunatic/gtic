// Normalizes "fancy font" Discord display names (Mathematical Alphanumeric
// Symbols, fullwidth, circled, small-caps, etc.) back to plain ASCII before
// handing text to the browser's speech synthesis, since TTS engines read the
// literal Unicode character, not what it's visually styled to look like.
//
// Covers the common cases most "aesthetic font" generators actually produce.
// Known gaps (by design, not worth chasing): Zalgo/combining-diacritic text,
// rare/obscure Unicode blocks, and mixed emoji-as-letters. Anything not in
// the map below passes through unchanged, so the TTS engine does whatever it
// would have done anyway -- this only ever makes things better, never worse.

const map = new Map<number, string>();

function fillRange(startCode: number, chars: string) {
  for (let i = 0; i < chars.length; i++) {
    map.set(startCode + i, chars[i]);
  }
}

const UPPER = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
const LOWER = "abcdefghijklmnopqrstuvwxyz";
const DIGITS = "0123456789";

// --- Mathematical Alphanumeric Symbols (U+1D400-U+1D7FF) ---
// Each style has a contiguous A-Z block and a contiguous a-z block, except
// for a handful of letters that coincide with pre-existing Letterlike
// Symbols characters and were left out of this block -- those are patched
// in as explicit exceptions afterward.
const mathStyles: Array<[number, number]> = [
  [0x1d400, 0x1d41a], // bold
  [0x1d434, 0x1d44e], // italic
  [0x1d468, 0x1d482], // bold italic
  [0x1d49c, 0x1d4b6], // script
  [0x1d4d0, 0x1d4ea], // bold script
  [0x1d504, 0x1d51e], // fraktur
  [0x1d538, 0x1d552], // double-struck
  [0x1d56c, 0x1d586], // bold fraktur
  [0x1d5a0, 0x1d5ba], // sans-serif
  [0x1d5d4, 0x1d5ee], // sans-serif bold
  [0x1d608, 0x1d622], // sans-serif italic
  [0x1d63c, 0x1d656], // sans-serif bold italic
  [0x1d670, 0x1d68a], // monospace
];
for (const [upperBase, lowerBase] of mathStyles) {
  fillRange(upperBase, UPPER);
  fillRange(lowerBase, LOWER);
}

// Letters missing from the math-alphanumeric block for certain styles,
// because a Letterlike Symbols codepoint already existed for them.
const mathExceptions: Record<string, string> = {
  "0x210e": "h", // italic h (planck constant symbol)
  "0x212c": "B", "0x2130": "E", "0x2131": "F", "0x210b": "H", "0x2110": "I",
  "0x2112": "L", "0x2133": "M", "0x211b": "R", // script capitals
  "0x212f": "e", "0x210a": "g", "0x2134": "o", // script lowercase
  "0x212d": "C", "0x210c": "H", "0x2111": "I", "0x211c": "R", "0x2128": "Z", // fraktur capitals
  "0x2102": "C", "0x210d": "H", "0x2115": "N", "0x2119": "P", "0x211a": "Q",
  "0x211d": "R", "0x2124": "Z", // double-struck capitals
};
for (const [hex, letter] of Object.entries(mathExceptions)) {
  map.set(parseInt(hex, 16), letter);
}

// Mathematical digits (bold, double-struck, sans-serif, sans-serif bold, monospace)
for (const base of [0x1d7ce, 0x1d7d8, 0x1d7e2, 0x1d7ec, 0x1d7f6]) {
  fillRange(base, DIGITS);
}

// --- Fullwidth ASCII (U+FF01-U+FF5E), used by some "vaporwave" style text ---
for (let code = 0xff01; code <= 0xff5e; code++) {
  map.set(code, String.fromCharCode(code - 0xfee0));
}

// --- Circled Latin letters and digits ---
fillRange(0x24b6, UPPER); // Ⓐ-Ⓩ
fillRange(0x24d0, LOWER); // ⓐ-ⓩ
map.set(0x24ea, "0");
fillRange(0x2460, "123456789"); // ①-⑨

// --- Small caps Latin (scattered codepoints, hardcoded) ---
const smallCaps: Record<string, string> = {
  "\u1d00": "A", "\u0299": "B", "\u1d04": "C", "\u1d05": "D", "\u1d07": "E",
  "\ua730": "F", "\u0262": "G", "\u029c": "H", "\u026a": "I", "\u1d0a": "J",
  "\u1d0b": "K", "\u029f": "L", "\u1d0d": "M", "\u0274": "N", "\u1d0f": "O",
  "\u1d18": "P", "\u01eb": "Q", "\u0280": "R", "\ua731": "S", "\u1d1b": "T",
  "\u1d1c": "U", "\u1d20": "V", "\u1d21": "W", "\u1d22": "Y", "\u1d23": "Z",
};
for (const [ch, letter] of Object.entries(smallCaps)) {
  map.set(ch.codePointAt(0)!, letter);
}

export function normalizeForSpeech(text: string): string {
  let out = "";
  for (const ch of text) {
    const code = ch.codePointAt(0)!;
    out += map.get(code) ?? ch;
  }
  return out;
}

// Turns gamer-style names into something a voice reads cleanly:
// "xX_DarkWolf99_Xx" -> "Dark Wolf 99." Splits camelCase and letter/number
// boundaries, drops symbols/emoji, and ends with a period so the voice
// says it as a clear, finished word instead of trailing off.
export function toSpeakable(text: string): string {
  let s = text
    .replace(/^[xX]+[_\-.]+|[_\-.]+[xX]+$/g, " ")
    .replace(/[_\-.|~]+/g, " ")
    .replace(/([a-z])([A-Z])/g, "$1 $2")
    .replace(/([A-Za-z])(\d)/g, "$1 $2")
    .replace(/(\d)([A-Za-z])/g, "$1 $2")
    .replace(/[^\p{L}\p{N}' ]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!s) s = text.trim();
  return s ? `${s}.` : s;
}

// Plays a much more natural/human voice via the fish-tts Supabase edge
// function (Fish Audio). Falls back to the browser's built-in (robotic)
// speech synthesis if Fish Audio isn't configured yet, errors, or the
// person is offline -- so the pronounce button still does *something*
// either way rather than silently failing.
export async function speakName(name: string) {
  const cleaned = toSpeakable(normalizeForSpeech(name));
  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL as string | undefined;
  const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY as string | undefined;

  if (supabaseUrl && anonKey) {
    try {
      const res = await fetch(`${supabaseUrl}/functions/v1/fish-tts`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: anonKey,
          Authorization: `Bearer ${anonKey}`,
        },
        body: JSON.stringify({ text: cleaned }),
      });
      if (res.ok) {
        const blob = await res.blob();
        const url = URL.createObjectURL(blob);
        const audio = new Audio(url);
        audio.addEventListener("ended", () => URL.revokeObjectURL(url));
        await audio.play();
        return;
      }
    } catch {
      // fall through to browser TTS below
    }
  }

  speakNameBrowserFallback(cleaned);
}

function speakNameBrowserFallback(cleaned: string) {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
  const utterance = new SpeechSynthesisUtterance(cleaned);
  window.speechSynthesis.cancel();
  window.speechSynthesis.speak(utterance);
}
