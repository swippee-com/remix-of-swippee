import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { CreditCard, Plus, MoreVertical, Star } from "lucide-react";
import { BRAND } from "@/config/brand";

const methods = [
  { id: "1", label: "Main Bank Account", type: "bank_transfer", holder: "John Doe", bank: "NIC Asia Bank", account: "****4521", isDefault: true },
  { id: "2", label: "eSewa Wallet", type: "esewa", holder: "John Doe", wallet: "9841XXXXXX", isDefault: false },
  { id: "3", label: "Khalti Wallet", type: "khalti", holder: "John Doe", wallet: "9841XXXXXX", isDefault: false },
];

export default function PaymentMethodsPage() {
  return (
    <DashboardLayout>
      <PageHeader title="Payment Methods" description="Manage your payment methods for fiat transactions.">
        <Button><Plus className="mr-1 h-4 w-4" /> Add Method</Button>
      </PageHeader>

      {methods.length === 0 ? (
        <EmptyState
          icon={<CreditCard className="mx-auto h-10 w-10" />}
          title="No payment methods"
          description="Add a payment method to start trading."
          action={<Button>Add Payment Method</Button>}
          className="mt-6"
        />
      ) : (
        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {methods.map((m) => (
            <div key={m.id} className="rounded-lg border bg-card p-5 shadow-card">
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5 text-muted-foreground" />
                  <span className="font-medium text-sm">{m.label}</span>
                </div>
                {m.isDefault && <Star className="h-4 w-4 text-warning fill-warning" />}
              </div>
              <div className="mt-3 space-y-1 text-sm text-muted-foreground">
                <p className="capitalize">{m.type.replace("_", " ")}</p>
                <p>{m.holder}</p>
                {m.bank && <p>{m.bank} • {m.account}</p>}
                {m.wallet && <p>Wallet: {m.wallet}</p>}
              </div>
              <div className="mt-4 flex gap-2">
                <Button variant="outline" size="sm">Edit</Button>
                {!m.isDefault && <Button variant="ghost" size="sm">Set Default</Button>}
              </div>
            </div>
          ))}
        </div>
      )}
    </DashboardLayout>
  );
}
