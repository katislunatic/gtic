import { useEffect, useMemo, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useNavigate } from "react-router-dom";
import { Search, X, FileText, HelpCircle, ShoppingBag } from "lucide-react";
import { Button } from "@/components/ui/button";
import { buildSearchIndex, searchIndex, type SearchResult } from "@/lib/search-index";

const typeIcon: Record<SearchResult["type"], typeof FileText> = {
  Page: FileText,
  FAQ: HelpCircle,
  Shop: ShoppingBag,
};

interface GlobalSearchProps {
  shopEnabled: boolean;
}

// A magnifying-glass button that expands inline into a search bar (rather
// than a modal), with a dropdown of matching pages/FAQ/shop results as you
// type. The dropdown is rendered via a portal to document.body — the nav bar
// uses `.glass-panel` (overflow: hidden) to get its rounded shape, which was
// silently clipping the dropdown to invisible before. Click outside or hit
// Escape to collapse back to just the icon; Enter jumps to the top result.
export const GlobalSearch = ({ shopEnabled }: GlobalSearchProps) => {
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState("");
  const [dropdownRect, setDropdownRect] = useState<{ top: number; right: number } | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();

  const index = useMemo(() => buildSearchIndex(shopEnabled), [shopEnabled]);
  const results = useMemo(() => searchIndex(index, query), [index, query]);

  const collapse = () => {
    setExpanded(false);
    setQuery("");
  };

  useEffect(() => {
    if (expanded) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [expanded]);

  // Recompute where the dropdown should sit (below the search bar, right
  // edge aligned) whenever it opens, the query changes, or the window
  // resizes — since it's portaled out, it no longer moves with the bar
  // automatically the way an in-flow element would.
  useEffect(() => {
    if (!expanded) return;
    const updateRect = () => {
      const rect = containerRef.current?.getBoundingClientRect();
      if (rect) {
        setDropdownRect({ top: rect.bottom + 8, right: window.innerWidth - rect.right });
      }
    };
    updateRect();
    window.addEventListener("resize", updateRect);
    window.addEventListener("scroll", updateRect, true);
    return () => {
      window.removeEventListener("resize", updateRect);
      window.removeEventListener("scroll", updateRect, true);
    };
  }, [expanded, query]);

  useEffect(() => {
    if (!expanded) return;
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as Node;
      const insideBar = containerRef.current?.contains(target);
      // The dropdown is portaled to document.body, so it's outside
      // containerRef's DOM subtree — without this check, clicking a result
      // would register as "outside" and collapse the search (removing the
      // button from the DOM) before the click could actually fire.
      const insideDropdown = dropdownRef.current?.contains(target);
      if (!insideBar && !insideDropdown) {
        collapse();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [expanded]);

  const handleSelect = (result: SearchResult) => {
    navigate(result.path);
    collapse();
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Escape") {
      collapse();
    } else if (e.key === "Enter" && results.length > 0) {
      handleSelect(results[0]);
    }
  };

  return (
    <div ref={containerRef} className="relative flex items-center">
      <div
        className={`flex items-center overflow-hidden transition-all duration-200 ${
          expanded ? "w-56 sm:w-72 rounded-full border border-border bg-background/80" : "w-10 rounded-md border border-transparent"
        }`}
      >
        <Button
          variant="ghost"
          size="icon"
          className="h-10 w-10 shrink-0"
          onClick={() => setExpanded((prev) => !prev)}
          aria-label="Search the site"
        >
          <Search className="h-4 w-4" />
        </Button>
        {expanded && (
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Search the site..."
            className="flex-1 bg-transparent text-sm outline-none pr-2 py-1.5 min-w-0"
          />
        )}
        {expanded && query && (
          <Button variant="ghost" size="icon" className="h-7 w-7 mr-1 shrink-0" onClick={() => setQuery("")} aria-label="Clear search">
            <X className="h-3.5 w-3.5" />
          </Button>
        )}
      </div>

      {expanded &&
        query &&
        dropdownRect &&
        typeof document !== "undefined" &&
        createPortal(
          <div
            ref={dropdownRef}
            className="fixed w-72 sm:w-80 max-h-80 overflow-y-auto rounded-lg border border-border bg-popover shadow-xl z-[100] animate-fade-in"
            style={{ top: dropdownRect.top, right: dropdownRect.right }}
          >
            {results.length === 0 ? (
              <p className="px-4 py-6 text-sm text-muted-foreground text-center">No results for "{query}"</p>
            ) : (
              results.map((result, i) => {
                const Icon = typeIcon[result.type];
                return (
                  <button
                    key={`${result.path}-${i}`}
                    type="button"
                    onClick={() => handleSelect(result)}
                    className="flex w-full items-start gap-3 px-4 py-3 text-left hover:bg-muted/50 transition-colors border-b border-border last:border-b-0"
                  >
                    <Icon className="h-4 w-4 mt-0.5 text-muted-foreground shrink-0" />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate">{result.title}</p>
                      {result.subtitle && (
                        <p className="text-xs text-muted-foreground truncate">{result.subtitle}</p>
                      )}
                      <p className="text-[10px] uppercase tracking-wide text-muted-foreground/70 mt-0.5">{result.type}</p>
                    </div>
                  </button>
                );
              })
            )}
          </div>,
          document.body
        )}
    </div>
  );
};
