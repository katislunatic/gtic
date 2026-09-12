import { Vote, ExternalLink } from "lucide-react";

// Home-page banner advertising the voting page — same shape/position as the
// existing shop banner, gold/gradient styled so it reads as its own feature.
export const VotingBanner = () => (
  <a href="/voting" className="block mb-8 animate-fade-in">
    <div
      className="relative overflow-hidden rounded-xl border p-5 md:p-6 transition-colors hover:opacity-95"
      style={{
        borderColor: "hsl(42 92% 55% / 0.3)",
        background: "linear-gradient(90deg, hsl(42 92% 55% / 0.12), hsl(32 95% 50% / 0.05), transparent)",
      }}
    >
      <div
        className="absolute top-0 right-0 -mt-4 -mr-4 w-24 h-24 rounded-full blur-2xl"
        style={{ background: "hsl(42 92% 55% / 0.25)" }}
      />
      <div className="relative flex items-center gap-4">
        <div className="flex-shrink-0 rounded-full p-3 animate-glow" style={{ background: "hsl(42 92% 55% / 0.18)" }}>
          <Vote className="h-6 w-6" style={{ color: "hsl(42 92% 55%)" }} />
        </div>
        <div className="flex-1">
          <p
            className="text-sm font-semibold uppercase tracking-wider mb-0.5 bg-clip-text text-transparent inline-block"
            style={{ backgroundImage: "linear-gradient(135deg, hsl(48 95% 60%), hsl(32 95% 50%))" }}
          >
            Voting is live
          </p>
          <h2 className="text-lg md:text-xl font-bold">Cast your vote now</h2>
        </div>
        <ExternalLink className="h-5 w-5 flex-shrink-0 hidden md:block" style={{ color: "hsl(42 92% 55%)" }} />
      </div>
    </div>
  </a>
);
