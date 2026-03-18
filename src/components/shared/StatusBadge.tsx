import { cn } from "@/lib/utils";
import { type KycStatus, type OrderStatus, type TicketStatus } from "@/types";

type StatusType = KycStatus | OrderStatus | TicketStatus | string;

const statusStyles: Record<string, string> = {
  // KYC
  not_submitted: "bg-muted text-muted-foreground",
  pending_review: "bg-warning/10 text-warning",
  approved: "bg-success/10 text-success",
  rejected: "bg-destructive/10 text-destructive",
  needs_more_info: "bg-warning/10 text-warning",
  // Order
  draft: "bg-muted text-muted-foreground",
  rate_locked: "bg-primary/10 text-primary",
  awaiting_payment: "bg-warning/10 text-warning",
  payment_proof_uploaded: "bg-primary/10 text-primary",
  under_review: "bg-warning/10 text-warning",
  manual_review: "bg-destructive/10 text-destructive",
  approved_for_settlement: "bg-success/10 text-success",
  settlement_in_progress: "bg-primary/10 text-primary",
  completed: "bg-success/10 text-success",
  expired: "bg-muted text-muted-foreground",
  cancelled: "bg-muted text-muted-foreground",
  // Ticket
  open: "bg-primary/10 text-primary",
  pending_user: "bg-warning/10 text-warning",
  pending_admin: "bg-warning/10 text-warning",
  resolved: "bg-success/10 text-success",
  closed: "bg-muted text-muted-foreground",
};

function formatLabel(status: string): string {
  return status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function StatusBadge({ status, className }: { status: StatusType; className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        statusStyles[status] || "bg-muted text-muted-foreground",
        className
      )}
    >
      {formatLabel(status)}
    </span>
  );
}
