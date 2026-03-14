import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { BRAND } from "@/config/brand";

export default function AdminSettingsPage() {
  return (
    <AdminLayout>
      <PageHeader title="Settings" description="Platform configuration." />
      <div className="mt-6 max-w-2xl space-y-8">
        <section className="rounded-lg border bg-card p-6 shadow-card">
          <h2 className="font-semibold">Platform Settings</h2>
          <div className="mt-4 grid gap-4 sm:grid-cols-2">
            <div><label className="text-sm font-medium">Platform Name</label><Input className="mt-1" defaultValue={BRAND.name} /></div>
            <div><label className="text-sm font-medium">Default Fiat Currency</label><Input className="mt-1" defaultValue={BRAND.defaultFiatCurrency} /></div>
            <div><label className="text-sm font-medium">Support Email</label><Input className="mt-1" defaultValue={BRAND.supportEmail} /></div>
            <div><label className="text-sm font-medium">Quote Expiry (minutes)</label><Input className="mt-1" type="number" defaultValue="30" /></div>
          </div>
          <div className="mt-4"><Button>Save Settings</Button></div>
        </section>
        <section className="rounded-lg border bg-card p-6 shadow-card">
          <h2 className="font-semibold">Supported Assets</h2>
          <p className="mt-1 text-sm text-muted-foreground">Currently: {BRAND.supportedAssets.join(", ")}</p>
          <Separator className="my-4" />
          <h2 className="font-semibold">Supported Networks</h2>
          <p className="mt-1 text-sm text-muted-foreground">Currently: {BRAND.supportedNetworks.join(", ")}</p>
        </section>
      </div>
    </AdminLayout>
  );
}
