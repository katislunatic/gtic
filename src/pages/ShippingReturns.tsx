import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export const ShippingReturns = () => {
  return (
    <main className="container mx-auto px-4 pt-28 pb-8 max-w-4xl">
      <Card className="glass-panel">
        <CardHeader>
          <CardTitle className="text-3xl text-center">Shipping &amp; Returns</CardTitle>
        </CardHeader>
        <CardContent className="prose prose-sm max-w-none space-y-4 text-card-foreground">
          <p>
            All Gorilla Tag Elite COMP merchandise is printed and shipped by our merch partner, Fanjoy.
            Here's what to expect once items are available to order.
          </p>

          <h3 className="text-lg font-semibold mt-6 mb-2">Shipping</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Orders are typically processed within 3-5 business days before shipping.</li>
            <li>Standard delivery generally takes 5-10 business days depending on your location.</li>
            <li>Tracking information will be provided by email once your order ships.</li>
            <li>Currently, we only ship within the United States.</li>
          </ul>

          <h3 className="text-lg font-semibold mt-6 mb-2">Returns &amp; Exchanges</h3>
          <ul className="list-disc pl-6 space-y-2">
            <li>Returns are accepted within 30 days of delivery for unworn, unwashed items with tags attached.</li>
            <li>Custom or personalized items (such as jerseys with a name and number) are final sale and cannot be returned or exchanged unless defective.</li>
            <li>If an item arrives damaged or defective, reach out and we'll make it right.</li>
          </ul>

          <p className="mt-6">
            Have a question about an order? Join the{" "}
            <a href="https://discord.gg/gtecleague" target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">
              Discord
            </a>{" "}
            and reach out to staff.
          </p>
        </CardContent>
      </Card>
    </main>
  );
};
