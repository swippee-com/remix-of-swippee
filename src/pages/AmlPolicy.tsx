import { PublicLayout } from "@/components/layout/PublicLayout";
import { BRAND } from "@/config/brand";

export default function AmlPolicy() {
  return (
    <PublicLayout>
      <div className="container max-w-3xl py-16 md:py-24">
        <h1 className="text-3xl font-bold tracking-tight mb-2">AML & KYC Policy</h1>
        <p className="text-sm text-muted-foreground mb-8">Last updated: March 14, 2026</p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-6 text-sm leading-relaxed text-muted-foreground">
          <section>
            <h2 className="text-lg font-semibold text-foreground">1. Purpose</h2>
            <p>{BRAND.name} is committed to preventing money laundering, terrorist financing, and other financial crimes. This policy outlines our procedures for customer identification and transaction monitoring.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">2. Customer Identification (KYC)</h2>
            <p>All users must complete identity verification before trading. We require:</p>
            <ul className="list-disc pl-5 space-y-1 mt-2">
              <li>Government-issued photo ID (passport, citizenship, or driving license)</li>
              <li>Proof of address (utility bill or bank statement, dated within 3 months)</li>
              <li>Selfie verification matching the ID document</li>
              <li>Source of funds declaration</li>
            </ul>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">3. Enhanced Due Diligence</h2>
            <p>For high-value transactions or flagged accounts, we may request additional documentation including bank statements, proof of employment, and detailed source of wealth information.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">4. Transaction Monitoring</h2>
            <p>We monitor all transactions for unusual patterns including rapid high-value trades, transactions with sanctioned entities, structuring to avoid thresholds, and inconsistent trading patterns.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">5. Suspicious Activity Reporting</h2>
            <p>We report suspicious transactions to relevant authorities as required by law. Accounts involved in suspicious activity may be frozen pending investigation.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">6. Record Keeping</h2>
            <p>We maintain records of all KYC documents, transaction histories, and compliance decisions for a minimum of 5 years as required by applicable regulations.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">7. Sanctions Screening</h2>
            <p>All users are screened against international sanctions lists. We do not provide services to individuals or entities on OFAC, UN, EU, or other applicable sanctions lists.</p>
          </section>

          <section>
            <h2 className="text-lg font-semibold text-foreground">8. Contact</h2>
            <p>For compliance-related questions, contact <a href={`mailto:${BRAND.supportEmail}`} className="text-foreground underline">{BRAND.supportEmail}</a>.</p>
          </section>
        </div>
      </div>
    </PublicLayout>
  );
}
