import { useState, useRef, useEffect } from "react";
import {
  Bot,
  Send,
  X,
  Image as ImageIcon,
  MessageSquare,
  Loader2,
  Paperclip,
  Pencil,
  Copy,
  Check,
  RotateCcw,
  Download,
  Maximize2,
  Minimize2,
  History,
  Plus,
  Trash2,
} from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";

type Attachment = { dataUrl: string; base64: string; mimeType: string };

type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  content: string;
  imageUrl?: string;
  // User-attached reference images (base64 data URLs) shown in their own
  // bubble — separate from imageUrl, which is an AI-generated/edited result.
  attachedImageUrls?: string[];
  // Set on an assistant message that represents a failed request, so a retry
  // button can be shown and the original inputs replayed.
  isError?: boolean;
};

let idCounter = 0;
function newId(): string {
  idCounter += 1;
  return `m${Date.now()}_${idCounter}`;
}

const GREETING: ChatMessage = {
  id: "greeting",
  role: "assistant",
  content: "Hey! Ask me anything about GTEC, or ask me to generate an image.",
};

// A saved conversation in the chat history list — like ChatGPT's sidebar,
// each one is its own thread with its own messages, auto-titled from the
// first thing the visitor asked.
type StoredChat = {
  id: string;
  title: string;
  messages: ChatMessage[];
  updatedAt: number;
};

// Chat history persists in this browser's localStorage so closing the
// widget or reloading the page doesn't lose past conversations. This is
// per-browser only — there's no account/backend sync, so it won't follow
// the visitor to a different device or browser.
const CHATS_STORAGE_KEY = "gtec-assistant-chats";
const ACTIVE_CHAT_STORAGE_KEY = "gtec-assistant-active-chat";
// Legacy single-conversation key from before chat history existed — read
// once to migrate anyone's in-progress chat into the new list, then unused.
const LEGACY_CHAT_STORAGE_KEY = "gtec-assistant-chat";

function newChatId(): string {
  return `c${Date.now()}_${Math.floor(Math.random() * 1_000_000)}`;
}

function freshChat(): StoredChat {
  return { id: newChatId(), title: "New chat", messages: [GREETING], updatedAt: Date.now() };
}

// Titles a chat from the first thing the visitor actually said, so the
// history list reads like "can you fix my code" instead of "New chat" x20.
function deriveTitle(messages: ChatMessage[]): string {
  const firstUser = messages.find((m) => m.role === "user");
  if (!firstUser || !firstUser.content.trim()) return "New chat";
  const text = firstUser.content.trim().replace(/\s+/g, " ");
  return text.length > 42 ? `${text.slice(0, 42)}…` : text;
}

function loadChats(): StoredChat[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(CHATS_STORAGE_KEY);
    if (raw) {
      const parsed = JSON.parse(raw) as StoredChat[];
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
    // One-time migration: fold the old single-conversation format into the
    // new list format if it's there and nothing's been migrated yet.
    const legacyRaw = window.localStorage.getItem(LEGACY_CHAT_STORAGE_KEY);
    if (legacyRaw) {
      const legacyMessages = JSON.parse(legacyRaw) as ChatMessage[];
      if (Array.isArray(legacyMessages) && legacyMessages.length > 0) {
        return [
          {
            id: newChatId(),
            title: deriveTitle(legacyMessages),
            messages: legacyMessages,
            updatedAt: Date.now(),
          },
        ];
      }
    }
  } catch {
    // fall through to empty
  }
  return [];
}

function saveChats(chats: StoredChat[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(CHATS_STORAGE_KEY, JSON.stringify(chats));
  } catch {
    // Ignore storage errors (private browsing, quota, etc.) — persistence is
    // a nice-to-have, not required for the chat to function.
  }
}

function loadActiveChatId(): string | null {
  if (typeof window === "undefined") return null;
  try {
    return window.localStorage.getItem(ACTIVE_CHAT_STORAGE_KEY);
  } catch {
    return null;
  }
}

function saveActiveChatId(id: string) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(ACTIVE_CHAT_STORAGE_KEY, id);
  } catch {
    // Ignore storage errors — see saveChats above.
  }
}

// Computes the starting chat list + which one is active, once, so the two
// separate useState calls below stay in sync instead of each generating
// their own fallback chat with a different id.
function initChatState(): { chats: StoredChat[]; activeChatId: string } {
  const loaded = loadChats();
  const chats = loaded.length > 0 ? loaded : [freshChat()];
  const stored = loadActiveChatId();
  const activeChatId = stored && chats.some((c) => c.id === stored) ? stored : chats[0].id;
  return { chats, activeChatId };
}

