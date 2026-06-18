import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "@/components/ui/sheet";
import { ShoppingCart, Download, Check, Trash2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import wp1 from "@/assets/wallpapers/wallpaper-1.png.asset.json";
import wp2 from "@/assets/wallpapers/wallpaper-2.png.asset.json";
import wp3 from "@/assets/wallpapers/wallpaper-3.png.asset.json";
import wp4 from "@/assets/wallpapers/wallpaper-4.png.asset.json";
import wp5 from "@/assets/wallpapers/wallpaper-5.png.asset.json";
import wp6 from "@/assets/wallpapers/wallpaper-6.png.asset.json";

interface Wallpaper {
  id: string;
  name: string;
  url: string;
  filename: string;
  orientation: "landscape" | "portrait";
}

const WALLPAPERS: Wallpaper[] = [
  { id: "wp1", name: "Brushstroke Split", url: wp1.url, filename: "gtec-brushstroke-split.png", orientation: "landscape" },
  { id: "wp2", name: "GTEC Poster", url: wp2.url, filename: "gtec-poster.png", orientation: "portrait" },
  { id: "wp3", name: "Mountain Horizon", url: wp3.url, filename: "gtec-mountain-horizon.png", orientation: "landscape" },
  { id: "wp4", name: "Cloud Gradient", url: wp4.url, filename: "gtec-cloud-gradient.png", orientation: "portrait" },
  { id: "wp5", name: "GTEC Watermark", url: wp5.url, filename: "gtec-watermark.png", orientation: "portrait" },
  { id: "wp6", name: "Classic Split", url: wp6.url, filename: "gtec-classic-split.png", orientation: "portrait" },
];

const OWNED_KEY = "gtec_owned_wallpapers";
const CART_KEY = "gtec_wallpaper_cart";

const loadSet = (key: string): string[] => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
};

const downloadWallpaper = async (wp: Wallpaper) => {
  try {
    const res = await fetch(wp.url);
    const blob = await res.blob();
    const blobUrl = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = blobUrl;
    a.download = wp.filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(blobUrl);
  } catch {
    window.open(wp.url, "_blank");
  }
};

interface WallpapersProps {
  isAdmin?: boolean;
}

export const Wallpapers = ({ isAdmin }: WallpapersProps) => {
  const [owned, setOwned] = useState<string[]>([]);
  const [cart, setCart] = useState<string[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    setOwned(loadSet(OWNED_KEY));
    setCart(loadSet(CART_KEY));
  }, []);

  const persistOwned = (next: string[]) => {
    setOwned(next);
    localStorage.setItem(OWNED_KEY, JSON.stringify(next));
  };
  const persistCart = (next: string[]) => {
    setCart(next);
    localStorage.setItem(CART_KEY, JSON.stringify(next));
  };

  const addToCart = (id: string) => {
    if (cart.includes(id) || owned.includes(id)) return;
    persistCart([...cart, id]);
    toast({ title: "Added to cart", description: "Wallpaper added to your cart." });
  };

  const removeFromCart = (id: string) => {
    persistCart(cart.filter((c) => c !== id));
  };

  const checkout = () => {
    const newOwned = Array.from(new Set([...owned, ...cart]));
    persistOwned(newOwned);
    persistCart([]);
    setCartOpen(false);
    toast({ title: "Purchase complete!", description: "Your wallpapers are ready to download." });
  };

  const cartItems = WALLPAPERS.filter((w) => cart.includes(w.id));

  return (
    <div className="min-h-screen pt-24 pb-16 px-4">
      <div className="container mx-auto max-w-7xl">
        <div className="flex items-start justify-between mb-8 flex-wrap gap-4">
          <div>
            <h1 className="text-4xl md:text-5xl font-bold hero-text mb-2">Wallpapers</h1>
            <p className="text-muted-foreground">Official GTEC wallpapers. Free for all members.</p>
          </div>
          <Sheet open={cartOpen} onOpenChange={setCartOpen}>
            <SheetTrigger asChild>
              <Button variant="outline" className="relative">
                <ShoppingCart className="h-4 w-4 mr-2" />
                Cart
                {cart.length > 0 && (
                  <Badge className="ml-2 bg-primary text-primary-foreground">{cart.length}</Badge>
                )}
              </Button>
            </SheetTrigger>
            <SheetContent className="bg-background">
              <SheetHeader>
                <SheetTitle>Your Cart</SheetTitle>
              </SheetHeader>
              <div className="mt-6 space-y-4">
                {cartItems.length === 0 ? (
                  <p className="text-muted-foreground text-sm">Your cart is empty.</p>
                ) : (
                  <>
                    {cartItems.map((w) => (
                      <div key={w.id} className="flex items-center gap-3 border border-border rounded-lg p-2">
                        <img src={w.url} alt={w.name} className="h-14 w-14 object-cover rounded" />
                        <div className="flex-1 min-w-0">
                          <p className="font-medium truncate">{w.name}</p>
                          <p className="text-sm text-muted-foreground">$0.00</p>
                        </div>
                        <Button variant="ghost" size="icon" onClick={() => removeFromCart(w.id)}>
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                    <div className="border-t border-border pt-4 space-y-2">
                      <div className="flex justify-between font-semibold">
                        <span>Total</span>
                        <span>$0.00</span>
                      </div>
                      <Button onClick={checkout} className="w-full">
                        Checkout
                      </Button>
                    </div>
                  </>
                )}
              </div>
            </SheetContent>
          </Sheet>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {WALLPAPERS.map((w) => {
            const isOwned = owned.includes(w.id);
            const inCart = cart.includes(w.id);
            return (
              <Card key={w.id} className="overflow-hidden card-gradient border-border flex flex-col">
                <div className={`relative bg-muted ${w.orientation === "portrait" ? "aspect-[9/16]" : "aspect-video"}`}>
                  <img src={w.url} alt={w.name} className="absolute inset-0 w-full h-full object-cover" loading="lazy" />
                  {isOwned && (
                    <Badge className="absolute top-2 right-2 bg-primary text-primary-foreground">
                      <Check className="h-3 w-3 mr-1" /> Owned
                    </Badge>
                  )}
                </div>
                <div className="p-4 flex items-center justify-between gap-2">
                  <div>
                    <p className="font-semibold">{w.name}</p>
                    <p className="text-sm text-muted-foreground">$0.00</p>
                  </div>
                  {isOwned ? (
                    <Button size="sm" onClick={() => downloadWallpaper(w)}>
                      <Download className="h-4 w-4 mr-1" /> Download
                    </Button>
                  ) : inCart ? (
                    <Button size="sm" variant="outline" onClick={() => removeFromCart(w.id)}>
                      In Cart
                    </Button>
                  ) : (
                    <Button size="sm" variant="outline" onClick={() => addToCart(w.id)}>
                      <ShoppingCart className="h-4 w-4 mr-1" /> Add
                    </Button>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default Wallpapers;