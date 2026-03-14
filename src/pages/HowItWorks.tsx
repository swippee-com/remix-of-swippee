import { PublicLayout } from "@/components/layout/PublicLayout";
import { BRAND } from "@/config/brand";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { UserPlus, Shield, FileText, ArrowLeftRight, CreditCard, CheckCircle } from "lucide-react";

const steps = [
  { icon: UserPlus, title: "1. Sign Up", description: "Create your account with email and password." },
  { icon: Shield, title: "2. Complete KYC", description: "Submit your identity documents for verification." },
  { icon: FileText, title: "3. Request a Quote", description: "Tell us what you want to buy or sell, and the amount." },
  { icon: ArrowLeftRight, title: "4. Receive Quote", description: "Our desk reviews your request and sends a competitive quote." },
  { icon: CreditCard, title: "5. Make Payment", description: "Accept the quote and complete payment via your preferred method." },
  { icon: CheckCircle, title: "6. Settlement", description: "We settle the trade and both parties receive confirmation." },
];

export default function HowItWorksPage() {
  return (
    <PublicLayout>
      <div className="container py-20">
        <div className="mx-auto max-w-3xl text-center">
          <h1 className="text-3xl font-bold tracking-tight">How {BRAND.name} Works</h1>
          <p className="mt-4 text-muted-foreground">A simple, secure process from signup to settlement.</p>
        </div>
        <div className="mx-auto mt-16 max-w-2xl space-y-8">
          {steps.map((step, i) => (
            <div key={i} className="flex gap-5 rounded-lg border bg-card p-6 shadow-card">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-muted">
                <step.icon className="h-6 w-6 text-primary" />
              </div>
              <div>
                <h3 className="font-semibold">{step.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
        <div className="mt-12 text-center">
          <Button variant="hero" asChild><Link to="/auth/signup">Get Started</Link></Button>
        </div>
      </div>
    </PublicLayout>
  );
}
