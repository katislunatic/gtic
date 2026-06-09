import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";

export function OfflineNotice() {
  const [online, setOnline] = useState(
    typeof navigator === "undefined" ? true : navigator.onLine,
  );

  useEffect(() => {
    const goOnline = () => setOnline(true);
    const goOffline = () => setOnline(false);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  if (online) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed bottom-4 left-1/2 z-[100] -translate-x-1/2 px-4 w-full max-w-md"
    >
      <div className="flex items-start gap-3 rounded-lg border border-destructive/40 bg-card/95 backdrop-blur p-4 shadow-lg">
        <div className="rounded-full bg-destructive/15 p-2 text-destructive">
          <WifiOff className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="font-semibold text-foreground">You're offline</p>
          <p className="text-sm text-muted-foreground">
            Connection lost. You can keep browsing cached pages — we'll reconnect automatically.
          </p>
        </div>
      </div>
    </div>
  );
}