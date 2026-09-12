import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, ShoppingBag, SlidersHorizontal, X } from "lucide-react";
import { Footer } from "@/components/Footer";
import { shopProducts, type ShopProduct } from "@/data/shopProducts";

type SortOption = "relevance" | "price-asc" | "price-desc" | "name-asc" | "name-desc";
type StatusFilter = "coming-soon" | "available" | "sold-out";

const statusLabels: Record<StatusFilter, string> = {
  "coming-soon": "Coming Soon",
  available: "Available",
  "sold-out": "Sold Out",
};

const statusBadgeStyles: Record<StatusFilter, string> = {
  "coming-soon": "bg-background/90 text-foreground",
  available: "bg-primary text-primary-foreground",
  "sold-out": "bg-destructive text-destructive-foreground",
};

const getStatus = (product: ShopProduct): StatusFilter => product.status ?? "coming-soon";

const getPriceValue = (price: string): number => {
  const parsed = parseFloat(price.replace(/[^0-9.]/g, ""));
  return Number.isNaN(parsed) ? 0 : parsed;
};

export const Shop = () => {
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortOption>("relevance");
  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [selectedStatuses, setSelectedStatuses] = useState<StatusFilter[]>([]);

  const categories = useMemo(
    () => Array.from(new Set(shopProducts.map((p) => p.category))).sort(),
    []
  );

  const toggleCategory = (category: string) => {
    setSelectedCategories((prev) =>
      prev.includes(category) ? prev.filter((c) => c !== category) : [...prev, category]
    );
  };

  const toggleStatus = (status: StatusFilter) => {
    setSelectedStatuses((prev) =>
      prev.includes(status) ? prev.filter((s) => s !== status) : [...prev, status]
    );
  };

  const clearFilters = () => {
    setQuery("");
    setSelectedCategories([]);
    setSelectedStatuses([]);
    setSort("relevance");
  };

  const hasActiveFilters =
    query.trim() !== "" || selectedCategories.length > 0 || selectedStatuses.length > 0 || sort !== "relevance";

  const activeFilterCount = selectedCategories.length + selectedStatuses.length;

  const filteredProducts = useMemo(() => {
    const q = query.trim().toLowerCase();

    let results = shopProducts.filter((product) => {
      const matchesQuery =
        q === "" ||
        product.name.toLowerCase().includes(q) ||
        product.category.toLowerCase().includes(q) ||
        product.description.toLowerCase().includes(q);

      const matchesCategory =
        selectedCategories.length === 0 || selectedCategories.includes(product.category);

      const matchesStatus =
        selectedStatuses.length === 0 || selectedStatuses.includes(getStatus(product));

      return matchesQuery && matchesCategory && matchesStatus;
    });

    switch (sort) {
      case "price-asc":
        results = [...results].sort((a, b) => getPriceValue(a.price) - getPriceValue(b.price));
        break;
      case "price-desc":
        results = [...results].sort((a, b) => getPriceValue(b.price) - getPriceValue(a.price));
        break;
      case "name-asc":
        results = [...results].sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "name-desc":
        results = [...results].sort((a, b) => b.name.localeCompare(a.name));
        break;
      default:
        break;
    }

    return results;
  }, [query, selectedCategories, selectedStatuses, sort]);

  return (
    <div className="min-h-screen pt-20 pb-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-10">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="hero-text">Shop</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Official GTEC gear. Drops coming soon — take a look at what's on the way.
          </p>
        </div>

        {/* Search + Sort + Filters */}
        <div className="flex flex-col sm:flex-row gap-3 mb-10 max-w-3xl mx-auto">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search shirts, pants, jerseys..."
              className="pl-9"
            />
          </div>

          <Select value={sort} onValueChange={(v) => setSort(v as SortOption)}>
            <SelectTrigger className="sm:w-52">
              <SlidersHorizontal className="h-4 w-4 mr-2 text-muted-foreground" />
              <SelectValue placeholder="Sort by" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="relevance">Relevance</SelectItem>
              <SelectItem value="price-asc">Price: Low to High</SelectItem>
              <SelectItem value="price-desc">Price: High to Low</SelectItem>
              <SelectItem value="name-asc">Name: A to Z</SelectItem>
              <SelectItem value="name-desc">Name: Z to A</SelectItem>
            </SelectContent>
          </Select>

          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" className="sm:w-auto gap-2">
                <SlidersHorizontal className="h-4 w-4" />
                Filters
                {activeFilterCount > 0 && (
                  <span className="ml-1 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground text-xs font-semibold">
                    {activeFilterCount}
                  </span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent align="end" className="w-80">
              <div className="space-y-5">
                <div>
                  <p className="text-sm font-semibold mb-2">Category</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-2">
                    {categories.map((category) => (
                      <div key={category} className="flex items-center gap-2">
                        <Checkbox
                          id={`cat-${category}`}
                          checked={selectedCategories.includes(category)}
                          onCheckedChange={() => toggleCategory(category)}
                        />
                        <Label htmlFor={`cat-${category}`} className="text-sm font-normal cursor-pointer">
                          {category}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-sm font-semibold mb-2">Availability</p>
                  <div className="flex flex-wrap gap-x-4 gap-y-2">
                    {(Object.keys(statusLabels) as StatusFilter[]).map((status) => (
                      <div key={status} className="flex items-center gap-2">
                        <Checkbox
                          id={`status-${status}`}
                          checked={selectedStatuses.includes(status)}
                          onCheckedChange={() => toggleStatus(status)}
                        />
                        <Label htmlFor={`status-${status}`} className="text-sm font-normal cursor-pointer">
                          {statusLabels[status]}
                        </Label>
                      </div>
                    ))}
                  </div>
                </div>

                {(selectedCategories.length > 0 || selectedStatuses.length > 0) && (
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedCategories([]);
                      setSelectedStatuses([]);
                    }}
                    className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
                  >
                    <X className="h-3.5 w-3.5" /> Clear filters
                  </button>
                )}
              </div>
            </PopoverContent>
          </Popover>
        </div>

        {hasActiveFilters && (
          <div className="max-w-3xl mx-auto -mt-6 mb-6">
            <button
              type="button"
              onClick={clearFilters}
              className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <X className="h-3.5 w-3.5" /> Clear all
            </button>
          </div>
        )}

        {filteredProducts.length === 0 ? (
          <div className="text-center py-16">
            <ShoppingBag className="h-12 w-12 mx-auto mb-4 text-muted-foreground/50" />
            <p className="text-lg font-medium mb-1">No products found</p>
            <p className="text-sm text-muted-foreground">Try adjusting your search or filters.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product, index) => (
              <Card
                key={product.id}
                className="team-card overflow-hidden group relative animate-fade-in"
                style={{ animationDelay: `${index * 50}ms` }}
              >
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
                        <ShoppingBag className="h-10 w-10 text-muted-foreground/40" />
                      </div>
                    )}
                    <span className={`absolute bottom-2 right-2 rounded-full px-3 py-1 text-xs font-semibold backdrop-blur-sm ${statusBadgeStyles[getStatus(product)]}`}>
                      {statusLabels[getStatus(product)]}
                    </span>
                  </div>
                  <CardContent className="p-4">
                    <p className="text-xs uppercase tracking-wide text-muted-foreground mb-1">
                      {product.category}
                    </p>
                    <h3 className="font-semibold leading-snug mb-1">{product.name}</h3>
                    <p className="text-sm text-muted-foreground">{product.price}</p>
                  </CardContent>
                </Link>
              </Card>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </div>
  );
};
