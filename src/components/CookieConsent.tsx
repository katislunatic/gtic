import { useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";

export const CookieConsent = () => {
  const [isVisible, setIsVisible] = useState(true);

  const handleAccept = () => {
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 max-w-sm animate-in slide-in-from-bottom-5">
      <Card className="p-4 shadow-lg border-border bg-card">
        <p className="text-sm text-card-foreground mb-4">
          By using our website you agree to our{" "}
          <Link to="/policy/privacy" className="text-primary hover:underline">
            Privacy Policy
          </Link>{" "}
          and{" "}
          <Link to="/policy/cookie" className="text-primary hover:underline">
            Cookie Policy
          </Link>
          .
        </p>
        <Button onClick={handleAccept} className="w-full">
          Understood
        </Button>
      </Card>
    </div>
  );
};
