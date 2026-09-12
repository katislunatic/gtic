import { useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { LoadingDots } from "@/components/LoadingDots";
import { Button } from "@/components/ui/button";

// Lands here after Discord sends the visitor back. Trades the OAuth code for
// a real app session (the edge function decides whether that account is an
// admin), then drops them back on the homepage.
const DiscordCallback = () => {
  const navigate = useNavigate();
  const [error, setError] = useState<string | null>(null);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;

    const run = async () => {
      const code = new URLSearchParams(window.location.search).get("code");
      if (!code) {
        setError("No login code returned from Discord.");
        return;
      }
      const { data, error: fnError } = await supabase.functions.invoke("discord-auth", {
        body: { action: "exchange", code, redirect_uri: `${window.location.origin}/discord-callback` },
      });
      const payload = data as { token_hash?: string; error?: string } | null;
      if (fnError || !payload?.token_hash) {
        setError(payload?.error ?? fnError?.message ?? "Discord login failed.");
        return;
      }
      const { error: otpError } = await supabase.auth.verifyOtp({
        type: "email",
        token_hash: payload.token_hash,
      });
      if (otpError) {
        setError(otpError.message);
        return;
      }
      navigate("/", { replace: true });
    };

    void run();
  }, [navigate]);

  return (
    <div className="flex min-h-[70vh] flex-col items-center justify-center gap-4 px-6 text-center">
      {error ? (
        <>
          <h1 className="text-xl font-semibold">Discord login failed</h1>
          <p className="max-w-md text-sm text-muted-foreground">{error}</p>
          <Button onClick={() => navigate("/", { replace: true })}>Back to site</Button>
        </>
      ) : (
        <>
          <LoadingDots />
          <p className="text-sm text-muted-foreground">Signing you in with Discord…</p>
        </>
      )}
    </div>
  );
};

export default DiscordCallback;
