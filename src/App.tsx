import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

// Public
import Landing from "./pages/Landing";
import About from "./pages/About";
import HowItWorks from "./pages/HowItWorks";
import Fees from "./pages/Fees";
import Support from "./pages/Support";
import NotFound from "./pages/NotFound";

// Auth
import Login from "./pages/auth/Login";
import Signup from "./pages/auth/Signup";

// Dashboard
import DashboardOverview from "./pages/dashboard/DashboardOverview";
import KycPage from "./pages/dashboard/KycPage";
import QuotesPage from "./pages/dashboard/QuotesPage";
import NewQuotePage from "./pages/dashboard/NewQuotePage";
import TradesPage from "./pages/dashboard/TradesPage";
import PaymentMethodsPage from "./pages/dashboard/PaymentMethodsPage";
import PayoutAddressesPage from "./pages/dashboard/PayoutAddressesPage";
import SupportDashboardPage from "./pages/dashboard/SupportDashboardPage";
import SettingsPage from "./pages/dashboard/SettingsPage";

// Admin
import AdminOverview from "./pages/admin/AdminOverview";
import AdminUsersPage from "./pages/admin/AdminUsersPage";
import AdminKycPage from "./pages/admin/AdminKycPage";
import AdminQuotesPage from "./pages/admin/AdminQuotesPage";
import AdminTradesPage from "./pages/admin/AdminTradesPage";
import AdminLedgerPage from "./pages/admin/AdminLedgerPage";
import AdminAuditLogsPage from "./pages/admin/AdminAuditLogsPage";
import AdminSupportPage from "./pages/admin/AdminSupportPage";
import AdminSettingsPage from "./pages/admin/AdminSettingsPage";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Landing />} />
          <Route path="/about" element={<About />} />
          <Route path="/how-it-works" element={<HowItWorks />} />
          <Route path="/fees" element={<Fees />} />
          <Route path="/support" element={<Support />} />

          {/* Auth */}
          <Route path="/auth/login" element={<Login />} />
          <Route path="/auth/signup" element={<Signup />} />

          {/* User Dashboard */}
          <Route path="/dashboard" element={<DashboardOverview />} />
          <Route path="/dashboard/kyc" element={<KycPage />} />
          <Route path="/dashboard/quotes" element={<QuotesPage />} />
          <Route path="/dashboard/quotes/new" element={<NewQuotePage />} />
          <Route path="/dashboard/trades" element={<TradesPage />} />
          <Route path="/dashboard/payment-methods" element={<PaymentMethodsPage />} />
          <Route path="/dashboard/payout-addresses" element={<PayoutAddressesPage />} />
          <Route path="/dashboard/support" element={<SupportDashboardPage />} />
          <Route path="/dashboard/settings" element={<SettingsPage />} />

          {/* Admin */}
          <Route path="/admin" element={<AdminOverview />} />
          <Route path="/admin/users" element={<AdminUsersPage />} />
          <Route path="/admin/kyc" element={<AdminKycPage />} />
          <Route path="/admin/quotes" element={<AdminQuotesPage />} />
          <Route path="/admin/trades" element={<AdminTradesPage />} />
          <Route path="/admin/ledger" element={<AdminLedgerPage />} />
          <Route path="/admin/audit-logs" element={<AdminAuditLogsPage />} />
          <Route path="/admin/support" element={<AdminSupportPage />} />
          <Route path="/admin/settings" element={<AdminSettingsPage />} />

          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
