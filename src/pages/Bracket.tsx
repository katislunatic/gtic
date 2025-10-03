import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { Footer } from "@/components/Footer";
import bracketImage from "@/assets/season-3-bracket.png";

interface BracketProps {
  isAdmin: boolean;
}

export const Bracket = ({ isAdmin }: BracketProps) => {
  return (
    <div className="min-h-screen pt-20 pb-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="hero-text">Tournament Bracket</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Follow the current GTIC Season 3 tournament bracket and see which teams advance through each round.
          </p>
        </div>

        <Card className="card-gradient max-w-7xl mx-auto border">
          <CardHeader>
            <CardTitle className="text-center">GTIC Season 3 Bracket</CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <Dialog>
              <DialogTrigger asChild>
                <div className="flex justify-center cursor-pointer group">
                  <img 
                    src={bracketImage} 
                    alt="GTIC Season 3 Tournament Bracket" 
                    className="w-full max-w-6xl h-auto rounded-lg shadow-lg transition-transform group-hover:scale-[1.02]"
                  />
                </div>
              </DialogTrigger>
              <DialogContent className="max-w-[98vw] max-h-[98vh] w-auto h-auto p-2 border-0 bg-transparent">
                <img 
                  src={bracketImage} 
                  alt="GTIC Season 3 Tournament Bracket - Full View" 
                  className="w-full h-auto max-h-[96vh] object-contain rounded-lg"
                />
              </DialogContent>
            </Dialog>
            <div className="mt-6 text-center">
              <p className="text-muted-foreground">
                32 teams competing in single elimination format. Stay tuned for live updates as the tournament progresses!
              </p>
            </div>
          </CardContent>
        </Card>

        <div className="text-center mt-12">
          <Card className="team-card max-w-2xl mx-auto">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-3">Watch Live Matches</h3>
              <p className="text-muted-foreground mb-4">
                Catch all the tournament action live on our Twitch channel and get highlights on YouTube.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <a
                  href="https://twitch.tv/gticleague"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors"
                >
                  Watch on Twitch
                </a>
                <a
                  href="https://youtube.com/@gticleague"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block bg-secondary text-secondary-foreground px-6 py-2 rounded-lg hover:bg-secondary/90 transition-colors"
                >
                  YouTube Highlights
                </a>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
};