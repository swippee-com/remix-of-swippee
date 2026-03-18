import {
  LayoutDashboard, Shield, CreditCard, Wallet, FileText, ArrowLeftRight,
  HeadphonesIcon, Settings, Users, ClipboardCheck, BookOpen, ScrollText,
  Activity, BarChart3, WalletCards, PieChart, Megaphone, ShoppingCart
} from "lucide-react";
import type { TranslationKey } from "@/i18n/en";

export const userNavItems: { labelKey: TranslationKey; href: string; icon: typeof LayoutDashboard }[] = [
  { labelKey: "nav.overview", href: "/dashboard", icon: LayoutDashboard },
  { labelKey: "nav.wallet", href: "/dashboard/wallet", icon: WalletCards },
  { labelKey: "nav.portfolio", href: "/dashboard/portfolio", icon: PieChart },
  { labelKey: "nav.kyc", href: "/dashboard/kyc", icon: Shield },
  { labelKey: "nav.quotes", href: "/dashboard/quotes", icon: FileText },
  { labelKey: "nav.trades", href: "/dashboard/trades", icon: ArrowLeftRight },
  { labelKey: "nav.paymentMethods", href: "/dashboard/payment-methods", icon: CreditCard },
  { labelKey: "nav.payoutAddresses", href: "/dashboard/payout-addresses", icon: Wallet },
  { labelKey: "nav.support", href: "/dashboard/support", icon: HeadphonesIcon },
  { labelKey: "nav.settings", href: "/dashboard/settings", icon: Settings },
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
  { label: "Ads", href: "/admin/ads", icon: Megaphone },
  { label: "Support", href: "/admin/support", icon: HeadphonesIcon },
  { label: "Settings", href: "/admin/settings", icon: Settings },
];

export const publicNavItems = [
  { label: "Home", href: "/" },
  { label: "Trade", href: "/trade" },
  { label: "About", href: "/about" },
  { label: "How It Works", href: "/how-it-works" },
  { label: "Fees", href: "/fees" },
  { label: "Live Prices", href: "/live" },
  { label: "Support", href: "/support" },
];
