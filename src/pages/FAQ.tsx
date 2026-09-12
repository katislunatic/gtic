import { useEffect, useRef, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Footer } from "@/components/Footer";
import { faqData } from "@/data/faqData";

interface FAQProps {
  isAdmin: boolean;
}

export const FAQ = ({ isAdmin }: FAQProps) => {
  const [searchParams] = useSearchParams();
  const [openItem, setOpenItem] = useState<string | undefined>(undefined);
  const [highlightedItem, setHighlightedItem] = useState<string | null>(null);
  const itemRefs = useRef<Record<string, HTMLDivElement | null>>({});

  // Coming from global search with e.g. /faq?open=3 auto-opens that question,
  // scrolls it into view, and briefly highlights it so it's obvious which
  // one matched — the highlight fades out after a couple seconds.
  useEffect(() => {
    const openParam = searchParams.get("open");
    if (openParam === null) return;
    const value = `item-${openParam}`;
    setOpenItem(value);
    setHighlightedItem(value);
    requestAnimationFrame(() => {
      itemRefs.current[value]?.scrollIntoView({ behavior: "smooth", block: "center" });
    });
    const timer = setTimeout(() => setHighlightedItem(null), 2200);
    return () => clearTimeout(timer);
  }, [searchParams]);
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
            <Accordion type="single" collapsible className="space-y-2" value={openItem} onValueChange={setOpenItem}>
              {faqData.map((faq, index) => (
                <AccordionItem
                  key={index}
                  value={`item-${index}`}
                  ref={(el) => (itemRefs.current[`item-${index}`] = el)}
                  className={`border rounded-lg transition-colors duration-500 ${
                    highlightedItem === `item-${index}`
                      ? "border-primary ring-2 ring-primary/50 bg-primary/5"
                      : "border-border"
                  }`}
                >
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
                href="https://discord.gg/gtecleague"
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