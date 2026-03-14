import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { Wallet, Plus } from "lucide-react";

const addresses = [
  { id: "1", label: "Main USDT TRC20", asset: "USDT", network: "TRC20", address: "TXkj...8a2F", whitelisted: true },
  { id: "2", label: "BTC Address", asset: "BTC", network: "BTC", address: "bc1q...z4f9", whitelisted: true },
];

export default function PayoutAddressesPage() {
  return (
    <DashboardLayout>
      <PageHeader title="Payout Addresses" description="Manage your crypto receiving addresses.">
        <Button><Plus className="mr-1 h-4 w-4" /> Add Address</Button>
      </PageHeader>

      {addresses.length === 0 ? (
        <EmptyState icon={<Wallet className="mx-auto h-10 w-10" />} title="No payout addresses" description="Add wallet addresses for receiving crypto." className="mt-6" />
      ) : (
        <div className="mt-6 rounded-lg border bg-card shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-muted/50">
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Label</th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Asset</th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Network</th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Address</th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">Actions</th>
              </tr></thead>
              <tbody className="divide-y">
                {addresses.map((a) => (
                  <tr key={a.id} className="hover:bg-muted/30">
                    <td className="px-6 py-4 font-medium">{a.label}</td>
                    <td className="px-6 py-4">{a.asset}</td>
                    <td className="px-6 py-4">{a.network}</td>
                    <td className="px-6 py-4 font-mono text-xs">{a.address}</td>
                    <td className="px-6 py-4"><Button variant="ghost" size="sm">Edit</Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
