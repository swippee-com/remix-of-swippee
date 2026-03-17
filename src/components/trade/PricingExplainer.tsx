import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Info } from "lucide-react";

export function PricingExplainer({ className }: { className?: string }) {
  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-2">
        <Info className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">How Swippee Pricing Works</h3>
      </div>
      <Accordion type="single" collapsible>
        <AccordionItem value="market">
          <AccordionTrigger className="text-sm py-2">Live market price</AccordionTrigger>
          <AccordionContent className="text-muted-foreground">
            We fetch real-time crypto prices from global markets and the NRB forex rate for USD/NPR conversion.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="spread">
          <AccordionTrigger className="text-sm py-2">Swippee spread</AccordionTrigger>
          <AccordionContent className="text-muted-foreground">
            A small margin is applied to cover operations and settlement. Stablecoins use a fixed NPR markup; volatile assets use a percentage spread.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="fees">
          <AccordionTrigger className="text-sm py-2">Network & settlement fees</AccordionTrigger>
          <AccordionContent className="text-muted-foreground">
            Network fees vary by blockchain (TRC20 is cheapest). Payment method adjustments may apply for eSewa or Khalti.
          </AccordionContent>
        </AccordionItem>
        <AccordionItem value="lock">
          <AccordionTrigger className="text-sm py-2">Rate lock (45 seconds)</AccordionTrigger>
          <AccordionContent className="text-muted-foreground">
            When you proceed, your rate is locked for 45 seconds. If the timer expires, you'll get a refreshed rate automatically.
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