// Floating chat bubble in the corner of the site. Calls free AI APIs
// directly from the browser — no backend deploy needed:
//   - Chat: Groq's free-tier API (VITE_GROQ_API_KEY), falling back to
//     Gemini's free-tier API (VITE_GEMINI_API_KEY) if Groq fails or errors.
//   - Images: Pollinations.ai (fully public, no key required at all) for
//     generating brand-new images, Puter.js (no key, user signs into their
//     own free Puter account) for editing attached images.
//
// Note: putting these keys in VITE_ env vars means they ship in the built
// JS bundle and are technically visible to anyone who looks. That's a fine
// tradeoff for a low-stakes community widget with free-tier keys — just
// rotate a key on console.groq.com / aistudio.google.com if it's ever abused.
const GROQ_API_KEY = import.meta.env.VITE_GROQ_API_KEY as string | undefined;
const GROQ_MODEL = "openai/gpt-oss-120b";

const GEMINI_API_KEY = import.meta.env.VITE_GEMINI_API_KEY as string | undefined;
const GEMINI_MODEL = "gemini-3.5-flash-lite";
// Puter.js (loaded via <script> in index.html) provides free image editing
// with no API key on our end — each visitor uses their own free Puter
// account, so there's no shared quota to run out of.
const PUTER_IMAGE_MODEL = "gemini-3.1-flash-image-preview";

const SYSTEM_PROMPT =
  "You are the GTEC site assistant, a helpful chat bot for the Gorilla Tag Elite COMP " +
  "community (a Gorilla Tag esports/competitive Discord community). Be friendly, concise, and " +
  "helpful. If asked about specific league rules, schedules, or account issues you are unsure " +
  "about, suggest the user check the site or ask staff in the Discord. Keep replies short " +
  "(a few sentences) unless the user asks for detail. You CAN generate brand-new images from a " +
  "text description, and you CAN edit an image the user has attached (e.g. 'make this blue', " +
  "'add a hat to this'). When an image is attached and the user asks a question about it rather " +
  "than requesting a change, just describe or analyze what's in it instead.";

// Used only for the describe-only fallback path (when the real image-edit
// path is unavailable). Explicitly tells the text-only model it cannot
// produce or claim to have made an edited image, since it would otherwise
// follow the main SYSTEM_PROMPT's "you CAN edit images" framing and
// hallucinate a fake result.
const DESCRIBE_ONLY_SYSTEM_PROMPT =
  SYSTEM_PROMPT +
  " IMPORTANT: image editing is temporarily unavailable, so for this message " +
  "you have no ability to edit, generate, or output any image at all — only describe " +
  "or answer questions about the attached image(s) in plain text. Do not say you edited, " +
  "created, or changed the image, and do not include any markdown image syntax or link.";

// Catches phrasing like "make me an image of a tree", "draw a cat", "can
// you generate a picture of...", etc. so image requests work correctly even
// when the user is in normal chat mode, not just via the toggle button.
const IMAGE_INTENT_RE =
  /\b(draw|generate|create|make|show)\b.{0,20}\b(image|picture|photo|drawing|art|painting|illustration)\b|\b(image|picture|photo)\s+of\b/i;

// Catches phrasing that asks to change an attached image ("make this blue",
// "add a hat", "turn it into a cartoon") as opposed to just asking about it
// ("what is this", "describe this photo"). Attachment + one of these verbs
// routes to the real image-editing model instead of the vision/description one.
const IMAGE_EDIT_INTENT_RE =
  /\b(make|turn|change|add|remove|replace|recolor|colou?r|convert|edit|modify|transform|swap|delete|erase|put|give|draw)\b/i;

function extractImagePrompt(text: string): string {
  // Strip common leading phrasing so the prompt sent to Pollinations is just
  // the subject, not the whole request sentence.
  return text
    .replace(/^(can you |could you |please )?(draw|generate|create|make|show)( me)?( an?)?\s*/i, "")
    .replace(/^(image|picture|photo|drawing|art|painting|illustration)\s*(of)?\s*/i, "")
    .trim() || text;
}

// Reads a File into a data URL (for the preview) plus the raw base64 payload
// and mime type Gemini's inline_data field expects.
function readImageFile(file: File): Promise<Attachment> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const dataUrl = reader.result as string;
      const base64 = dataUrl.split(",")[1] ?? "";
      resolve({ dataUrl, base64, mimeType: file.type || "image/png" });
    };
    reader.onerror = () => reject(new Error("Couldn't read that file"));
    reader.readAsDataURL(file);
  });
}

async function askGroq(messages: ChatMessage[]): Promise<string> {
  if (!GROQ_API_KEY) throw new Error("Groq API key not configured");
  const res = await fetch("https://api.groq.com/openai/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${GROQ_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: GROQ_MODEL,
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        ...messages.slice(-12).map(({ role, content }) => ({ role, content })),
      ],
      max_tokens: 32768,
      temperature: 0.7,
    }),
  });
  if (!res.ok) throw new Error(`Groq ${res.status}`);
  const data = await res.json();
  const reply = data.choices?.[0]?.message?.content;
  if (!reply) throw new Error("Groq returned no content");
  return reply;
}

