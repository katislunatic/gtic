import { useState, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ArrowLeft, ChevronLeft, ChevronRight, ShoppingBag, ZoomIn } from "lucide-react";
import { Footer } from "@/components/Footer";
import { RelatedProducts } from "@/components/RelatedProducts";
import { SizeChartTable } from "@/components/SizeChartTable";
import { useCart } from "@/hooks/use-cart";
import { useToast } from "@/hooks/use-toast";
import { shopProducts, couponCodes } from "@/data/shopProducts";

export const ShopProduct = () => {
  const { productId } = useParams();
  const { addItem } = useCart();
  const { toast } = useToast();
  const [activeImage, setActiveImage] = useState(0);
  const [selectedColorIndex, setSelectedColorIndex] = useState(0);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [lightboxOpen, setLightboxOpen] = useState(false);
  const [customName, setCustomName] = useState("");
  const [customNumber, setCustomNumber] = useState("");
  const [selectedBundleIndex, setSelectedBundleIndex] = useState(0);
  const [sizeGroup, setSizeGroup] = useState<"adult" | "youth">("adult");
  const [couponInput, setCouponInput] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<typeof couponCodes[number] | null>(null);
  const [couponError, setCouponError] = useState("");

  const product = shopProducts.find((p) => p.id === productId);

  // Reset selection state when navigating between products
  useMemo(() => {
    setActiveImage(0);
    setSelectedColorIndex(0);
    setSelectedSize(product?.sizes?.[0] ?? null);
    setCustomName("");
    setCustomNumber("");
    setSelectedBundleIndex(0);
    setSizeGroup("adult");
    setCouponInput("");
    setAppliedCoupon(null);
    setCouponError("");
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [productId]);

  if (!product) {
    return (
      <div className="min-h-screen pt-24 pb-8">
        <div className="container mx-auto px-4 text-center py-16">
          <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
          <p className="text-lg font-medium mb-1">Product not found</p>
          <Link to="/shop">
            <Button variant="outline" className="mt-4 gap-2">
              <ArrowLeft className="h-4 w-4" /> Back to Shop
            </Button>
          </Link>
        </div>
        <Footer />
      </div>
    );
  }

  const hasColors = !!product.colors && product.colors.length > 0;
  const images = product.images;

  // Unified gallery index: when the product has colors, the gallery walks
  // through colors; otherwise it walks through the plain images array.
  const galleryLength = hasColors ? product.colors!.length : images.length;
  const galleryIndex = hasColors ? selectedColorIndex : activeImage;

  const goToIndex = (i: number) => {
    if (hasColors) {
      setSelectedColorIndex(i);
    }
    setActiveImage(i);
  };

  const goPrev = () => {
    goToIndex(galleryIndex === 0 ? galleryLength - 1 : galleryIndex - 1);
  };
  const goNext = () => {
    goToIndex(galleryIndex === galleryLength - 1 ? 0 : galleryIndex + 1);
  };

  // When the product has colors, the main image follows the selected color.
  // Otherwise it follows the thumbnail-selected image.
  const activeUrl = hasColors
    ? product.colors![selectedColorIndex].image
    : images[activeImage];

  const displayName = hasColors
    ? `${product.name} (${product.colors![selectedColorIndex].name})`
    : product.name;

  const hasBundleOptions = !!product.bundleOptions && product.bundleOptions.length > 0;
  const basePrice = hasBundleOptions
    ? product.bundleOptions![selectedBundleIndex].price
    : product.price;

  const parsePrice = (price: string) => Number(price.replace(/[^0-9.]/g, ""));
  const formatPrice = (n: number) => `$${n.toFixed(2)}`;

  const basePriceNum = parsePrice(basePrice);
  const discountedPriceNum = appliedCoupon
    ? Math.max(
        0,
        appliedCoupon.type === "percent"
          ? basePriceNum * (1 - appliedCoupon.value / 100)
          : basePriceNum - appliedCoupon.value
      )
    : basePriceNum;

  const displayPrice = basePrice;

  const applyCoupon = () => {
    const code = couponInput.trim().toUpperCase();
    if (!code) return;
    const match = couponCodes.find((c) => c.code === code);
    if (!match) {
      setCouponError("Invalid code");
      setAppliedCoupon(null);
      return;
    }
    if (match.appliesTo && !match.appliesTo.includes(product.id)) {
      setCouponError("Code not valid for this item");
      setAppliedCoupon(null);
      return;
    }
    setCouponError("");
    setAppliedCoupon(match);
    toast({ title: "Code applied", description: match.description });
  };

  const clearCoupon = () => {
    setAppliedCoupon(null);
    setCouponInput("");
    setCouponError("");
  };

  const status = product.status ?? "coming-soon";
  const statusLabels: Record<typeof status, string> = {
    "coming-soon": "Coming Soon",
    available: "Available",
    "sold-out": "Sold Out",
  };
  const statusStyles: Record<typeof status, string> = {
    "coming-soon": "bg-muted text-muted-foreground",
    available: "bg-primary/15 text-primary",
    "sold-out": "bg-destructive/15 text-destructive",
  };

  const savedAmount = appliedCoupon ? Math.max(0, basePriceNum - discountedPriceNum) : 0;

  const handleAddToCart = () => {
    const bundleLabel = hasBundleOptions ? product.bundleOptions![selectedBundleIndex].label : undefined;
    const color = hasColors ? product.colors![selectedColorIndex].name : undefined;
    const key = [product.id, bundleLabel, color, selectedSize].filter(Boolean).join("::");
    addItem({
      key,
      productId: product.id,
      name: displayName,
      image: activeUrl || product.images[0] || "",
      price: discountedPriceNum,
      size: selectedSize ?? undefined,
      color,
      bundleLabel,
      couponCode: appliedCoupon?.code,
    });
    toast({ title: "Added to cart", description: displayName });
  };

  const hasYouthSizes = !!product.youthSizes && product.youthSizes.length > 0;
  const activeSizeList = hasYouthSizes && sizeGroup === "youth" ? product.youthSizes! : product.sizes;

  const colorSwatchStyle = (colorName: string) => {
    const key = colorName.toLowerCase();
    if (key.includes("black")) return "#000000";
    if (key.includes("grey") || key.includes("gray")) return "#8a8a8a";
    if (key.includes("white")) return "#ffffff";
    if (key.includes("red")) return "#ef4444";
    if (key.includes("blue")) return "#3b82f6";
    return "#888888";
  };

  return (
    <div className="min-h-screen pt-20 pb-8">
      <div className="container mx-auto px-4">
        <Link to="/shop" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6">
          <ArrowLeft className="h-4 w-4" /> Back to Shop
        </Link>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
          {/* Gallery */}
          <div>
            <Card className="team-card overflow-hidden mb-3">
              <div className="group relative w-full bg-muted flex items-center justify-center">
                <button
                  type="button"
                  onClick={() => activeUrl && setLightboxOpen(true)}
                  className="block w-full"
                >
                  {activeUrl ? (
                    <>
                      <img src={activeUrl} alt={displayName} className="w-full h-auto" />
                      <span className="absolute bottom-2 right-2 rounded-full bg-background/90 p-2 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity">
                        <ZoomIn className="h-4 w-4" />
                      </span>
                    </>
                  ) : (
                    <ShoppingBag className="h-16 w-16 text-muted-foreground/40 my-16 mx-auto" />
                  )}
                </button>

                {/* Prev/next arrows — wrap around at either end */}
                {galleryLength > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      goPrev();
                    }}
                    aria-label="Previous image"
                    className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
                  >
                    <ChevronLeft className="h-5 w-5" />
                  </button>
                )}
                {galleryLength > 1 && (
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      goNext();
                    }}
                    aria-label="Next image"
                    className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-2 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity hover:bg-background"
                  >
                    <ChevronRight className="h-5 w-5" />
                  </button>
                )}
              </div>
            </Card>

            {!hasColors && images.length > 1 && (
              <div className="flex gap-3 flex-wrap">
                {images.map((img, i) => (
                  <button
                    key={img + i}
                    onClick={() => setActiveImage(i)}
                    className={`h-20 w-20 rounded-lg overflow-hidden border-2 transition-colors ${
                      i === activeImage ? "border-primary" : "border-border/50"
                    }`}
                  >
                    <img src={img} alt={`${product.name} ${i + 1}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}

            {hasColors && (
              <div className="flex gap-3 flex-wrap">
                {product.colors!.map((color, i) => (
                  <button
                    key={color.name}
                    onClick={() => {
                      setSelectedColorIndex(i);
                      setActiveImage(i);
                    }}
                    className={`h-20 w-20 rounded-lg overflow-hidden border-2 transition-colors ${
                      i === selectedColorIndex ? "border-primary" : "border-border/50"
                    }`}
                  >
                    <img src={color.image} alt={`${product.name} ${color.name}`} className="h-full w-full object-cover" />
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Info */}
          <div>
            <p className="text-sm uppercase tracking-wide text-muted-foreground mb-2 flex items-center gap-2">
              {product.category}
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold normal-case tracking-normal ${statusStyles[status]}`}>
                {statusLabels[status]}
              </span>
            </p>
            <h1 className="text-3xl md:text-4xl font-bold mb-3">
              <span className="hero-text">{displayName}</span>
            </h1>
            <p className="text-2xl font-semibold mb-1 flex items-center gap-2">
              {appliedCoupon ? (
                <>
                  <span className="line-through text-muted-foreground text-lg">{displayPrice}</span>
                  <span>{formatPrice(discountedPriceNum)}</span>
                  <span className="text-xs font-semibold text-primary bg-primary/10 px-2 py-0.5 rounded-full">
                    Save {formatPrice(savedAmount)}
                  </span>
                </>
              ) : (
                displayPrice
              )}
            </p>
            <p className="text-xs text-muted-foreground mb-6">
              Printed &amp; shipped by Fanjoy
            </p>

            {/* Coupon code */}
            <div className="mb-6">
              <p className="text-sm font-medium mb-2">Have a coupon code?</p>
              {appliedCoupon ? (
                <div className="flex items-center justify-between rounded-lg border border-primary bg-primary/10 px-4 py-2">
                  <div>
                    <span className="text-sm font-semibold">{appliedCoupon.code}</span>
                    <span className="text-xs text-muted-foreground ml-2">{appliedCoupon.description}</span>
                  </div>
                  <button
                    type="button"
                    onClick={clearCoupon}
                    className="text-xs text-muted-foreground hover:text-foreground underline"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <Input
                    placeholder="Enter code"
                    value={couponInput}
                    onChange={(e) => {
                      setCouponInput(e.target.value);
                      setCouponError("");
                    }}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") applyCoupon();
                    }}
                    className="uppercase"
                  />
                  <Button type="button" variant="outline" onClick={applyCoupon}>
                    Apply
                  </Button>
                </div>
              )}
              {couponError && <p className="text-xs text-destructive mt-1">{couponError}</p>}
            </div>

            {/* Bundle selector */}
            {hasBundleOptions && (
              <div className="mb-6">
                <p className="text-sm font-medium mb-2">Options</p>
                <div className="flex flex-wrap gap-2">
                  {product.bundleOptions!.map((option, i) => (
                    <button
                      key={option.label}
                      type="button"
                      onClick={() => setSelectedBundleIndex(i)}
                      className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                        i === selectedBundleIndex
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:bg-muted/40"
                      }`}
                    >
                      {option.label} — {option.price}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Color selector */}
            {hasColors && (
              <div className="mb-6">
                <p className="text-sm font-medium mb-2">
                  Color: <span className="text-muted-foreground">{product.colors![selectedColorIndex].name}</span>
                </p>
                <div className="flex items-center gap-3">
                  {product.colors!.map((color, i) => (
                    <button
                      key={color.name}
                      type="button"
                      onClick={() => {
                        setSelectedColorIndex(i);
                        setActiveImage(i);
                      }}
                      title={color.name}
                      aria-label={color.name}
                      className={`h-8 w-8 rounded-full border-2 transition-all ${
                        i === selectedColorIndex ? "border-primary scale-110" : "border-border/60"
                      }`}
                      style={{ backgroundColor: colorSwatchStyle(color.name) }}
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Size selector */}
            {activeSizeList && activeSizeList.length > 0 && (
              <div className="mb-6">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm font-medium">
                    Size: <span className="text-muted-foreground">{selectedSize}</span>
                  </p>
                  {hasYouthSizes && (
                    <div className="flex rounded-lg border border-border overflow-hidden text-xs">
                      <button
                        type="button"
                        onClick={() => {
                          setSizeGroup("adult");
                          setSelectedSize(product.sizes?.[0] ?? null);
                        }}
                        className={`px-3 py-1.5 font-medium transition-colors ${
                          sizeGroup === "adult"
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted/40"
                        }`}
                      >
                        Adult
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSizeGroup("youth");
                          setSelectedSize(product.youthSizes?.[0] ?? null);
                        }}
                        className={`px-3 py-1.5 font-medium transition-colors ${
                          sizeGroup === "youth"
                            ? "bg-primary text-primary-foreground"
                            : "hover:bg-muted/40"
                        }`}
                      >
                        Youth
                      </button>
                    </div>
                  )}
                </div>
                <div className="flex flex-wrap gap-2">
                  {activeSizeList.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={`px-4 py-2 rounded-lg border text-sm font-medium transition-colors ${
                        size === selectedSize
                          ? "border-primary bg-primary text-primary-foreground"
                          : "border-border hover:bg-muted/40"
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Name/number customization */}
            {product.customizable && (
              <div className="mb-6 space-y-3">
                <p className="text-sm font-medium">Customize your jersey</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label htmlFor="jersey-name" className="text-xs text-muted-foreground mb-1 block">
                      Name
                    </Label>
                    <Input
                      id="jersey-name"
                      placeholder="e.g. SMITH"
                      maxLength={12}
                      value={customName}
                      onChange={(e) => setCustomName(e.target.value.toUpperCase())}
                    />
                  </div>
                  <div>
                    <Label htmlFor="jersey-number" className="text-xs text-muted-foreground mb-1 block">
                      Number
                    </Label>
                    <Input
                      id="jersey-number"
                      placeholder="e.g. 00"
                      maxLength={2}
                      inputMode="numeric"
                      value={customNumber}
                      onChange={(e) => setCustomNumber(e.target.value.replace(/[^0-9]/g, ""))}
                    />
                  </div>
                </div>
              </div>
            )}

            <Button
              disabled={status !== "available"}
              onClick={handleAddToCart}
              className="w-full mb-2 text-base py-6"
              size="lg"
            >
              {status === "available" ? "Add to Cart" : statusLabels[status]}
            </Button>
            <p className="text-xs text-muted-foreground mb-6">
              {status === "available"
                ? "Ships once the shop drop goes live."
                : "This item isn't available yet. Check back soon for the drop."}
            </p>

            {product.description && (
              <p className="text-muted-foreground mb-6 leading-relaxed">{product.description}</p>
            )}

            {/* Materials & Size Chart — always visible */}
            <div className="space-y-4">
              {product.materials && (
                <div className="border border-border rounded-lg px-4 py-3">
                  <h3 className="font-semibold mb-1">Materials</h3>
                  <p className="text-muted-foreground text-sm">{product.materials}</p>
                </div>
              )}
              {product.garmentType ? (
                <SizeChartTable garmentType={product.garmentType} />
              ) : (
                product.sizeChart && (
                  <div className="border border-border rounded-lg px-4 py-3">
                    <h3 className="font-semibold mb-1">Size Chart</h3>
                    <p className="text-muted-foreground text-sm">{product.sizeChart}</p>
                  </div>
                )
              )}
            </div>
          </div>
        </div>

        <RelatedProducts currentProduct={product} />
      </div>

      {/* Full-image lightbox */}
      <Dialog open={lightboxOpen} onOpenChange={setLightboxOpen}>
        <DialogContent className="max-w-4xl w-full bg-background/95 p-2 sm:p-4">
          <DialogTitle className="sr-only">{displayName}</DialogTitle>
          {activeUrl && (
            <img
              src={activeUrl}
              alt={displayName}
              className="w-full max-h-[85vh] object-contain rounded-md"
            />
          )}
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};
