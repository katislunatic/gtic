import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { ExternalLink, Play } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface YouTubeLiveStatus {
  live: boolean;
  videoId: string | null;
  title: string | null;
  thumbnail: string | null;
}

const YOUTUBE_CHANNEL_URL = "https://www.youtube.com/@GTECLeague";

export const LiveStreamBanner = () => {
  const [open, setOpen] = useState(false);

  const { data } = useQuery<YouTubeLiveStatus>({
    queryKey: ["youtube-live-status"],
    queryFn: async () => {
      const { data, error } = await supabase.functions.invoke("youtube-live-status");
      if (error) throw error;
      return data as YouTubeLiveStatus;
    },
    refetchInterval: 60_000,
    staleTime: 60_000,
  });

  // Close the watch-along modal automatically if the stream ends while open.
  useEffect(() => {
    if (!data?.live && open) setOpen(false);
  }, [data?.live, open]);

  if (!data?.live || !data.videoId) return null;

  const watchUrl = `https://www.youtube.com/watch?v=${data.videoId}`;

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="block w-full mb-12 animate-fade-in text-left"
      >
        <div className="group relative overflow-hidden rounded-xl border border-red-500/30 bg-gradient-to-r from-red-500/10 via-red-500/5 to-transparent p-4 md:p-6 transition-colors hover:border-red-500/50">
          <div className="relative flex flex-col sm:flex-row items-center gap-4 md:gap-6">
            <div className="relative flex-shrink-0 w-full sm:w-56 aspect-video rounded-lg overflow-hidden bg-muted">
              {data.thumbnail && (
                <img
                  src={data.thumbnail}
                  alt={data.title ?? "Live stream thumbnail"}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              )}
              <div className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 group-hover:opacity-100 transition-opacity">
                <Play className="h-10 w-10 text-white drop-shadow" fill="white" />
              </div>
              <span className="absolute top-2 left-2 flex items-center gap-1.5 rounded-full bg-red-600 px-2.5 py-1 text-xs font-bold text-white">
                <span className="h-2 w-2 rounded-full bg-white animate-pulse" />
                LIVE
              </span>
            </div>
            <div className="flex-1 text-center sm:text-left min-w-0">
              <p className="text-sm font-semibold text-red-500 uppercase tracking-wider mb-1">We're live on YouTube</p>
              <h2 className="text-lg md:text-xl font-bold mb-1 truncate">
                {data.title ?? "GTEC League is live now"}
              </h2>
              <p className="text-sm text-muted-foreground">Click to watch here, or open on YouTube.</p>
            </div>
            <ExternalLink className="h-5 w-5 text-red-500 flex-shrink-0 hidden md:block" />
          </div>
        </div>
      </button>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-w-4xl p-0 overflow-hidden bg-black border-red-500/30">
          <DialogTitle className="sr-only">{data.title ?? "Live stream"}</DialogTitle>
          <div className="aspect-video w-full">
            <iframe
              src={`https://www.youtube.com/embed/${data.videoId}?autoplay=1`}
              title={data.title ?? "GTEC League live stream"}
              className="h-full w-full"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
          <div className="flex items-center justify-between p-4 bg-background">
            <p className="font-medium truncate pr-4">{data.title ?? "GTEC League is live now"}</p>
            <a
              href={watchUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-shrink-0 flex items-center gap-1.5 text-sm text-primary hover:underline"
            >
              Open on YouTube <ExternalLink className="h-3.5 w-3.5" />
            </a>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};