async function askGemini(
  messages: ChatMessage[],
  attachments?: Attachment[],
  systemPrompt: string = SYSTEM_PROMPT,
): Promise<string> {
  if (!GEMINI_API_KEY) throw new Error("Gemini API key not configured");
  // Gemini uses "user"/"model" roles and a separate system_instruction field.
  const trimmed = messages.slice(-12);
  const contents = trimmed.map((m, i) => {
    const isLastUserMessage = i === trimmed.length - 1 && m.role === "user";
    const parts: Record<string, unknown>[] = [{ text: m.content }];
    // Only attach images to the most recent user message, matching where
    // the user actually uploaded them.
    if (isLastUserMessage && attachments?.length) {
      for (const a of attachments) {
        parts.push({ inlineData: { mimeType: a.mimeType, data: a.base64 } });
      }
    }
    return { role: m.role === "assistant" ? "model" : "user", parts };
  });
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${GEMINI_MODEL}:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents,
        generationConfig: { maxOutputTokens: 16384, temperature: 0.7 },
      }),
    },
  );
  if (!res.ok) throw new Error(`Gemini ${res.status}`);
  const data = await res.json();
  const reply = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!reply) throw new Error("Gemini returned no content");
  return reply;
}

declare global {
  interface Window {
    puter?: {
      ai: {
        txt2img: (
          prompt: string,
          options?: Record<string, unknown>,
        ) => Promise<HTMLImageElement>;
      };
    };
  }
}

// Sends the attached image(s) + edit instruction to Puter.js, which routes to
// Gemini's image-editing model. Puter handles auth itself (prompting the
// visitor to sign into their own free Puter account on first use), so there's
// no API key or shared quota on our end.
async function editImageWithPuter(instruction: string, attachments: Attachment[]): Promise<string> {
  if (!window.puter?.ai?.txt2img) throw new Error("Puter.js not loaded");
  const options: Record<string, unknown> = { model: PUTER_IMAGE_MODEL };
  if (attachments.length > 1) {
    options.input_images = attachments.map((a) => a.base64);
    options.input_image_mime_type = attachments[0].mimeType;
  } else {
    options.input_image = attachments[0].base64;
    options.input_image_mime_type = attachments[0].mimeType;
  }
  const image = await window.puter.ai.txt2img(instruction, options);
  return image.src;
}

// Tries Groq first (fastest); if it fails for any reason (rate limit,
// deprecated model, network hiccup) and a Gemini key is configured, silently
// retries with Gemini instead of showing the user an error.
async function askAi(messages: ChatMessage[]): Promise<string> {
  try {
    return await askGroq(messages);
  } catch (e) {
    if (!GEMINI_API_KEY) throw e;
    console.warn("Groq failed, falling back to Gemini:", e);
    return await askGemini(messages);
  }
}

// Pollinations serves the generated image directly at a GET URL — no key,
// no request body needed. The browser just loads it as an <img src>.
function pollinationsUrl(prompt: string): string {
  const seed = Math.floor(Math.random() * 1_000_000);
  return `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=768&height=768&seed=${seed}&nologo=true`;
}

async function generateImage(prompt: string): Promise<string> {
  const url = pollinationsUrl(prompt);
  // Preload so a failure throws instead of showing a broken <img>.
  await new Promise<void>((resolve, reject) => {
    const img = new window.Image();
    img.onload = () => resolve();
    img.onerror = () => reject(new Error("image failed to load"));
    img.src = url;
  });
  return url;
}

// Pollinations doesn't expose real generation progress (it's a single
// request/response, not a stream), so this fakes a smooth climb that
// slows down as it approaches 90% and never claims 100% until the image has
// actually finished loading — the same trick most "AI thinking" progress
// rings use under the hood.
function useFakeProgress(active: boolean): number {
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (!active) {
      setProgress(0);
      return;
    }
    setProgress(1);
    const interval = setInterval(() => {
      setProgress((p) => {
        if (p >= 90) return p;
        const step = p < 50 ? 6 : p < 75 ? 3 : 1;
        return Math.min(90, p + step);
      });
    }, 220);
    return () => clearInterval(interval);
  }, [active]);
  return progress;
}

// Circular progress ring with the percentage in the middle, styled to match
// the site's primary color.
const ImageProgressRing = ({ percent }: { percent: number }) => {
  const size = 96;
  const stroke = 6;
  const radius = (size - stroke) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference * (1 - percent / 100);
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={stroke}
          fill="none"
          className="text-muted-foreground/20"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          stroke="currentColor"
          strokeWidth={stroke}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="text-primary transition-all duration-200 ease-out"
        />
      </svg>
      <span className="absolute text-sm font-semibold">{percent}%</span>
    </div>
  );
};

