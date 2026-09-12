import { faqData } from "@/data/faqData";
import { shopProducts } from "@/data/shopProducts";

export interface SearchResult {
  title: string;
  subtitle?: string;
  path: string;
  type: "Page" | "FAQ" | "Shop";
}

// Static pages that always exist. Shop is included conditionally by the
// caller based on the shop_enabled setting, since it may be hidden.
const staticPages: SearchResult[] = [
  { title: "Home", path: "/", type: "Page" },
  { title: "Teams", path: "/teams", type: "Page" },
  { title: "Bracket", path: "/bracket", type: "Page" },
  { title: "Staff", path: "/staff", type: "Page" },
  { title: "Color Code Selector", path: "/color-selector", type: "Page" },
  { title: "Sponsorships", path: "/sponsorships", type: "Page" },
  { title: "FAQ", path: "/faq", type: "Page" },
  { title: "Credits", path: "/credits", type: "Page" },
  { title: "Shipping & Returns", path: "/shipping-returns", type: "Page" },
];

const faqResults: SearchResult[] = faqData.map((f, i) => ({
  title: f.question,
  subtitle: f.answer,
  // Carries which accordion item to auto-open when landing on /faq (see FAQ.tsx).
  path: `/faq?open=${i}`,
  type: "FAQ",
}));

const shopResults: SearchResult[] = shopProducts.map((p) => ({
  title: p.name,
  subtitle: `${p.category} \u2014 ${p.price}`,
  path: `/shop/${p.id}`,
  type: "Shop",
}));

// Builds the full searchable index. Note: this only covers static content
// (pages, FAQ, shop products) — dynamic admin-managed content like Teams,
// Staff rosters, and Sponsorships entries isn't indexed since it lives in
// Supabase and can change at any time; adding that would mean a live query
// per keystroke instead of a static in-memory list.
export const buildSearchIndex = (shopEnabled: boolean): SearchResult[] => [
  ...staticPages,
  ...faqResults,
  ...(shopEnabled ? shopResults : []),
];

export const searchIndex = (index: SearchResult[], query: string): SearchResult[] => {
  const q = query.trim().toLowerCase();
  if (!q) return [];
  return index
    .filter((item) => item.title.toLowerCase().includes(q) || item.subtitle?.toLowerCase().includes(q))
    .slice(0, 8);
};
