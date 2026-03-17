import { PublicLayout } from "@/components/layout/PublicLayout";
import { TradeWidget } from "@/components/trade/TradeWidget";
import { PricingExplainer } from "@/components/trade/PricingExplainer";
import { usePageMeta } from "@/hooks/use-page-meta";
import { BRAND } from "@/config/brand";
import { Shield, Banknote, Zap, Clock } from "lucide-react";
import { useSearchParams } from "react-router-dom";
import type { SupportedAsset } from "@/config/brand";
import type { TradeSide } from "@/hooks/use-trade-pricing";

const trustItems = [
  { icon: Zap, label: "Instant pricing" },
  { icon: Shield, label: "KYC-secured" },
  { icon: Banknote, label: "Local NPR payments" },
  { icon: Clock, label: "45s rate lock" },
];

export default function Trade() {
  usePageMeta(
    "Trade Crypto — Buy & Sell USDT, BTC, ETH in NPR | Swippee",
    "Buy and sell crypto instantly with live rates in Nepal. USDT, BTC, ETH, USDC with bank transfer, eSewa, and Khalti."
  );

  const [params] = useSearchParams();
  const defaultAsset = (params.get("asset") as SupportedAsset) || "USDT";
  const defaultSide = (params.get("side") as TradeSide) || "buy";

  return (
    <PublicLayout>
      <div className="container px-4 py-12 sm:px-6 lg:px-8">
        <div className="grid gap-8 lg:grid-cols-[minmax(0,480px)_1fr] lg:items-start">
          {/* Left — Widget */}
          <div>
            <TradeWidget variant="full" defaultAsset={defaultAsset} defaultSide={defaultSide} />
          </div>

          {/* Right — Info */}
          <div className="space-y-6">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight">Trade Crypto in Nepal</h1>
              <p className="mt-1 text-muted-foreground">
                Live rates, local payment methods, and fast settlement. Select an asset, enter your amount, and trade instantly.
              </p>
            </div>

            {/* Trust chips */}
            <div className="flex flex-wrap gap-2">
              {trustItems.map((t) => (
                <div key={t.label} className="inline-flex items-center gap-1.5 rounded-full border bg-muted px-3 py-1.5 text-xs font-medium text-muted-foreground">
                  <t.icon className="h-3.5 w-3.5" />
                  {t.label}
                </div>
              ))}
            </div>

            {/* Payment methods */}
            <div className="rounded-lg border bg-card p-4">
              <h3 className="text-sm font-semibold mb-3">Supported Payment Methods</h3>
              <div className="flex flex-wrap gap-3">
                {BRAND.paymentMethods.filter(p => p.value !== "other").map((pm) => {
                  const logoUrl = BRAND.paymentLogos[pm.value];
                  return (
                    <div key={pm.value} className="flex items-center gap-2 rounded-md border px-3 py-2">
                      {logoUrl && <img src={logoUrl} alt={pm.label} className="h-5 w-5 object-contain" />}
                      <span className="text-sm font-medium">{pm.label}</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Pricing Explainer */}
            <div className="rounded-lg border bg-card p-4">
              <PricingExplainer />
            </div>

            {/* Supported assets */}
            <div className="rounded-lg border bg-card p-4">
              <h3 className="text-sm font-semibold mb-3">Supported Assets</h3>
              <div className="flex flex-wrap gap-2">
                {BRAND.supportedAssets.map((a) => (
                  <span key={a} className="rounded-md border bg-muted px-3 py-1.5 text-sm font-semibold">{a}</span>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
