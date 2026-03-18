import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Info } from "lucide-react";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";

const STEPS = [
  { num: "①", label: "Market Price" },
  { num: "②", label: "USD/NPR Rate" },
  { num: "③", label: "Spread Applied" },
  { num: "④", label: "Fees Added" },
  { num: "⑤", label: "Your Rate" },
];

export function PricingExplainer({ className }: { className?: string }) {
  const isMobile = useIsMobile();

  return (
    <div className={className}>
      <div className="flex items-center gap-2 mb-3">
        <Info className="h-4 w-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold">How Swippee Pricing Works</h3>
      </div>

      {/* Step flow */}
      <div className={cn(
        "mb-4",
        isMobile ? "flex flex-col gap-1.5" : "flex items-center gap-1 flex-wrap"
      )}>
        {STEPS.map((step, i) => (
          <div key={step.num} className={cn("flex items-center gap-1", !isMobile && "shrink-0")}>
            <span className={cn(
              "inline-flex items-center gap-1.5 rounded-full border bg-muted px-3 py-1 text-xs font-medium",
              i === STEPS.length - 1 && "border-primary/40 bg-primary/10 text-primary"
            )}>
              <span>{step.num}</span>
              <span>{step.label}</span>
            </span>
            {i < STEPS.length - 1 && !isMobile && (
              <span className="text-muted-foreground text-xs">→</span>
            )}
          </div>
        ))}
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
