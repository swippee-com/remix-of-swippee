// ===== Enums =====
export type UserRole = "user" | "admin" | "compliance";
export type KycStatus = "not_submitted" | "pending_review" | "approved" | "rejected" | "needs_more_info";
export type QuoteRequestStatus = "draft" | "submitted" | "under_review" | "quoted" | "awaiting_user_acceptance" | "accepted" | "rejected" | "expired" | "cancelled" | "converted_to_trade";
export type TradeStatus = "pending_settlement" | "awaiting_fiat_payment" | "payment_proof_uploaded" | "fiat_received" | "awaiting_crypto_transfer" | "crypto_received" | "ready_to_release" | "completed" | "disputed" | "cancelled" | "failed";
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

export interface QuoteRequest {
  id: string;
  user_id: string;
  side: TradeSide;
  asset: string;
  network: string;
  fiat_currency: string;
  amount_type: "crypto" | "fiat";
  requested_amount: number;
  preferred_payment_method_id: string | null;
  payout_address: string | null;
  notes: string | null;
  status: QuoteRequestStatus;
  created_at: string;
  updated_at: string;
}

export interface Quote {
  id: string;
  request_id: string;
  price_per_unit: number;
  fees: number;
  spread: number | null;
  total_payable: number;
  total_receivable: number;
  expires_at: string;
  instructions: string | null;
  internal_note: string | null;
  created_at: string;
}

export interface Trade {
  id: string;
  quote_id: string;
  user_id: string;
  side: TradeSide;
  asset: string;
  network: string;
  fiat_currency: string;
  quoted_rate: number;
  fee: number;
  gross_amount: number;
  net_amount: number;
  status: TradeStatus;
  settlement_notes: string | null;
  tx_hash: string | null;
  payment_proof_url: string | null;
  assigned_admin_id: string | null;
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

export interface TradeStatusHistory {
  id: string;
  trade_id: string;
  from_status: TradeStatus | null;
  to_status: TradeStatus;
  changed_by: string | null;
  notes: string | null;
  created_at: string;
}
