import { PublicLayout } from "@/components/layout/PublicLayout";
import { BRAND } from "@/config/brand";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Shield, Zap, Wallet, Banknote, LayoutDashboard } from "lucide-react";
import { motion } from "framer-motion";
import { SponsorStrip } from "@/components/ads/SponsorStrip";
import { TradeWidget } from "@/components/trade/TradeWidget";
import { useAuth } from "@/contexts/AuthContext";
import { usePageMeta } from "@/hooks/use-page-meta";

const features = [
  { icon: Zap, title: "Instant Pricing", description: "See live buy and sell rates instantly. No waiting for manual quotes." },
  { icon: Shield, title: "KYC Verified", description: "All users are verified before trading. Your security is our priority." },
  { icon: Banknote, title: "Local Payments", description: "Pay with bank transfer, eSewa, or Khalti. Settlement in NPR." },
  { icon: Wallet, title: "Multi-Asset Support", description: `Trade ${BRAND.supportedAssets.join(", ")} with seamless settlement.` },
];

const steps = [
  { step: "01", title: "Select Asset", description: "Choose what to buy or sell and see the live Swippee rate." },
  { step: "02", title: "Lock Your Rate", description: "Lock the price for 45 seconds and confirm your order." },
  { step: "03", title: "Pay & Receive", description: "Make payment via local rails and receive settlement." },
];

export default function LandingPage() {
  const { user } = useAuth();
  usePageMeta(
    "Swippee — Buy & Sell Crypto in Nepal",
    "Nepal's trusted crypto broker. Buy and sell USDT, BTC, ETH, USDC instantly with live rates, local NPR payments, and fast settlement."
  );
  return (
    <PublicLayout>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="container py-16 md:py-24">
          <div className="grid gap-10 lg:grid-cols-[1fr_minmax(0,420px)] lg:items-center">
            {/* Left — Copy */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
            >
              <div className="mb-4 inline-flex items-center rounded-full border bg-muted px-4 py-1.5 text-xs font-medium text-muted-foreground">
                Live Rates · Instant Pricing
              </div>
              <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
                Buy & Sell Crypto{" "}
                <span className="block text-muted-foreground">in Nepal</span>
              </h1>
              <p className="mt-6 max-w-lg text-lg text-muted-foreground text-balance">
                Live rates, local payment methods, and fast settlement. Trade USDT, BTC, ETH, and USDC with confidence.
              </p>

              {/* Trust chips */}
              <div className="mt-6 flex flex-wrap gap-2">
                {["Local NPR Payments", "KYC-Secured", "Instant Pricing", "45s Rate Lock"].map((chip) => (
                  <span key={chip} className="inline-flex items-center rounded-full border bg-muted px-3 py-1 text-xs font-medium text-muted-foreground">
                    {chip}
                  </span>
                ))}
              </div>

              <div className="mt-8 flex flex-col items-start gap-3 sm:flex-row">
                {user ? (
                  <Button variant="hero" asChild>
                    <Link to="/dashboard">Dashboard <LayoutDashboard className="ml-1 h-4 w-4" /></Link>
                  </Button>
                ) : (
                  <Button variant="hero" asChild>
                    <Link to="/trade">Start Trading <ArrowRight className="ml-1 h-4 w-4" /></Link>
                  </Button>
                )}
                <Button variant="hero-outline" asChild>
                  <Link to="/how-it-works">How It Works</Link>
                </Button>
              </div>
            </motion.div>

            {/* Right — Trade Widget */}
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
            >
              <TradeWidget variant="compact" />
            </motion.div>
          </div>
        </div>
        <div className="absolute inset-0 -z-10 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-muted/50 via-background to-background" />
      </section>

      {/* Features */}
      <section className="border-t bg-muted/20">
        <div className="container py-20">
          <h2 className="text-center text-2xl font-semibold tracking-tight">Why {BRAND.name}?</h2>
          <p className="mx-auto mt-2 max-w-lg text-center text-muted-foreground">A modern crypto broker built for Nepal — transparent, instant, and local.</p>
          <div className="mt-12 grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="rounded-lg border bg-card p-6 shadow-card"
              >
                <f.icon className="h-8 w-8 text-primary" />
                <h3 className="mt-4 font-semibold">{f.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{f.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <SponsorStrip />

      {/* Steps */}
      <section className="border-t">
        <div className="container py-20">
          <h2 className="text-center text-2xl font-semibold tracking-tight">How It Works</h2>
          <div className="mt-12 grid gap-8 md:grid-cols-3">
            {steps.map((s, i) => (
              <div key={i} className="text-center">
                <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                  {s.step}
                </div>
                <h3 className="mt-4 font-semibold">{s.title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{s.description}</p>
              </div>
            ))}
          </div>
          <div className="mt-12 text-center">
            <Button variant="hero" asChild>
              <Link to="/trade">Start Trading <ArrowRight className="ml-1 h-4 w-4" /></Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Supported Assets */}
      <section className="border-t bg-muted/20">
        <div className="container py-16 text-center">
          <h2 className="text-2xl font-semibold tracking-tight">Supported Assets</h2>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            {BRAND.supportedAssets.map((asset) => (
              <div key={asset} className="rounded-lg border bg-card px-6 py-4 shadow-card">
                <span className="text-lg font-semibold">{asset}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="border-t">
        <div className="container py-20 text-center">
          <h2 className="text-2xl font-semibold tracking-tight">Ready to Trade?</h2>
          <p className="mt-2 text-muted-foreground">Join {BRAND.name} and start trading crypto with live rates.</p>
          <div className="mt-6 flex justify-center gap-3">
            <Button variant="hero" asChild><Link to="/trade">Start Trading</Link></Button>
            <Button variant="hero-outline" asChild><Link to="/support">Contact Support</Link></Button>
          </div>
        </div>
      </section>
    </PublicLayout>
  );
}
