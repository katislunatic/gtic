import { useState, type ReactNode } from "react";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

interface ImageLightboxProps {
  /** Full-size image shown when clicked. */
  src: string;
  alt: string;
  /** The small thumbnail (usually an <img>) that gets clicked. */
  children: ReactNode;
  /** Classes for the clickable wrapper around the thumbnail. */
  className?: string;
  /** Extra classes for the enlarged image (e.g. "rounded-full" for avatars). */
  imgClassName?: string;
}

// Click a small image to see it bigger. The enlarged view deliberately has
// NO background of its own (transparent dialog, no border/shadow, nothing
// behind the <img>), so a transparent PNG stays transparent and only the
// dimmed page shows through. Click anywhere outside or press Esc to close.
export const ImageLightbox = ({ src, alt, children, className, imgClassName }: ImageLightboxProps) => {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className={cn("cursor-zoom-in", className)}
        aria-label={`Enlarge ${alt}`}
      >
        {children}
      </button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="w-auto max-w-[90vw] border-none bg-transparent p-0 shadow-none sm:rounded-none [&>button]:hidden">
          <DialogTitle className="sr-only">{alt}</DialogTitle>
          <DialogDescription className="sr-only">Enlarged image</DialogDescription>
          <img
            src={src}
            alt={alt}
            className={cn("mx-auto h-auto max-h-[85vh] w-[min(90vw,32rem)] object-contain", imgClassName)}
          />
        </DialogContent>
      </Dialog>
    </>
  );
};
