import { useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload } from "lucide-react";
import { Footer } from "@/components/Footer";
import { supabase } from "@/integrations/supabase/client";
import { useSiteSettings } from "@/hooks/use-site-settings";
import { useToast } from "@/hooks/use-toast";
import bracketAsset from "@/assets/gtec-season-4-bracket-r2b.png";

interface BracketProps {
  isAdmin?: boolean;
}

// Caches path -> resolved signed URL across visits, so a returning viewer
// sees the bracket immediately while a fresh URL quietly loads behind it,
// instead of waiting on a Supabase round trip every single time.
const IMAGE_CACHE_KEY = "gtec-bracket-image-cache";

const readImageCache = (): Record<string, string> => {
  try {
    return JSON.parse(window.localStorage.getItem(IMAGE_CACHE_KEY) || "{}");
  } catch {
    return {};
  }
};

const writeImageCache = (path: string, url: string) => {
  try {
    const cache = readImageCache();
    cache[path] = url;
    window.localStorage.setItem(IMAGE_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Ignore storage errors — caching is a nice-to-have.
  }
};

// Preloads a URL and resolves only once the image has fully downloaded, so
// swapping it in never shows a partially-painted image.
const preload = (url: string) =>
  new Promise<void>((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve();
    img.onerror = reject;
    img.src = url;
  });

export const Bracket = ({ isAdmin = false }: BracketProps) => {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>(bracketAsset);
  // Tracks whether imageUrl actually reflects settings.bracket_path yet.
  // Resolving a custom upload's signed URL is a second async step after
  // settings load, so without this the default image still flashes before
  // swapping to the custom one.
  const [imageReady, setImageReady] = useState(false);
  const { settings, loading, saveSettings } = useSiteSettings();
  const { toast } = useToast();

  // Always derives from the Season stat — no separate manual override, so
  // there's no stale saved title that can drift out of sync with the season.
  const title = `Season ${settings.season || "4"} Bracket`;

  useEffect(() => {
    let cancelled = false;
    const path = settings.bracket_path;
    if (!path) {
      setImageUrl(bracketAsset);
      setImageReady(true);
      return;
    }

    const cached = readImageCache()[path];
    if (cached) {
      // Show the last-known image right away; still refresh quietly below in
      // case the signed URL rotated or the file changed.
      setImageUrl(cached);
      setImageReady(true);
    } else {
      setImageReady(false);
    }

    supabase.storage
      .from("site-assets")
      .createSignedUrl(path, 60 * 60 * 24 * 365)
      .then(async ({ data }) => {
        if (cancelled || !data?.signedUrl) return;
        try {
          await preload(data.signedUrl);
        } catch {
          return;
        }
        if (cancelled) return;
        setImageUrl(data.signedUrl);
        setImageReady(true);
        writeImageCache(path, data.signedUrl);
      });
    return () => {
      cancelled = true;
    };
  }, [settings.bracket_path]);

  const handleUpload = async (file: File) => {
    setUploading(true);
    const path = `brackets/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, "_")}`;
    const { error } = await supabase.storage.from("site-assets").upload(path, file, { upsert: true });
    if (error) {
      setUploading(false);
      toast({ title: "Error", description: "Upload failed: " + error.message, variant: "destructive" });
      return;
    }
    const saveError = await saveSettings({ bracket_path: path });
    setUploading(false);
    if (saveError) {
      toast({ title: "Error", description: "Could not save bracket", variant: "destructive" });
      return;
    }
    toast({ title: "Success", description: "Bracket updated" });
  };

  return (
    <div className="min-h-screen pt-20 pb-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-8">
          <h1 className="text-4xl md:text-6xl font-bold mb-4">
            <span className="hero-text">{title}</span>
          </h1>
          <p className="text-muted-foreground">Click the bracket to view fullscreen</p>
        </div>

        {isAdmin && (
          <Card className="admin-panel mb-8">
            <CardHeader>
              <CardTitle className="flex items-center">
                <Upload className="mr-2 h-5 w-5" />
                Manage Bracket
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <label className="text-sm text-muted-foreground">Upload new bracket image</label>
                <input
                  type="file"
                  accept="image/*"
                  disabled={uploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleUpload(file);
                  }}
                  className="w-full p-3 rounded-lg bg-input border border-border text-foreground"
                />
              </div>
              {settings.bracket_path && (
                <Button variant="outline" onClick={() => saveSettings({ bracket_path: "" })}>
                  Reset to default bracket
                </Button>
              )}
              {uploading && <p className="text-sm text-muted-foreground">Uploading…</p>}
            </CardContent>
          </Card>
        )}

        {loading || !imageReady ? (
          <div className="flex items-center justify-center w-full min-h-[300px] rounded-lg border border-border bg-muted/30 text-muted-foreground">
            Loading bracket…
          </div>
        ) : (
          <button
            onClick={() => setOpen(true)}
            className="block w-full rounded-lg overflow-hidden border border-border hover:opacity-90 transition-opacity"
          >
            <img src={imageUrl} alt={`GTEC ${title}`} className="w-full h-auto" />
          </button>
        )}

        <Dialog open={open} onOpenChange={setOpen}>
          <DialogContent className="max-w-[95vw] w-[95vw] p-2 sm:p-4">
            <img src={imageUrl} alt={`GTEC ${title}`} className="w-full h-auto" />
          </DialogContent>
        </Dialog>
      </div>
      <Footer />
    </div>
  );
};
