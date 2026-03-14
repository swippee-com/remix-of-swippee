import {
  LayoutDashboard, Shield, CreditCard, Wallet, FileText, ArrowLeftRight,
  HeadphonesIcon, Settings, Users, ClipboardCheck, BookOpen, ScrollText,
  Activity, BarChart3, WalletCards
} from "lucide-react";

export const userNavItems = [
  { label: "Overview", href: "/dashboard", icon: LayoutDashboard },
  { label: "Wallet", href: "/dashboard/wallet", icon: WalletCards },
  { label: "KYC", href: "/dashboard/kyc", icon: Shield },
  { label: "Quote Requests", href: "/dashboard/quotes", icon: FileText },
  { label: "Trades", href: "/dashboard/trades", icon: ArrowLeftRight },
  { label: "Payment Methods", href: "/dashboard/payment-methods", icon: CreditCard },
  { label: "Payout Addresses", href: "/dashboard/payout-addresses", icon: Wallet },
  { label: "Support", href: "/dashboard/support", icon: HeadphonesIcon },
  { label: "Settings", href: "/dashboard/settings", icon: Settings },
];

export const adminNavItems = [
  { label: "Overview", href: "/admin", icon: BarChart3 },
  { label: "Analytics", href: "/admin/analytics", icon: Activity },
  { label: "Users", href: "/admin/users", icon: Users },
  { label: "KYC Queue", href: "/admin/kyc", icon: ClipboardCheck },
  { label: "Quote Requests", href: "/admin/quotes", icon: FileText },
  { label: "Trades", href: "/admin/trades", icon: ArrowLeftRight },
  { label: "Wallets", href: "/admin/wallets", icon: WalletCards },
  { label: "Ledger", href: "/admin/ledger", icon: BookOpen },
  { label: "Audit Logs", href: "/admin/audit-logs", icon: ScrollText },
  { label: "Support", href: "/admin/support", icon: HeadphonesIcon },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export const publicNavItems = [
  { label: "Home", href: "/" },
  { label: "About", href: "/about" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "Fees", href: "/fees" },
  { label: "Live Prices", href: "/live" },
  { label: "Support", href: "/support" },
];
