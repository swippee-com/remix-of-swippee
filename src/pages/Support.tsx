import { PublicLayout } from "@/components/layout/PublicLayout";
import { BRAND } from "@/config/brand";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Mail, MessageCircle } from "lucide-react";
import { usePageMeta } from "@/hooks/use-page-meta";

const FAQ_ITEMS = [
  {
    q: "How long does it take to process an order?",
    a: "Most orders are processed within 15–30 minutes during business hours. Complex or high-value orders may take up to 24 hours due to manual review.",
  },
  {
    q: "Which banks and payment methods are supported?",
    a: "We support all major Nepali banks via bank transfer, as well as eSewa, Khalti, and IME Pay digital wallets.",
  },
  {
    q: "What are the minimum and maximum order limits?",
    a: "The minimum order is NPR 1,000. Maximum limits depend on your KYC level — standard verified users can trade up to NPR 500,000 per order.",
  },
  {
    q: "How do I complete KYC verification?",
    a: "Go to Dashboard → KYC, fill in your personal details, upload your ID documents and a selfie, then submit for review. Verification usually takes 1–2 business days.",
  },
  {
    q: "Can I cancel an order after placing it?",
    a: "Yes, you can cancel orders that are still in 'Awaiting Payment' status from the order detail page. Once payment proof is submitted, cancellation is no longer possible.",
  },
  {
    q: "What happens if my order expires?",
    a: "Rate locks expire after 10 minutes. If the timer runs out before you submit payment, the order is automatically cancelled and you can place a new one at the current rate.",
  },
  {
    q: "How do refunds work?",
    a: "If an order is cancelled after payment, refunds are processed to your original payment method within 3–5 business days. See our Refund Policy for details.",
  },
];

export default function SupportPage() {
  usePageMeta(
    "Support — Swippee Nepal OTC Crypto Desk",
    "Get help with your Swippee account. Contact our Nepal-based support team for crypto trading assistance, KYC help, and settlement queries."
  );
  return (
    <PublicLayout>
      <div className="container py-20">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight">Support</h1>
          <p className="mt-4 text-muted-foreground">Need help? We're here for you.</p>

          <div className="mt-8 grid gap-4 sm:grid-cols-2">
            <div className="flex items-start gap-4 rounded-lg border bg-card p-6 shadow-card">
              <Mail className="h-6 w-6 text-primary shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold">Email Support</h3>
                <p className="mt-1 text-sm text-muted-foreground">{BRAND.supportEmail}</p>
              </div>
            </div>
            <div className="flex items-start gap-4 rounded-lg border bg-card p-6 shadow-card">
              <MessageCircle className="h-6 w-6 text-primary shrink-0 mt-0.5" />
              <div>
                <h3 className="font-semibold">In-App Support</h3>
                <p className="mt-1 text-sm text-muted-foreground">Create a ticket from your dashboard.</p>
              </div>
            </div>
          </div>

          {/* FAQ */}
          <div className="mt-10 rounded-lg border bg-card p-6 shadow-card">
            <h2 className="text-lg font-semibold mb-4">Frequently Asked Questions</h2>
            <Accordion type="single" collapsible className="w-full">
              {FAQ_ITEMS.map((item, i) => (
                <AccordionItem key={i} value={`faq-${i}`}>
                  <AccordionTrigger className="text-left text-sm">{item.q}</AccordionTrigger>
                  <AccordionContent className="text-sm text-muted-foreground">{item.a}</AccordionContent>
                </AccordionItem>
              ))}
            </Accordion>
          </div>

          <div className="mt-10 rounded-lg border bg-card p-6 shadow-card">
            <h2 className="font-semibold">Send us a message</h2>
            <form className="mt-4 space-y-4" onSubmit={(e) => e.preventDefault()}>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">Name</label>
                  <Input className="mt-1" placeholder="Your name" />
                </div>
                <div>
                  <label className="text-sm font-medium">Email</label>
                  <Input className="mt-1" type="email" placeholder="your@email.com" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium">Subject</label>
                <Input className="mt-1" placeholder="How can we help?" />
              </div>
              <div>
                <label className="text-sm font-medium">Message</label>
                <Textarea className="mt-1" rows={5} placeholder="Describe your issue or question..." />
              </div>
              <Button type="submit">Send Message</Button>
            </form>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}