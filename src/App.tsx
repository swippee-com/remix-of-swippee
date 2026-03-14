import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/contexts/AuthContext";
import { LanguageProvider } from "@/contexts/LanguageContext";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { AdminRoute } from "@/components/auth/AdminRoute";
import { useLoginTracker } from "@/hooks/use-login-tracker";
import { WagmiProvider } from "wagmi";
import { RainbowKitProvider, darkTheme, lightTheme } from "@rainbow-me/rainbowkit";
import { wagmiConfig } from "@/config/wagmi";
import "@rainbow-me/rainbowkit/styles.css";

// Public
import Landing from "./pages/Landing";
import About from "./pages/About";
import HowItWorks from "./pages/HowItWorks";
import Fees from "./pages/Fees";
import Support from "./pages/Support";
import LivePrices from "./pages/LivePrices";
import NotFound from "./pages/NotFound";

// Auth
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";
import ForgotPassword from "./pages/auth/ForgotPassword";
import ResetPassword from "./pages/auth/ResetPassword";

// Dashboard
import DashboardOverview from "./pages/dashboard/DashboardOverview";
import KycPage from "./pages/dashboard/KycPage";
import QuotesPage from "./pages/dashboard/QuotesPage";
import NewQuotePage from "./pages/dashboard/NewQuotePage";
import QuoteDetailPage from "./pages/dashboard/QuoteDetailPage";
import TradesPage from "./pages/dashboard/TradesPage";
import TradeDetailPage from "./pages/dashboard/TradeDetailPage";
import PaymentMethodsPage from "./pages/dashboard/PaymentMethodsPage";
import PayoutAddressesPage from "./pages/dashboard/PayoutAddressesPage";
import SupportDashboardPage from "./pages/dashboard/SupportDashboardPage";
import SettingsPage from "./pages/dashboard/SettingsPage";
import WalletPage from "./pages/dashboard/WalletPage";
import PortfolioPage from "./pages/dashboard/PortfolioPage";

// Admin
import AdminOverview from "./pages/admin/AdminOverview";
import AdminAnalyticsPage from "./pages/admin/AdminAnalyticsPage";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminUserDetailPage from "./pages/admin/AdminUserDetailPage";
import AdminKycPage from "./pages/admin/AdminKycPage";
import AdminQuotesPage from "./pages/admin/AdminQuotesPage";
import AdminQuoteDetailPage from "./pages/admin/AdminQuoteDetailPage";
import AdminTradesPage from "./pages/admin/AdminTradesPage";
import AdminTradeDetailPage from "./pages/admin/AdminTradeDetailPage";
import AdminLedgerPage from "./pages/admin/AdminLedgerPage";
import AdminAuditLogsPage from "./pages/admin/AdminAuditLogsPage";
import AdminSupportPage from "./pages/admin/AdminSupportPage";
import AdminSettingsPage from "./pages/admin/AdminSettingsPage";
import AdminWalletPage from "./pages/admin/AdminWalletPage";
import AdminAdsPage from "./pages/admin/AdminAdsPage";

const queryClient = new QueryClient();

function LoginTrackerWrapper() {
  useLoginTracker();
  return null;
}

const App = () => (
  <WagmiProvider config={wagmiConfig}>
    <QueryClientProvider client={queryClient}>
      <RainbowKitProvider theme={lightTheme({ accentColor: "hsl(240 6% 10%)", accentColorForeground: "white", borderRadius: "medium" })}>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <AuthProvider>
              <LanguageProvider>
          <LoginTrackerWrapper />
          <Routes>
            {/* Public */}
            <Route path="/" element={<Landing />} />
            <Route path="/about" element={<About />} />
            <Route path="/how-it-works" element={<HowItWorks />} />
            <Route path="/fees" element={<Fees />} />
            <Route path="/support" element={<Support />} />
            <Route path="/live" element={<LivePrices />} />

            {/* Auth */}
            <Route path="/auth/login" element={<Login />} />
            <Route path="/auth/signup" element={<Signup />} />
            <Route path="/auth/forgot-password" element={<ForgotPassword />} />
            <Route path="/reset-password" element={<ResetPassword />} />

            {/* User Dashboard — Protected */}
            <Route path="/dashboard" element={<ProtectedRoute><DashboardOverview /></ProtectedRoute>} />
            <Route path="/dashboard/kyc" element={<ProtectedRoute><KycPage /></ProtectedRoute>} />
            <Route path="/dashboard/quotes" element={<ProtectedRoute><QuotesPage /></ProtectedRoute>} />
            <Route path="/dashboard/quotes/new" element={<ProtectedRoute><NewQuotePage /></ProtectedRoute>} />
            <Route path="/dashboard/quotes/:id" element={<ProtectedRoute><QuoteDetailPage /></ProtectedRoute>} />
            <Route path="/dashboard/trades" element={<ProtectedRoute><TradesPage /></ProtectedRoute>} />
            <Route path="/dashboard/wallet" element={<ProtectedRoute><WalletPage /></ProtectedRoute>} />
            <Route path="/dashboard/portfolio" element={<ProtectedRoute><PortfolioPage /></ProtectedRoute>} />
            <Route path="/dashboard/trades/:id" element={<ProtectedRoute><TradeDetailPage /></ProtectedRoute>} />
            <Route path="/dashboard/payment-methods" element={<ProtectedRoute><PaymentMethodsPage /></ProtectedRoute>} />
            <Route path="/dashboard/payout-addresses" element={<ProtectedRoute><PayoutAddressesPage /></ProtectedRoute>} />
            <Route path="/dashboard/support" element={<ProtectedRoute><SupportDashboardPage /></ProtectedRoute>} />
            <Route path="/dashboard/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />

            {/* Admin — Protected + Admin Role */}
            <Route path="/admin" element={<AdminRoute><AdminOverview /></AdminRoute>} />
            <Route path="/admin/analytics" element={<AdminRoute><AdminAnalyticsPage /></AdminRoute>} />
            <Route path="/admin/users" element={<AdminRoute><AdminUsersPage /></AdminRoute>} />
            <Route path="/admin/users/:id" element={<AdminRoute><AdminUserDetailPage /></AdminRoute>} />
            <Route path="/admin/kyc" element={<AdminRoute><AdminKycPage /></AdminRoute>} />
            <Route path="/admin/quotes" element={<AdminRoute><AdminQuotesPage /></AdminRoute>} />
            <Route path="/admin/quotes/:id" element={<AdminRoute><AdminQuoteDetailPage /></AdminRoute>} />
            <Route path="/admin/trades" element={<AdminRoute><AdminTradesPage /></AdminRoute>} />
            <Route path="/admin/trades/:id" element={<AdminRoute><AdminTradeDetailPage /></AdminRoute>} />
            <Route path="/admin/ledger" element={<AdminRoute><AdminLedgerPage /></AdminRoute>} />
            <Route path="/admin/audit-logs" element={<AdminRoute><AdminAuditLogsPage /></AdminRoute>} />
            <Route path="/admin/support" element={<AdminRoute><AdminSupportPage /></AdminRoute>} />
            <Route path="/admin/settings" element={<AdminRoute><AdminSettingsPage /></AdminRoute>} />
            <Route path="/admin/wallets" element={<AdminRoute><AdminWalletPage /></AdminRoute>} />

            <Route path="*" element={<NotFound />} />
          </Routes>
              </LanguageProvider>
            </AuthProvider>
          </BrowserRouter>
        </TooltipProvider>
      </RainbowKitProvider>
    </QueryClientProvider>
  </WagmiProvider>
);

export default App;
