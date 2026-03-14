import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Eye, CheckCircle, XCircle, MessageSquare } from "lucide-react";

const kycQueue = [
  { id: "KYC-001", name: "Sita Thapa", email: "sita@example.com", status: "pending_review" as const, submitted: "Mar 10, 2026", sourceOfFunds: "Salary" },
  { id: "KYC-002", name: "Bikram Rai", email: "bikram@example.com", status: "pending_review" as const, submitted: "Mar 11, 2026", sourceOfFunds: "Business" },
  { id: "KYC-003", name: "Anita Gurung", email: "anita@example.com", status: "needs_more_info" as const, submitted: "Mar 9, 2026", sourceOfFunds: "Investments" },
];

export default function AdminKycPage() {
  return (
    <AdminLayout>
      <PageHeader title="KYC Queue" description="Review and process KYC submissions." />
      <div className="mt-6 flex items-center gap-3">
        <Select defaultValue="all">
          <SelectTrigger className="w-48"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            <SelectItem value="pending_review">Pending Review</SelectItem>
            <SelectItem value="needs_more_info">Needs More Info</SelectItem>
            <SelectItem value="approved">Approved</SelectItem>
            <SelectItem value="rejected">Rejected</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <div className="mt-4 space-y-4">
        {kycQueue.map((kyc) => (
          <div key={kyc.id} className="rounded-lg border bg-card p-6 shadow-card">
            <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="flex items-center gap-3">
                  <h3 className="font-semibold">{kyc.name}</h3>
                  <StatusBadge status={kyc.status} />
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{kyc.email} • Submitted {kyc.submitted}</p>
                <p className="mt-1 text-xs text-muted-foreground">Source of Funds: {kyc.sourceOfFunds}</p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" size="sm"><Eye className="mr-1 h-3 w-3" /> Review</Button>
                <Button variant="success" size="sm"><CheckCircle className="mr-1 h-3 w-3" /> Approve</Button>
                <Button variant="destructive" size="sm"><XCircle className="mr-1 h-3 w-3" /> Reject</Button>
                <Button variant="ghost" size="sm"><MessageSquare className="mr-1 h-3 w-3" /> Request Info</Button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </AdminLayout>
  );
}