// Renders a chat message's markdown-lite content: ```fenced code blocks```
// (optionally ```lang) become a monospace block with its own copy button,
// `inline code` becomes an inline <code> span, and everything else keeps its
// line breaks. No markdown dependency — just enough parsing for what the AI
// actually outputs.
const CodeBlock = ({ code, lang }: { code: string; lang?: string }) => {
  const [copied, setCopied] = useState(false);
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard permissions can fail silently in some embedded contexts
    }
  };
  return (
    <div className="my-1.5 overflow-hidden rounded-lg border border-border/50 bg-background/40 text-left">
      <div className="flex items-center justify-between border-b border-border/50 px-2.5 py-1">
        <span className="text-[10px] uppercase tracking-wide text-muted-foreground">{lang || "code"}</span>
        <button
          onClick={copy}
          className="flex items-center gap-1 text-[10px] text-muted-foreground hover:text-foreground"
          aria-label="Copy code"
        >
          {copied ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
          {copied ? "Copied" : "Copy"}
        </button>
      </div>
      <pre className="overflow-x-auto px-2.5 py-2 text-xs leading-relaxed">
        <code>{code}</code>
      </pre>
    </div>
  );
};

// Splits inline `code` spans out of a plain-text segment (no fenced block),
// preserving line breaks for the rest.
const InlineText = ({ text }: { text: string }) => {
  const parts = text.split(/(`[^`\n]+`)/g);
  return (
    <p className="whitespace-pre-wrap break-words">
      {parts.map((part, i) =>
        part.startsWith("`") && part.endsWith("`") && part.length > 1 ? (
          <code key={i} className="rounded bg-background/40 px-1 py-0.5 text-[0.85em]">
            {part.slice(1, -1)}
          </code>
        ) : (
          <span key={i}>{part}</span>
        ),
      )}
    </p>
  );
};

const MessageContent = ({ content }: { content: string }) => {
  // Split on ```lang\ncode``` fences, keeping the fences themselves as
  // capture groups so we can tell fenced segments apart from plain text.
  const segments = content.split(/```(\w*)\n?([\s\S]*?)```/g);
  const nodes: JSX.Element[] = [];
  for (let i = 0; i < segments.length; i += 3) {
    const plain = segments[i];
    if (plain) nodes.push(<InlineText key={`t${i}`} text={plain} />);
    const lang = segments[i + 1];
    const code = segments[i + 2];
    if (code !== undefined) {
      nodes.push(<CodeBlock key={`c${i}`} code={code.replace(/\n$/, "")} lang={lang} />);
    }
  }
  return <>{nodes}</>;
};

// Fullscreen overlay for viewing an attached or generated image, with a
// download button and click-outside-to-close.
const ImageLightbox = ({ src, onClose }: { src: string; onClose: () => void }) => {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [onClose]);

  const download = () => {
    const a = document.createElement("a");
    a.href = src;
    a.download = "gtec-assistant-image.png";
    a.click();
  };

  return (
    <div
      className="fixed inset-0 z-[60] flex items-center justify-center bg-black/80 p-6"
      onClick={onClose}
    >
      <div className="absolute right-4 top-4 flex gap-2">
        <button
          onClick={(e) => {
            e.stopPropagation();
            download();
          }}
          className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
          aria-label="Download image"
        >
          <Download className="h-5 w-5" />
        </button>
        <button
          onClick={onClose}
          className="rounded-full bg-white/10 p-2 text-white hover:bg-white/20"
          aria-label="Close"
        >
          <X className="h-5 w-5" />
        </button>
      </div>
      <img
        src={src}
        alt="Full size"
        className="max-h-full max-w-full rounded-lg object-contain"
        onClick={(e) => e.stopPropagation()}
      />
    </div>
  );
};

export const AiChatWidget = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  // Briefly true right when isExpanded flips, giving the panel a slight
  // "squash" undershoot before it settles back to full scale — combined with
  // the width/height change animating at the same time, this reads as a
  // genuine scale-out/scale-in rather than a plain resize.
  const [isMorphing, setIsMorphing] = useState(false);
  const morphTimeout = useRef<ReturnType<typeof setTimeout> | null>(null);
  const toggleExpanded = () => {
    setIsExpanded((v) => !v);
    setIsMorphing(true);
    if (morphTimeout.current) clearTimeout(morphTimeout.current);
    morphTimeout.current = setTimeout(() => setIsMorphing(false), 450);
  };
  // Chat history: a list of saved conversations (see StoredChat above), plus
  // which one is currently open. `initState` is computed once on mount via
  // this stable useState-of-a-function trick so `chats` and `activeChatId`
  // start in sync (same fallback chat/id) instead of each independently
  // generating their own fresh chat when there's nothing saved yet.
  const [initState] = useState(initChatState);
  const [chats, setChats] = useState<StoredChat[]>(initState.chats);
  const [activeChatId, setActiveChatId] = useState<string>(initState.activeChatId);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(
    () => initState.chats.find((c) => c.id === initState.activeChatId)?.messages ?? [GREETING],
  );
  const [input, setInput] = useState("");
  const [imageMode, setImageMode] = useState(false);
  const [loading, setLoading] = useState(false);
  const [generatingImage, setGeneratingImage] = useState(false);
  const imageProgress = useFakeProgress(generatingImage);
  const [attachments, setAttachments] = useState<Attachment[]>([]);
  const [attachError, setAttachError] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingText, setEditingText] = useState("");
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [lightboxSrc, setLightboxSrc] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const dragCounter = useRef(0);
  const scrollRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, isOpen]);

  useEffect(() => {
    return () => {
      if (morphTimeout.current) clearTimeout(morphTimeout.current);
    };
  }, []);

  // Auto-save every message change into the active chat's entry in the
  // history list (updating its title/timestamp too), and persist the whole
  // list to localStorage — see loadChats/saveChats above.
  useEffect(() => {
    setChats((prev) => {
      const idx = prev.findIndex((c) => c.id === activeChatId);
      if (idx === -1) return prev;
      const updated = [...prev];
      updated[idx] = { ...updated[idx], messages, title: deriveTitle(messages), updatedAt: Date.now() };
      saveChats(updated);
      return updated;
    });
  }, [messages, activeChatId]);

  useEffect(() => {
    saveActiveChatId(activeChatId);
  }, [activeChatId]);

  // Starts a brand-new conversation, adding it to the top of the history
  // list and switching to it.
  const startNewChat = () => {
    const chat = freshChat();
    setChats((prev) => {
      const updated = [chat, ...prev];
      saveChats(updated);
      return updated;
    });
    setActiveChatId(chat.id);
    setMessages(chat.messages);
    setEditingId(null);
    setEditingText("");
    setIsHistoryOpen(false);
  };

  // Switches to a previously saved chat from the history list.
  const switchChat = (id: string) => {
    if (id === activeChatId) {
      setIsHistoryOpen(false);
      return;
    }
    const chat = chats.find((c) => c.id === id);
    if (!chat) return;
    setActiveChatId(id);
    setMessages(chat.messages);
    setEditingId(null);
    setEditingText("");
    setIsHistoryOpen(false);
  };

  // Deletes a chat from history. If it was the active one, falls back to
  // whichever chat is now first in the list, or starts a fresh one if that
  // was the last chat left.
  const deleteChat = (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    setChats((prev) => {
      const remaining = prev.filter((c) => c.id !== id);
      const updated = remaining.length > 0 ? remaining : [freshChat()];
      saveChats(updated);
      if (id === activeChatId) {
        const next = updated[0];
        setActiveChatId(next.id);
        setMessages(next.messages);
      }
      return updated;
    });
  };

  // Auto-grow the input as the user types past one line, up to a cap, so
  // long messages are visible from start to end instead of scrolling
  // sideways inside a fixed-height box.
  useEffect(() => {
    const el = textareaRef.current;
    if (!el) return;
    el.style.height = "auto";
    const maxHeight = 160; // px, roughly 7-8 lines
    el.style.height = `${Math.min(el.scrollHeight, maxHeight)}px`;
  }, [input]);

  // Runs one assistant turn (text chat, image generation, image edit, or
  // image description) given a finalized message history plus any
  // attachments on the newest user message. Shared by first sends, edits
  // (which regenerate from an earlier point), and retries.
  const runTurn = async (history: ChatMessage[], turnAttachments: Attachment[]) => {
    const lastUser = history[history.length - 1];
    const text = lastUser.content.trim();
    setLoading(true);

    if (turnAttachments.length > 0) {
      const wantsEdit = IMAGE_EDIT_INTENT_RE.test(text);
      if (wantsEdit) {
        try {
          const imageUrl = await editImageWithPuter(text, turnAttachments);
          setMessages((m) => [...m, { id: newId(), role: "assistant", content: "Here you go:", imageUrl }]);
        } catch (e) {
          console.warn("Puter image edit failed, falling back to description:", e);
          try {
            const description = await askGemini(history, turnAttachments, DESCRIBE_ONLY_SYSTEM_PROMPT);
            setMessages((m) => [
              ...m,
              {
                id: newId(),
                role: "assistant",
                content: `Couldn't edit that image right now, but here's what I see: ${description}`,
              },
            ]);
          } catch {
            setMessages((m) => [
              ...m,
              {
                id: newId(),
                role: "assistant",
                content: "Something went wrong with that image — try again shortly.",
                isError: true,
              },
            ]);
          }
        } finally {
          setLoading(false);
        }
        return;
      }

      // Not an edit request — just describe/answer questions about the image(s).
      try {
        const reply = await askGemini(history, turnAttachments);
        setMessages((m) => [...m, { id: newId(), role: "assistant", content: reply }]);
      } catch {
        setMessages((m) => [
          ...m,
          {
            id: newId(),
            role: "assistant",
            content: GEMINI_API_KEY
              ? "Something went wrong reading that image — try again shortly."
              : "Image chat isn't set up yet — ask a staff member to add a Gemini API key.",
            isError: true,
          },
        ]);
      } finally {
        setLoading(false);
      }
      return;
    }

    // Image mode toggle OR the message itself sounds like an image request —
    // either way, route to actual image generation instead of the chat model.
    if (imageMode || IMAGE_INTENT_RE.test(text)) {
      setGeneratingImage(true);
      try {
        const url = await generateImage(extractImagePrompt(text));
        setMessages((m) => [...m, { id: newId(), role: "assistant", content: `Here's "${text}":`, imageUrl: url }]);
      } catch {
        setMessages((m) => [
          ...m,
          {
            id: newId(),
            role: "assistant",
            content: "Couldn't generate that image right now — try again in a bit.",
            isError: true,
          },
        ]);
      } finally {
        setGeneratingImage(false);
        setLoading(false);
      }
      return;
    }

    try {
      const reply = await askAi(history);
      setMessages((m) => [...m, { id: newId(), role: "assistant", content: reply }]);
    } catch {
      setMessages((m) => [
        ...m,
        {
          id: newId(),
          role: "assistant",
          content: "Something went wrong reaching the AI — try again shortly.",
          isError: true,
        },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const acceptFiles = async (files: File[]) => {
    if (files.length === 0) return;
    const accepted: Attachment[] = [];
    for (const file of files) {
      if (!file.type.startsWith("image/")) {
        setAttachError("Please choose image files only.");
        continue;
      }
      if (file.size > 8 * 1024 * 1024) {
        setAttachError("One of those images is too large (max 8MB).");
        continue;
      }
      try {
        accepted.push(await readImageFile(file));
      } catch {
        setAttachError("Couldn't read one of those images — try a different file.");
      }
    }
    if (accepted.length > 0) {
      setAttachments((prev) => [...prev, ...accepted]);
      setAttachError(null);
      setImageMode(false); // an attachment means "use this as reference", not "generate a new image"
    }
  };

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files ?? []);
    e.target.value = ""; // allow re-selecting the same file(s) later
    await acceptFiles(files);
  };

  const handleDrop = async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    dragCounter.current = 0;
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files ?? []);
    await acceptFiles(files);
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.dataTransfer.types.includes("Files")) {
      dragCounter.current += 1;
      setIsDragging(true);
    }
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    dragCounter.current -= 1;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setIsDragging(false);
    }
  };

  const removeAttachment = (index: number) => {
    setAttachments((prev) => prev.filter((_, i) => i !== index));
  };

  const send = async () => {
    const text = input.trim();
    if ((!text && attachments.length === 0) || loading) return;
    setInput("");
    const currentAttachments = attachments;
    setAttachments([]);

    const userMessage: ChatMessage = {
      id: newId(),
      role: "user",
      content: text || (currentAttachments.length > 1 ? "What's in these images?" : "What's in this image?"),
      attachedImageUrls: currentAttachments.length ? currentAttachments.map((a) => a.dataUrl) : undefined,
    };
    const nextMessages = [...messages, userMessage];
    setMessages(nextMessages);
    await runTurn(nextMessages, currentAttachments);
  };

  // Edits a previously sent user message: truncates the conversation to that
  // point, replaces its text, drops any later messages, and regenerates the
  // assistant's response from there.
  const saveEdit = async (id: string) => {
    const idx = messages.findIndex((m) => m.id === id);
    if (idx === -1) return;
    const newText = editingText.trim();
    if (!newText) return;
    const original = messages[idx];
    const updated: ChatMessage = { ...original, content: newText };
    const truncated = [...messages.slice(0, idx), updated];
    setMessages(truncated);
    setEditingId(null);
    setEditingText("");

    // Reconstruct attachments (if any) from the data URLs stored on the
    // message so the regenerated turn can still see the image(s).
    const turnAttachments: Attachment[] = (updated.attachedImageUrls ?? []).map((dataUrl) => {
      const [meta, base64] = dataUrl.split(",");
      const mimeType = meta.match(/data:(.*);base64/)?.[1] || "image/png";
      return { dataUrl, base64, mimeType };
    });
    await runTurn(truncated, turnAttachments);
  };

  // Re-runs the turn that produced a failed assistant message, using the
  // user message immediately before it.
  const retry = async (errorId: string) => {
    const idx = messages.findIndex((m) => m.id === errorId);
    if (idx === -1) return;
    const withoutError = messages.slice(0, idx);
    const lastUser = [...withoutError].reverse().find((m) => m.role === "user");
    if (!lastUser) return;
    setMessages(withoutError);
    const turnAttachments: Attachment[] = (lastUser.attachedImageUrls ?? []).map((dataUrl) => {
      const [meta, base64] = dataUrl.split(",");
      const mimeType = meta.match(/data:(.*);base64/)?.[1] || "image/png";
      return { dataUrl, base64, mimeType };
    });
    await runTurn(withoutError, turnAttachments);
  };

  const copyMessage = async (m: ChatMessage) => {
    const textToCopy = m.content || m.imageUrl || "";
    try {
      await navigator.clipboard.writeText(textToCopy);
      setCopiedId(m.id);
      setTimeout(() => setCopiedId((cur) => (cur === m.id ? null : cur)), 1500);
    } catch {
      // clipboard permissions can fail silently in some embedded contexts
    }
  };

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-4 right-4 z-50 flex h-14 w-14 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-lg transition-transform hover:scale-105"
        aria-label="Open AI chat"
      >
        <Bot className="h-6 w-6" />
      </button>
    );
  }

  return (
    <>
      {lightboxSrc && <ImageLightbox src={lightboxSrc} onClose={() => setLightboxSrc(null)} />}
      <Card
        className={`glass-panel fixed z-50 flex origin-bottom-right transform-gpu flex-col rounded-[1.5rem] p-0 shadow-xl
                   right-4 bottom-4
                   transition-[width,height,transform] duration-500 ease-[cubic-bezier(0.22,1,0.36,1)]
                   ${isMorphing ? "scale-[0.97]" : "scale-100"}
                   ${
                     isExpanded
                       ? "w-[calc(100vw-7rem)] h-[calc(100vh-2rem)] sm:w-[calc(100vw-9rem)]"
                       : `w-[calc(100vw-2rem)] h-[75vh] max-h-[42rem]
                          sm:w-96 sm:h-[38rem]
                          lg:w-[26rem] lg:h-[44rem]`
                   }`}
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {isDragging && (
          <div className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center rounded-[1.5rem] border-2 border-dashed border-primary bg-primary/10 backdrop-blur-sm">
            <p className="rounded-full bg-background/90 px-4 py-2 text-sm font-medium text-foreground">
              Drop image(s) to attach
            </p>
          </div>
        )}
        <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
          <div className="flex items-center gap-2">
            <Bot className="h-5 w-5 text-primary" />
            <span className="font-semibold">GTEC Assistant</span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={startNewChat}
              aria-label="Start a new chat"
              title="Start a new chat"
            >
              <Plus className="h-4 w-4 text-muted-foreground hover:text-foreground" />
            </button>
            <div className="relative">
              <button
                onClick={() => setIsHistoryOpen((v) => !v)}
                aria-label="Chat history"
                title="Chat history"
              >
                <History className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              </button>
              {isHistoryOpen && (
                <>
                  {/* Click-outside catcher */}
                  <div className="fixed inset-0 z-10" onClick={() => setIsHistoryOpen(false)} />
                  <div className="absolute right-0 top-full z-20 mt-2 w-64 max-h-80 overflow-y-auto rounded-lg border border-border/50 bg-popover p-1.5 shadow-xl">
                    {[...chats]
                      .sort((a, b) => b.updatedAt - a.updatedAt)
                      .map((chat) => (
                        <button
                          key={chat.id}
                          onClick={() => switchChat(chat.id)}
                          className={`group/item flex w-full items-center justify-between gap-2 rounded-md px-2 py-1.5 text-left text-sm transition-colors hover:bg-accent hover:text-accent-foreground ${
                            chat.id === activeChatId ? "bg-accent/60" : ""
                          }`}
                        >
                          <span className="min-w-0 flex-1">
                            <span className="block truncate">{chat.title}</span>
                            <span className="block truncate text-[10px] text-muted-foreground">
                              {formatDistanceToNow(chat.updatedAt, { addSuffix: true })}
                            </span>
                          </span>
                          <span
                            role="button"
                            onClick={(e) => deleteChat(chat.id, e)}
                            aria-label="Delete chat"
                            className="shrink-0 rounded p-1 opacity-0 hover:text-destructive group-hover/item:opacity-100"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </span>
                        </button>
                      ))}
                  </div>
                </>
              )}
            </div>
            <button
              onClick={toggleExpanded}
              aria-label={isExpanded ? "Shrink chat" : "Expand chat"}
              title={isExpanded ? "Shrink chat" : "Expand chat"}
            >
              {isExpanded ? (
                <Minimize2 className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              ) : (
                <Maximize2 className="h-4 w-4 text-muted-foreground hover:text-foreground" />
              )}
            </button>
            <button onClick={() => setIsOpen(false)} aria-label="Close chat">
              <X className="h-5 w-5 text-muted-foreground hover:text-foreground" />
            </button>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 space-y-3 overflow-y-auto px-4 py-3">
          {messages.map((m) => {
            const isEditing = editingId === m.id;
            return (
              <div key={m.id} className={`group flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
                <div className={`flex ${isExpanded ? "max-w-[70%]" : "max-w-[85%]"} flex-col gap-1`}>
                  <div
                    className={`rounded-2xl px-3 py-2 text-sm ${
                      m.role === "user" ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"
                    } ${m.isError ? "border border-destructive/50" : ""}`}
                  >
                    {isEditing ? (
                      <div className="flex flex-col gap-2">
                        <textarea
                          value={editingText}
                          onChange={(e) => setEditingText(e.target.value)}
                          className="w-full resize-none rounded-lg bg-background/20 p-1.5 text-sm text-inherit outline-none"
                          rows={isExpanded ? 8 : 2}
                          autoFocus
                        />
                        <div className="flex justify-end gap-2 text-xs">
                          <button
                            onClick={() => {
                              setEditingId(null);
                              setEditingText("");
                            }}
                            className="opacity-80 hover:opacity-100"
                          >
                            Cancel
                          </button>
                          <button onClick={() => saveEdit(m.id)} className="font-semibold opacity-90 hover:opacity-100">
                            Save & regenerate
                          </button>
                        </div>
                      </div>
                    ) : (
                      <MessageContent content={m.content} />
                    )}
                    {m.attachedImageUrls && m.attachedImageUrls.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-2">
                        {m.attachedImageUrls.map((url, i) => (
                          <img
                            key={i}
                            src={url}
                            alt="Attached reference"
                            className="w-full max-w-xs cursor-zoom-in rounded-lg"
                            onClick={() => setLightboxSrc(url)}
                          />
                        ))}
                      </div>
                    )}
                    {m.imageUrl && (
                      <img
                        src={m.imageUrl}
                        alt="AI generated"
                        className="mt-2 w-full max-w-xs cursor-zoom-in rounded-lg"
                        loading="lazy"
                        onClick={() => setLightboxSrc(m.imageUrl!)}
                      />
                    )}
                  </div>
                  {!isEditing && (
                    <div
                      className={`flex items-center gap-2 px-1 text-xs text-muted-foreground opacity-0 transition-opacity group-hover:opacity-100 ${
                        m.role === "user" ? "justify-end" : "justify-start"
                      }`}
                    >
                      {m.content && (
                        <button
                          onClick={() => copyMessage(m)}
                          className="flex items-center gap-1 hover:text-foreground"
                          aria-label="Copy message"
                        >
                          {copiedId === m.id ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                        </button>
                      )}
                      {m.role === "user" && (
                        <button
                          onClick={() => {
                            setEditingId(m.id);
                            setEditingText(m.content);
                          }}
                          className="flex items-center gap-1 hover:text-foreground"
                          aria-label="Edit message"
                        >
                          <Pencil className="h-3 w-3" />
                        </button>
                      )}
                      {m.isError && (
                        <button
                          onClick={() => retry(m.id)}
                          className="flex items-center gap-1 hover:text-foreground"
                          aria-label="Retry"
                        >
                          <RotateCcw className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
          {loading && (
            <div className="flex justify-start">
              {generatingImage ? (
                <div className="flex flex-col items-center gap-2 rounded-2xl bg-muted px-4 py-4">
                  <ImageProgressRing percent={imageProgress} />
                  <span className="text-xs text-muted-foreground">Creating image…</span>
                </div>
              ) : (
                <div className="flex items-center gap-2 rounded-2xl bg-muted px-3 py-2 text-sm text-muted-foreground">
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                  Thinking…
                </div>
              )}
            </div>
          )}
        </div>

        <div className="border-t border-border/50 p-3">
          {attachments.length > 0 && (
            <div className="mb-2 flex flex-wrap gap-2">
              {attachments.map((a, i) => (
                <div key={i} className="relative">
                  <img src={a.dataUrl} alt="Attachment preview" className="h-12 w-12 rounded object-cover" />
                  <button
                    onClick={() => removeAttachment(i)}
                    aria-label="Remove attachment"
                    className="absolute -right-1.5 -top-1.5 rounded-full bg-background text-muted-foreground shadow hover:text-foreground"
                  >
                    <X className="h-3.5 w-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}
          {attachError && <p className="mb-2 text-xs text-destructive">{attachError}</p>}
          <div className="flex items-end gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              multiple
              className="hidden"
              onChange={handleFileSelect}
            />
            <Button
              type="button"
              size="icon"
              variant="outline"
              className="shrink-0"
              onClick={() => fileInputRef.current?.click()}
              title="Attach image(s) for the AI to look at"
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            <Button
              type="button"
              size="icon"
              variant={imageMode ? "default" : "outline"}
              className="shrink-0"
              onClick={() => setImageMode((v) => !v)}
              title={imageMode ? "Switch to chat mode" : "Switch to image generation mode"}
            >
              {imageMode ? <MessageSquare className="h-4 w-4" /> : <ImageIcon className="h-4 w-4" />}
            </Button>
            <Textarea
              ref={textareaRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey) {
                  e.preventDefault();
                  send();
                }
              }}
              onPaste={async (e) => {
                // Lets people paste a screenshot straight from the clipboard
                // (Ctrl/Cmd+V) instead of having to save it and use the
                // attach button. Only intercepts when the clipboard actually
                // has image data — a normal text paste behaves as usual.
                const items = Array.from(e.clipboardData?.items ?? []);
                const imageFiles = items
                  .filter((item) => item.type.startsWith("image/"))
                  .map((item) => item.getAsFile())
                  .filter((file): file is File => file !== null);
                if (imageFiles.length > 0) {
                  e.preventDefault();
                  await acceptFiles(imageFiles);
                }
              }}
              placeholder={
                attachments.length > 0 ? "Ask about this image…" : imageMode ? "Describe an image…" : "Ask something…"
              }
              disabled={loading}
              rows={1}
              className="max-h-40 min-h-0 resize-none overflow-y-auto py-2 leading-normal"
            />
            <Button
              type="button"
              size="icon"
              className="shrink-0"
              onClick={send}
              disabled={loading || (!input.trim() && attachments.length === 0)}
            >
              <Send className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </Card>
    </>
  );
};
