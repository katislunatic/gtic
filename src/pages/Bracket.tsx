import { useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Footer } from "@/components/Footer";
import bracketAsset from "@/assets/gtec-season-4-bracket.png.asset.json";

export const Bracket = () => {
  const [open, setOpen] = useState(false);

  return (
    <div className="min-h-screen pt-20 pb-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            <span className="hero-text">Season 4 Bracket</span>
          </h1>
          <p className="text-muted-foreground">Click the bracket to view fullscreen</p>
        </div>

        <button
          onClick={() => setOpen(true)}
          className="block w-full rounded-lg overflow-hidden border border-border hover:opacity-90 transition-opacity"
        >
          <img
            src={bracketAsset.url}
            alt="GTEC Season 4 Tournament Bracket"
            className="w-full h-auto"
          />
        </button>

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-[95vw] w-[95vw] p-2 sm:p-4">
            <img
              src={bracketAsset.url}
              alt="GTEC Season 4 Tournament Bracket"
              className="w-full h-auto"
            />
          </DialogContent>
        </Dialog>
      </div>
      <Footer />
    </div>
  );
};