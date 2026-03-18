import { PublicLayout } from "@/components/layout/PublicLayout";
import { BRAND } from "@/config/brand";
import { usePageMeta } from "@/hooks/use-page-meta";

export default function AboutPage() {
  usePageMeta(
    "About Swippee — Nepal's Trusted OTC Crypto Desk",
    "Learn about Swippee, Nepal's secure OTC cryptocurrency trading desk. KYC-verified users, manual settlement, and full transparency."
  );
  return (
    <PublicLayout>
      <div className="container py-20">
        <div className="mx-auto max-w-2xl">
          <h1 className="text-3xl font-bold tracking-tight">About {BRAND.name}</h1>
          <div className="mt-8 space-y-6 text-muted-foreground">
            <p><p>{BRAND.name} is a trusted cryptocurrency trading platform that provides secure, transparent trading for individuals and businesses in Nepal.</p></p>
            <p>Unlike automated exchanges, we offer personalized service with manual settlement, ensuring every transaction is verified, audited, and completed with full transparency.</p>
            <h2 className="pt-4 text-xl font-semibold text-foreground">Our Commitment</h2>
            <ul className="list-disc space-y-2 pl-6">
              <li>Full KYC verification for all users</li>
              <li>Manual settlement with audit trail</li>
              <li>Competitive OTC rates</li>
              <li>Dedicated support team</li>
              <li>Complete transaction history and ledger</li>
            </ul>
            <h2 className="pt-4 text-xl font-semibold text-foreground">Supported Assets</h2>
            <p>We currently support trading in {BRAND.supportedAssets.join(", ")} with settlement in {BRAND.defaultFiatCurrency}.</p>
          </div>
        </div>
      </div>
    </PublicLayout>
  );
}
