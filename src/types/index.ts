// ===== Enums =====
export type UserRole = "user" | "admin" | "compliance";
export type KycStatus = "not_submitted" | "pending_review" | "approved" | "rejected" | "needs_more_info";
export type OrderStatus = "draft" | "rate_locked" | "awaiting_payment" | "payment_proof_uploaded" | "under_review" | "manual_review" | "approved_for_settlement" | "settlement_in_progress" | "completed" | "expired" | "cancelled" | "rejected";
export type TradeSide = "buy" | "sell";
export type LedgerBucket = "client_receivable" | "client_payable" | "fees_revenue" | "settlement_pending" | "otc_inventory" | "fiat_clearing" | "crypto_clearing" | "manual_adjustment";
export type LedgerDirection = "debit" | "credit";
export type PaymentMethodType = "bank_transfer" | "esewa" | "khalti" | "ime_pay" | "other"; // ime_pay kept for DB compat but hidden from UI
export type TicketStatus = "open" | "pending_user" | "pending_admin" | "resolved" | "closed";

// ===== Models =====
export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  kyc_status: KycStatus;
  phone: string | null;
  country: string | null;
  avatar_url: string | null;
  created_at: string;
  updated_at: string;
}

export interface LedgerEntry {
  id: string;
  trade_id: string | null;
  user_id: string | null;
  entry_type: string;
  asset: string;
  currency: string;
  amount: number;
  direction: LedgerDirection;
  bucket: LedgerBucket;
  reference_type: string | null;
  reference_id: string | null;
  description: string | null;
  created_by: string | null;
  created_at: string;
}

export interface AuditLog {
  id: string;
  actor_id: string | null;
  actor_role: UserRole | null;
  action: string;
  target_type: string;
  target_id: string;
  metadata: Record<string, unknown> | null;
  created_at: string;
}

export interface PaymentMethod {
  id: string;
  user_id: string;
  label: string;
  payment_type: PaymentMethodType;
  account_holder_name: string;
  bank_name: string | null;
  account_number: string | null;
  wallet_id: string | null;
  qr_image_url: string | null;
  notes: string | null;
  is_default: boolean;
  created_at: string;
}

export interface PayoutAddress {
  id: string;
  user_id: string;
  asset: string;
  network: string;
  address: string;
  label: string;
  memo: string | null;
  is_whitelisted: boolean;
  created_at: string;
}

export interface Notification {
  id: string;
  user_id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  link: string | null;
  created_at: string;
}

export interface SupportTicket {
  id: string;
  user_id: string;
  subject: string;
  category: string;
  status: TicketStatus;
  created_at: string;
  updated_at: string;
}
