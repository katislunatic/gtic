import { useEffect, useState } from "react";
import { WifiOff } from "lucide-react";
import { SnakeGame } from "@/components/SnakeGame";
import gticLogo from "@/assets/gtic-logo.png";

/**
 * Full-screen takeover shown whenever the browser reports no network
 * connection \u2014 similar to Chrome's offline dino page. Blocks the rest of
 * the site (since it depends on live Supabase data) and offers a quick
 * game of Tetris to pass the time until the connection returns.
 */
export function OfflineGate() {
  const [online, setOnline] = useState(
    typeof navigator === "undefined" ? true : navigator.onLine
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
    <div className="fixed inset-0 z-[300] flex flex-col items-center justify-center gap-6 overflow-y-auto bg-background px-4 py-10">
      <img src={gticLogo} alt="Gorilla Tag Elite COMP" className="h-12 w-12 opacity-80" />

      <div className="text-center">
        <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/15 text-destructive">
          <WifiOff className="h-6 w-6" />
        </div>
        <h1 className="text-xl font-bold mb-1">No internet connection</h1>
        <p className="text-sm text-muted-foreground">
          We'll bring the site back automatically once you're reconnected. In the meantime, enjoy a game of Snake.
        </p>
      </div>

      <SnakeGame />
    </div>
  );
}
