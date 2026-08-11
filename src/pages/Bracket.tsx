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

export const Bracket = ({ isAdmin = false }: BracketProps) => {
  const [open, setOpen] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string>(bracketAsset);
  const { settings, saveSettings } = useSiteSettings();
  const { toast } = useToast();

  const title = settings.bracket_title || "Season 4 Bracket";

  useEffect(() => {
    let cancelled = false;
    const path = settings.bracket_path;
    if (!path) {
      setImageUrl(bracketAsset);
      return;
    }
    supabase.storage
      .from("site-assets")
      .createSignedUrl(path, 60 * 60 * 24 * 365)
      .then(({ data }) => {
        if (!cancelled && data?.signedUrl) setImageUrl(data.signedUrl);
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
                <label className="text-sm text-muted-foreground">Bracket title</label>
                <input
                  type="text"
                  defaultValue={title}
                  onBlur={(e) => {
                    if (e.target.value && e.target.value !== title) {
                      saveSettings({ bracket_title: e.target.value });
                    }
                  }}
                  className="w-full p-3 rounded-lg bg-input border border-border text-foreground"
                />
              </div>
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

        <button
          onClick={() => setOpen(true)}
          className="block w-full rounded-lg overflow-hidden border border-border hover:opacity-90 transition-opacity"
        >
          <img src={imageUrl} alt={`GTEC ${title}`} className="w-full h-auto" />
        </button>

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
