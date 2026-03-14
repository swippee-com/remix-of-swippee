import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search } from "lucide-react";

const logs = [
  { id: "1", actor: "Admin (You)", action: "KYC_APPROVED", target: "Sita Thapa", entity: "kyc_submission", time: "10 min ago" },
  { id: "2", actor: "Admin (You)", action: "QUOTE_CREATED", target: "QR-010", entity: "quote", time: "25 min ago" },
  { id: "3", actor: "System", action: "QUOTE_EXPIRED", target: "QR-008", entity: "quote_request", time: "1 hour ago" },
  { id: "4", actor: "Admin (You)", action: "TRADE_STATUS_CHANGED", target: "TR-012", entity: "trade", time: "2 hours ago" },
  { id: "5", actor: "Admin (You)", action: "PAYMENT_PROOF_APPROVED", target: "TR-011", entity: "payment_proof", time: "3 hours ago" },
  { id: "6", actor: "Admin (You)", action: "LEDGER_ADJUSTMENT", target: "L-004", entity: "ledger_entry", time: "4 hours ago" },
];

export default function AdminAuditLogsPage() {
  return (
    <AdminLayout>
      <PageHeader title="Audit Logs" description="Complete log of all admin actions and system events." />
      <div className="mt-6 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input className="pl-9" placeholder="Search logs..." />
        </div>
        <Select defaultValue="all">
          <SelectTrigger className="w-40"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Actions</SelectItem>
            <SelectItem value="kyc">KYC</SelectItem>
            <SelectItem value="quote">Quotes</SelectItem>
            <SelectItem value="trade">Trades</SelectItem>
            <SelectItem value="ledger">Ledger</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="mt-4 rounded-lg border bg-card shadow-card divide-y">
        {logs.map((log) => (
          <div key={log.id} className="flex items-start justify-between px-6 py-4">
            <div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-xs rounded bg-muted px-1.5 py-0.5">{log.action}</span>
                <span className="text-sm text-muted-foreground">on {log.entity}</span>
              </div>
              <p className="mt-1 text-sm">
                <span className="font-medium">{log.actor}</span>
                <span className="text-muted-foreground"> → {log.target}</span>
              </p>
            </div>
            <span className="text-xs text-muted-foreground whitespace-nowrap">{log.time}</span>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
