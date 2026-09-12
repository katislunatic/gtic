import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Vote, X, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useHasUnvotedActiveCampaign } from "@/hooks/use-voting";

// Shown once per page load whenever there's an active campaign the current
// visitor hasn't fully voted in yet — golden/gradient styling to match the
// "Voting" nav tab so it reads as the same feature everywhere on the site.
export const VotingPopup = () => {
  const { hasUnvoted, checked, campaigns } = useHasUnvotedActiveCampaign();
  const [dismissed, setDismissed] = useState(false);
  const [visible, setVisible] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    if (checked && hasUnvoted && !dismissed) {
      // Small delay so it doesn't compete with the page's own entrance
      // animation — arrives a beat after the page settles.
      const t = setTimeout(() => setVisible(true), 700);
      return () => clearTimeout(t);
    }
  }, [checked, hasUnvoted, dismissed]);

  if (!visible) return null;

  const activeCampaign = campaigns.find((c) => c.status === "active");

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div
        className="relative w-full max-w-sm rounded-2xl border-2 p-6 text-center overflow-hidden animate-bounce-in"
        style={{
          borderImage: "linear-gradient(135deg, hsl(45 90% 55%), hsl(35 95% 50%)) 1",
          background: "radial-gradient(circle at 50% -10%, hsl(45 90% 55% / 0.18), transparent 60%), hsl(var(--background))",
        }}
      >
        <button
          onClick={() => setDismissed(true)}
          aria-label="Close"
          className="absolute top-3 right-3 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full animate-glow" style={{ background: "linear-gradient(135deg, hsl(45 90% 55% / 0.25), hsl(35 95% 50% / 0.25))" }}>
          <Vote className="h-7 w-7" style={{ color: "hsl(42 92% 55%)" }} />
        </div>

        <h2
          className="text-2xl font-bold mb-2 bg-clip-text text-transparent inline-flex items-center gap-1.5"
          style={{ backgroundImage: "linear-gradient(135deg, hsl(48 95% 60%), hsl(32 95% 50%))" }}
        >
          <Sparkles className="h-5 w-5" style={{ color: "hsl(42 92% 55%)" }} />
          Voting is open!
        </h2>
        <p className="text-sm text-muted-foreground mb-5">
          {activeCampaign ? `"${activeCampaign.title}" is live — go cast your vote.` : "There's an open vote waiting for you."}
        </p>

        <div className="flex gap-2">
          <Button variant="outline" className="flex-1" onClick={() => setDismissed(true)}>
            Later
          </Button>
          <Button
            className="flex-1 text-black hover:opacity-90"
            style={{ background: "linear-gradient(135deg, hsl(48 95% 60%), hsl(32 95% 50%))" }}
            onClick={() => {
              setDismissed(true);
              navigate("/voting");
            }}
          >
            Vote now
          </Button>
        </div>
      </div>
    </div>
  );
};
