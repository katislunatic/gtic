import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Footer } from "@/components/Footer";
import { ExternalLink } from "lucide-react";

interface AppealProps {
  isAdmin: boolean;
}

export const Appeal = ({ isAdmin }: AppealProps) => {
  return (
    <div className="min-h-screen pt-20 pb-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="hero-text">Appeal a Decision</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            If you believe a decision was made in error, you can submit an appeal for review.
          </p>
        </div>

        <Card className="team-card max-w-2xl mx-auto">
          <CardContent className="p-8 text-center space-y-6">
            <h2 className="text-2xl font-semibold">Submit Your Appeal</h2>
            <p className="text-muted-foreground">
              Click the button below to go to the appeals portal where you can fill out and submit your appeal.
            </p>
            <a
              href="https://gtec-appeal.netlify.app/"
              target="_blank"
              rel="noopener noreferrer"
            >
              <Button size="lg" className="gap-2">
                Go to Appeal Portal
                <ExternalLink className="h-4 w-4" />
              </Button>
            </a>
          </CardContent>
        </Card>
      </div>
      <Footer />
    </div>
  );
};
