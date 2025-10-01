import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const PrivacyPolicy = () => {
  return (
    <main className="container mx-auto px-4 py-8 max-w-4xl">
      <Card className="card-gradient border">
        <CardHeader>
          <CardTitle className="text-3xl">Privacy Policy</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none space-y-4 text-card-foreground">
          <p>
            We value your privacy. When you use our website, we may collect basic information such as how you use the site. This information is used only to improve your experience and keep the website running smoothly.
          </p>
          
          <ul className="list-disc pl-6 space-y-2">
            <li>We do not sell or share your data with outside parties.</li>
            <li>We only use your information to provide services, improve performance, and ensure security.</li>
          </ul>

          <p>
            By continuing to use our website, you agree to this Privacy Policy.
          </p>
        </CardContent>
      </Card>
    </main>
  );
};
