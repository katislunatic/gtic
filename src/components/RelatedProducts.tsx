import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { ShoppingBag } from "lucide-react";
import { shopProducts, type ShopProduct } from "@/data/shopProducts";

const statusLabels: Record<NonNullable<ShopProduct["status"]>, string> = {
  "coming-soon": "Coming Soon",
  available: "Available",
  "sold-out": "Sold Out",
};

interface RelatedProductsProps {
  currentProduct: ShopProduct;
  max?: number;
}

// Simple string hash so the picks are stable per-product (no re-shuffle on
// every render) without needing a random seed library.
const hashString = (s: string): number => {
  let h = 0;
  for (let i = 0; i < s.length; i++) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h);
};

// Picks a spread of other products the shopper might like — favors variety
// across categories over just showing more of the same thing.
const getYouMightLike = (currentProduct: ShopProduct, max: number): ShopProduct[] => {
  const others = shopProducts.filter((p) => p.id !== currentProduct.id);
  const seed = hashString(currentProduct.id);

  // Deterministic shuffle (seeded) so the list doesn't jump around on re-render.
  const shuffled = [...others]
    .map((p, i) => ({ p, sortKey: hashString(currentProduct.id + p.id + i) }))
    .sort((a, b) => a.sortKey - b.sortKey)
    .map((x) => x.p);

  // Grab one from each category first for variety, then fill remaining slots.
  const seenCategories = new Set<string>();
  const picks: ShopProduct[] = [];

  for (const p of shuffled) {
    if (picks.length >= max) break;
    if (!seenCategories.has(p.category)) {
      seenCategories.add(p.category);
      picks.push(p);
    }
  }

  if (picks.length < max) {
    for (const p of shuffled) {
      if (picks.length >= max) break;
      if (!picks.includes(p)) picks.push(p);
    }
  }

  return picks;
};

export const RelatedProducts = ({ currentProduct, max = 4 }: RelatedProductsProps) => {
  const picks = getYouMightLike(currentProduct, max);

  if (picks.length === 0) return null;

  return (
    <div className="mt-16">
      <h2 className="text-xl font-bold mb-6">
        You Might Also <span className="hero-text">Like</span>
      </h2>
      <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {picks.map((product) => (
          <Card key={product.id} className="team-card overflow-hidden group relative">
            <Link to={`/shop/${product.id}`}>
              <div className="aspect-[4/5] w-full bg-muted overflow-hidden relative">
                {product.images[0] ? (
                  <img
                    src={product.images[0]}
                    alt={product.name}
                    className="h-full w-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                ) : (
                  <div className="h-full w-full flex items-center justify-center">
                    <ShoppingBag className="h-8 w-8 text-muted-foreground/40" />
                  </div>
                )}
                <span className="absolute bottom-2 right-2 rounded-full bg-background/90 px-2.5 py-0.5 text-[10px] font-semibold backdrop-blur-sm">
                  {statusLabels[product.status ?? "coming-soon"]}
                </span>
              </div>
              <CardContent className="p-3">
                <p className="text-[10px] uppercase tracking-wide text-muted-foreground mb-0.5">
                  {product.category}
                </p>
                <h3 className="font-semibold text-sm leading-snug mb-0.5 truncate">{product.name}</h3>
                <p className="text-xs text-muted-foreground">{product.price}</p>
              </CardContent>
            </Link>
          </Card>
        ))}
      </div>
    </div>
  );
};
