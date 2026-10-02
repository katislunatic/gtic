import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Footer } from "@/components/Footer";
import { ArrowLeft, Loader2 } from "lucide-react";
import { createTeam } from "@/lib/gtecApi";
import { useDiscordAuth } from "@/hooks/use-discord-auth";
import { useToast } from "@/hooks/use-toast";

export const CreateTeam = () => {
  const { profile, loading: authLoading, login } = useDiscordAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [tag, setTag] = useState("");
  const [name, setName] = useState("");
  const [color, setColor] = useState("");
  const [logoUrl, setLogoUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSubmitting(true);
    try {
      const team = await createTeam({
        tag: tag.trim(),
        name: name.trim(),
        color: color.trim(),
        logoUrl: logoUrl.trim() || undefined,
      });
      toast({ title: `${team.fullName} created!` });
      navigate(`/teams/${team.id}`);
    } catch (err) {
      setError((err as Error).message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen pt-28 md:pt-36 pb-16">
      <div className="container mx-auto px-4 max-w-lg">
        <Link to="/teams" className="text-sm text-muted-foreground hover:text-foreground inline-flex items-center mb-8">
          <ArrowLeft className="h-4 w-4 mr-1" /> All teams
        </Link>

        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-bold mb-3">
            <span className="hero-text">Create a Team</span>
          </h1>
          <p className="text-muted-foreground text-sm">
            Starts as unofficial — register later when you're ready to compete in the season.
          </p>
        </div>

        {authLoading ? (
          <Card className="team-card">
            <CardContent className="p-8 flex justify-center">
              <Loader2 className="h-5 w-5 animate-spin text-muted-foreground" />
            </CardContent>
          </Card>
        ) : !profile ? (
          <Card className="team-card">
            <CardContent className="p-8 text-center space-y-4">
              <p className="text-muted-foreground">You need to log in with Discord to create a team.</p>
              <Button onClick={() => login()}>Log in with Discord</Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="team-card">
            <CardContent className="p-6 md:p-8">
              <form onSubmit={handleSubmit} className="space-y-5">
                <div className="grid grid-cols-3 gap-3">
                  <div className="col-span-1 space-y-1.5">
                    <Label htmlFor="tag">Tag</Label>
                    <Input
                      id="tag"
                      value={tag}
                      onChange={(e) => setTag(e.target.value)}
                      placeholder="TTT"
                      maxLength={6}
                      required
                    />
                  </div>
                  <div className="col-span-2 space-y-1.5">
                    <Label htmlFor="name">Team Name</Label>
                    <Input
                      id="name"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      placeholder="The Tree Trotters"
                      maxLength={50}
                      required
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="color">Color</Label>
                  <Input
                    id="color"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    placeholder="#FF0000 or a code like 407"
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Hex code (#FF0000) or a 3-digit code (e.g. 407).
                  </p>
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="logo">Logo Link (optional)</Label>
                  <Input
                    id="logo"
                    value={logoUrl}
                    onChange={(e) => setLogoUrl(e.target.value)}
                    placeholder="https://... (a Discord media link works)"
                  />
                </div>

                {error && (
                  <p className="text-sm text-destructive bg-destructive/10 rounded-lg p-3">{error}</p>
                )}

                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting && <Loader2 className="h-4 w-4 mr-2 animate-spin" />}
                  Create Team
                </Button>
              </form>
            </CardContent>
          </Card>
        )}
      </div>
      <Footer />
    </div>
  );
};
