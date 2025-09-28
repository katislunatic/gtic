import { Card, CardContent } from "@/components/ui/card";
import { Footer } from "@/components/Footer";

interface OfficialTeamsProps {
  isAdmin: boolean;
}

const teams = [
  { code: "SG", name: "Silly Goobers", returning: true },
  { code: "SOB", name: "Standing On Business", returning: false },
  { code: "VELO", name: "VELOCITY", returning: false },
  { code: "FZE", name: "Faze", returning: false },
  { code: "QHQ", name: "Quest Headquarters", returning: false },
  { code: "MFA", name: "The Mafia", returning: false },
  { code: "SSM", name: "Super Suspicious Monkeys", returning: true },
  { code: "KP", name: "Krabby Patty", returning: false },
  { code: "V4L", name: "Virgins4Life", returning: false },
  { code: "TDB", name: "The Dusty B3rries", returning: false },
  { code: "KW", name: "Kitty Warriors", returning: false },
  { code: "VD", name: "Vivid Dream", returning: false },
  { code: "DNA", name: "Dark Night", returning: false },
  { code: "CNDY", name: "Candy", returning: false },
  { code: "MB", name: "Moonlight Blazers", returning: false },
  { code: "HC", name: "Hard Carry", returning: false },
  { code: "MNTY", name: "Mentality", returning: false },
  { code: "TSM", name: "The Sexy Monkeys", returning: false },
  { code: "GLTY", name: "Glitchy", returning: false },
  { code: "PRX", name: "Paper Rex", returning: true },
  { code: "TTC", name: "The Time Cappers", returning: false },
  { code: "TLM", name: "The Lazy Monkeys", returning: false },
  { code: "S3XY", name: "S3XY", returning: false },
  { code: "VLK", name: "Valkyrie", returning: false },
  { code: "AWT", name: "Apex Wild Titans", returning: false },
  { code: "SV", name: "Sugar Virus", returning: false },
  { code: "TFR", name: "The Forest Runners", returning: false },
  { code: "CDD", name: "Cod Doodle Destroyers", returning: false },
  { code: "ITZ", name: "In The Zone", returning: false },
  { code: "SVL", name: "SALVATION", returning: false },
  { code: "TAM", name: "The Astro Monks", returning: false },
  { code: "GL", name: "Goblins Lagoon", returning: false },
];

export const OfficialTeams = ({ isAdmin }: OfficialTeamsProps) => {
  return (
    <div className="min-h-screen pt-20 pb-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="hero-text">Official Teams</span>
          </h1>
        </div>

        {/* Emoji Key */}
        <Card className="team-card mb-8">
          <CardContent className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-center">Key</h2>
            <div className="flex items-center justify-center space-x-2 text-sm">
              <span className="text-lg">🔄</span>
              <span className="font-medium">= Returning Team</span>
              <span className="text-muted-foreground">— Teams returning from last season competing again this season.</span>
            </div>
          </CardContent>
        </Card>

        <Card className="team-card">
          <CardContent className="p-8">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {teams.map((team, index) => (
                <div 
                  key={team.code} 
                  className="flex items-center space-x-3 p-3 rounded-lg bg-muted/20 hover:bg-muted/30 transition-colors animate-fade-in"
                  style={{animationDelay: `${index * 50}ms`}}
                >
                  <span className="font-bold text-primary min-w-fit">{team.code}</span>
                  <span className="text-muted-foreground">|</span>
                  <span className="flex-1">{team.name}</span>
                  {team.returning && <span className="text-lg">🔄</span>}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};