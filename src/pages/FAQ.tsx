import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Footer } from "@/components/Footer";

interface FAQProps {
  isAdmin: boolean;
}

const faqData = [
  {
    question: "What is GTEC?",
    answer: "GTEC stands for Gorilla Tag Elite COMP. It's a competitive Gorilla Tag league that focuses on the game's unique movement system and unites players of all skill levels."
  },
  {
    question: "How do I register my team?",
    answer: "To register your team, join our Discord server at discord.gg/hB4V4ywqxj and follow the registration instructions in the appropriate channels."
  },
  {
    question: "What are the team requirements?",
    answer: "Teams must have a designated captain and follow the official GTEC rules and guidelines. Specific requirements are detailed in our Discord server."
  },
  {
    question: "When do tournaments take place?",
    answer: "Tournament schedules are announced in our Discord server and on our social media channels. Make sure to follow our YouTube, TikTok, and Twitch for updates."
  },
  {
    question: "How do I use the Color Code Selector?",
    answer: "The Color Code Selector is a built-in tool on this website that helps you test and pick your in-game colors. Simply navigate to the Color Code Selector page and experiment with different color combinations."
  },
  {
    question: "Can I watch matches if I'm not competing?",
    answer: "Absolutely! You can watch matches on our Twitch channel at twitch.tv/gticleague and catch highlights on our YouTube channel."
  },
  {
    question: "Are there any age restrictions for joining?",
    answer: "Yes, participants must be 13+ years old to comply with Discord's Terms of Service. You can review Discord's terms at https://discord.com/terms."
  },
  {
    question: "Can I change teams after signing up?",
    answer: "Yes, you can change teams after signing up. Please contact the moderation team in our Discord server for assistance with team transfers."
  },
  {
    question: "How can I stay updated with GTEC news?",
    answer: "Follow us on all our social platforms: Discord (discord.gg/hB4V4ywqxj), YouTube (@gticleague), TikTok (@gtic_league), and Twitch (gticleague). This website also features the latest announcements."
  },
  {
    question: "Who can I contact for support?",
    answer: "For any questions or support, join our Discord server and reach out to the moderation team. They'll be happy to help with any issues or questions you may have."
  }
];

export const FAQ = ({ isAdmin }: FAQProps) => {
  return (
    <div className="min-h-screen pt-20 pb-8">
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            <span className="hero-text">Frequently Asked Questions</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Find answers to common questions about GTEC, tournaments, registration, and more.
          </p>
        </div>

        <Card className="team-card max-w-4xl mx-auto">
          <CardHeader>
            <CardTitle className="text-center">Got Questions? We've Got Answers!</CardTitle>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="space-y-2">
              {faqData.map((faq, index) => (
                <AccordionItem key={index} value={`item-${index}`} className="border border-border rounded-lg">
                  <AccordionTrigger className="text-left px-4 py-3 hover:no-underline hover:bg-muted/20 transition-colors">
                    {faq.question}
                  </AccordionTrigger>
                  <AccordionContent className="px-4 pb-3 text-muted-foreground">
                    {faq.answer}
                  </AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </CardContent>
        </Card>

        <div className="text-center mt-12">
          <Card className="team-card max-w-2xl mx-auto">
            <CardContent className="p-6">
              <h3 className="text-xl font-semibold mb-3">Still Have Questions?</h3>
              <p className="text-muted-foreground mb-4">
                Can't find what you're looking for? Join our Discord community for real-time support and discussions.
              </p>
              <a
                href="https://discord.gg/hB4V4ywqxj"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block bg-primary text-primary-foreground px-6 py-2 rounded-lg hover:bg-primary/90 transition-colors"
              >
                Join Our Discord
              </a>
            </CardContent>
          </Card>
        </div>
      </div>
      <Footer />
    </div>
  );
};