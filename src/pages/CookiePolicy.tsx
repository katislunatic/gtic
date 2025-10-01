import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const CookiePolicy = () => {
  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      <Card className="card-gradient border">
        <CardHeader>
          <CardTitle className="text-3xl">Cookie Policy</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none space-y-4 text-card-foreground">
          <p>
            Our website uses cookies to provide a better experience. Cookies are small files stored on your device that help us remember your preferences and understand how the site is used.
          </p>
          
          <ul className="list-disc pl-6 space-y-2">
            <li><strong>Essential cookies:</strong> Required for the website to function.</li>
            <li><strong>Analytics cookies:</strong> Help us understand how visitors use our site.</li>
            <li><strong>Preference cookies:</strong> Remember your settings and preferences.</li>
          </ul>

          <p>
            You can disable cookies in your browser settings, but some features of the site may not work properly.
          </p>

          <p>
            By continuing to use our website, you agree to this Cookie Policy.
          </p>
        </CardContent>
      </Card>
    </main>
  );
};
