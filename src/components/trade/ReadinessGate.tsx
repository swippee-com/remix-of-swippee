import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Drawer, DrawerContent, DrawerHeader, DrawerTitle, DrawerDescription } from "@/components/ui/drawer";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { CheckCircle, Circle, LogIn, Phone, Shield, CreditCard, Wallet } from "lucide-react";
import { Link } from "react-router-dom";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";
import { useTradeReadiness } from "@/hooks/use-trade-readiness";

interface ReadinessGateProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  side: "buy" | "sell";
}

const STEP_ICONS: Record<string, typeof LogIn> = {
  auth: LogIn,
  phone: Phone,
  kyc: Shield,
  payment: CreditCard,
  payout: Wallet,
};

export function ReadinessGate({ open, onOpenChange, side }: ReadinessGateProps) {
  const isMobile = useIsMobile();
  const { steps } = useTradeReadiness(side);

  const completedCount = steps.filter((s) => s.passed).length;
  const progressPercent = Math.round((completedCount / steps.length) * 100);
  const firstIncomplete = steps.find((s) => !s.passed);

  const content = (
    <div className="space-y-4">
      <div className="space-y-2">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground">{completedCount} of {steps.length} complete</span>
          <span className="font-medium text-primary">{progressPercent}%</span>
        </div>
        <Progress value={progressPercent} className="h-2" />
      </div>
      <div className="space-y-3">
        {steps.map((step) => {
          const Icon = STEP_ICONS[step.key] || Circle;
          return (
            <div
              key={step.key}
              className={cn(
                "flex items-center gap-3 rounded-lg border p-3",
                step.passed ? "border-success/30 bg-success/5" : "border-border"
              )}
            >
              {step.passed ? (
                <CheckCircle className="h-5 w-5 text-success shrink-0" />
              ) : (
                <Icon className="h-5 w-5 text-muted-foreground shrink-0" />
              )}
              <span className={cn("text-sm flex-1", step.passed && "text-muted-foreground line-through")}>
                {step.label}
              </span>
              {!step.passed && step === firstIncomplete && (
                <Button size="sm" variant="default" asChild className="h-7 text-xs">
                  <Link to={step.href} onClick={() => onOpenChange(false)}>
                    {step.cta}
                  </Link>
                </Button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );

  if (isMobile) {
    return (
      <Drawer open={open} onOpenChange={onOpenChange}>
        <DrawerContent>
          <DrawerHeader>
            <DrawerTitle>Complete Setup to Trade</DrawerTitle>
            <DrawerDescription>
              A few steps are needed before you can place an order.
            </DrawerDescription>
          </DrawerHeader>
          <div className="px-4 pb-6">
            {content}
          </div>
        </DrawerContent>
      </Drawer>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Complete Setup to Trade</DialogTitle>
          <DialogDescription>
            A few steps are needed before you can place an order.
          </DialogDescription>
        </DialogHeader>
        {content}
      </DialogContent>
    </Dialog>
  );
}
