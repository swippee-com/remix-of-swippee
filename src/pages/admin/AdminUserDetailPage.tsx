import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";
import { ArrowLeft, Eye, Mail, Phone, MapPin, Calendar, Shield, Wallet, CreditCard, ShoppingCart, MessageSquare } from "lucide-react";
import { AdminUserActions } from "@/components/admin/AdminUserActions";
import { AdminNotes } from "@/components/admin/AdminNotes";
import type { Database } from "@/integrations/supabase/types";

type KycStatus = Database["public"]["Enums"]["kyc_status"];

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();

  const { data: profile, isLoading } = useQuery({
    queryKey: ["admin-user-detail", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", id!).single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: roles = [] } = useQuery({
    queryKey: ["admin-user-roles", id],
    queryFn: async () => {
      const { data } = await supabase.from("user_roles").select("role").eq("user_id", id!);
      return (data || []).map((r) => r.role);
    },
    enabled: !!id,
  });

  const { data: kyc } = useQuery({
    queryKey: ["admin-user-kyc", id],
    queryFn: async () => {
      const { data } = await supabase.from("kyc_submissions").select("*").eq("user_id", id!).maybeSingle();
      return data;
    },
    enabled: !!id,
  });

  const { data: orders = [] } = useQuery({
    queryKey: ["admin-user-orders", id],
    queryFn: async () => {
      const { data } = await supabase.from("orders").select("*").eq("user_id", id!).order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!id,
  });

  const { data: wallet } = useQuery({
    queryKey: ["admin-user-wallet", id],
    queryFn: async () => {
      const { data } = await supabase.from("wallets").select("*").eq("user_id", id!).maybeSingle();
      return data;
    },
    enabled: !!id,
  });

  const { data: walletTxs = [] } = useQuery({
    queryKey: ["admin-user-wallet-txs", id],
    queryFn: async () => {
      if (!wallet?.id) return [];
      const { data } = await supabase.from("wallet_transactions").select("*").eq("wallet_id", wallet.id).order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!wallet?.id,
  });

  const { data: paymentMethods = [] } = useQuery({
    queryKey: ["admin-user-pm", id],
    queryFn: async () => {
      const { data } = await supabase.from("payment_methods").select("*").eq("user_id", id!).order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!id,
  });

  const { data: payoutAddresses = [] } = useQuery({
    queryKey: ["admin-user-payouts", id],
    queryFn: async () => {
      const { data } = await supabase.from("payout_addresses").select("*").eq("user_id", id!).order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!id,
  });

  const { data: tickets = [] } = useQuery({
    queryKey: ["admin-user-tickets", id],
    queryFn: async () => {
      const { data } = await supabase.from("support_tickets").select("*").eq("user_id", id!).order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!id,
  });

  const { data: loginEvents = [] } = useQuery({
    queryKey: ["admin-user-logins", id],
    queryFn: async () => {
      const { data } = await supabase.from("login_events").select("*").eq("user_id", id!).order("created_at", { ascending: false }).limit(10);
      return data || [];
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
      </AdminLayout>
    );
  }

  if (!profile) {
    return (
      <AdminLayout>
        <div className="py-20 text-center text-muted-foreground">User not found.</div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <div className="flex items-center gap-3 mb-2">
        <Button variant="ghost" size="sm" asChild><Link to="/admin/users"><ArrowLeft className="mr-1 h-4 w-4" /> Back</Link></Button>
      </div>
      <PageHeader title={profile.full_name || "Unnamed User"} description={`User ID: ${profile.id}`} />

      {/* Profile Summary Cards */}
      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardContent className="pt-6 space-y-2 text-sm">
            <div className="flex items-center gap-2 text-muted-foreground"><Mail className="h-4 w-4" /> {profile.email || "—"}</div>
            <div className="flex items-center gap-2 text-muted-foreground"><Phone className="h-4 w-4" /> {profile.phone || "—"}</div>
            <div className="flex items-center gap-2 text-muted-foreground"><MapPin className="h-4 w-4" /> {profile.country || "—"}</div>
            <div className="flex items-center gap-2 text-muted-foreground"><Calendar className="h-4 w-4" /> Joined {format(new Date(profile.created_at), "PP")}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Roles</CardTitle></CardHeader>
          <CardContent>
            <div className="flex gap-1.5 flex-wrap">
              {roles.map((r) => (
                <span key={r} className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-1 text-xs font-medium text-primary capitalize">{r}</span>
              ))}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">KYC Status</CardTitle></CardHeader>
          <CardContent>
            <StatusBadge status={kyc?.status || "not_submitted"} />
            {kyc?.full_legal_name && <p className="mt-2 text-sm text-muted-foreground">{kyc.full_legal_name}</p>}
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-sm font-medium text-muted-foreground">Wallet Balance</CardTitle></CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold">NPR {Number(wallet?.balance_npr ?? 0).toLocaleString()}</p>
          </CardContent>
        </Card>
      </div>

      {/* Admin Actions + Notes */}
      <div className="mt-6 grid gap-4 lg:grid-cols-2">
        <AdminUserActions
          userId={id!}
          roles={roles}
          kycStatus={(kyc?.status as KycStatus) || null}
          kycId={kyc?.id || null}
          isFrozen={(profile as any)?.is_frozen || false}
        />
        <AdminNotes targetId={id!} targetType="user" />
      </div>

      {/* Frozen banner */}
      {(profile as any)?.is_frozen && (
        <div className="mt-4 rounded-lg border border-destructive/30 bg-destructive/5 px-4 py-3 text-sm text-destructive flex items-center gap-2">
          <Shield className="h-4 w-4" />
          This account is currently frozen. The user cannot perform any transactions. Please contact support.
        </div>
      )}

      {/* Tabs */}
      <Tabs defaultValue="orders" className="mt-8">
        <TabsList className="w-full justify-start overflow-x-auto">
          <TabsTrigger value="orders"><ShoppingCart className="mr-1 h-3.5 w-3.5" /> Orders ({orders.length})</TabsTrigger>
          <TabsTrigger value="wallet"><Wallet className="mr-1 h-3.5 w-3.5" /> Wallet ({walletTxs.length})</TabsTrigger>
          <TabsTrigger value="payment"><CreditCard className="mr-1 h-3.5 w-3.5" /> Payment Methods ({paymentMethods.length})</TabsTrigger>
          <TabsTrigger value="payouts"><Shield className="mr-1 h-3.5 w-3.5" /> Payout Addresses ({payoutAddresses.length})</TabsTrigger>
          <TabsTrigger value="support"><MessageSquare className="mr-1 h-3.5 w-3.5" /> Support ({tickets.length})</TabsTrigger>
          <TabsTrigger value="kyc">KYC Details</TabsTrigger>
          <TabsTrigger value="logins">Login History</TabsTrigger>
        </TabsList>

        {/* Orders Tab */}
        <TabsContent value="orders">
          <DataTable
            empty="No orders."
            headers={["Side", "Asset", "Amount (NPR)", "Rate", "Status", "Date", ""]}
            rows={orders.map((o: any) => [
              <span className="capitalize">{o.side}</span>,
              o.asset,
              `NPR ${Number(o.total_pay_npr).toLocaleString()}`,
              Number(o.final_rate_npr).toLocaleString(),
              <StatusBadge status={o.status} />,
              format(new Date(o.created_at), "PP"),
              <Button variant="ghost" size="sm" asChild><Link to={`/admin/orders/${o.id}`}><Eye className="h-3 w-3" /></Link></Button>,
            ])}
          />
        </TabsContent>

        {/* Wallet Transactions Tab */}
        <TabsContent value="wallet">
          <DataTable
            empty="No wallet transactions."
            headers={["Type", "Amount", "Status", "Balance After", "Date", "Description"]}
            rows={walletTxs.map((tx: any) => [
              <span className="capitalize">{tx.type.replace(/_/g, " ")}</span>,
              `NPR ${Number(tx.amount).toLocaleString()}`,
              <StatusBadge status={tx.status} />,
              tx.balance_after != null ? `NPR ${Number(tx.balance_after).toLocaleString()}` : "—",
              format(new Date(tx.created_at), "PPp"),
              tx.description || "—",
            ])}
          />
        </TabsContent>

        {/* Payment Methods Tab */}
        <TabsContent value="payment">
          <div className="grid gap-3 sm:grid-cols-2">
            {paymentMethods.length === 0 && <p className="col-span-2 py-8 text-center text-sm text-muted-foreground">No payment methods.</p>}
            {paymentMethods.map((pm: any) => (
              <Card key={pm.id}>
                <CardContent className="pt-6 space-y-1 text-sm">
                  <div className="flex items-center justify-between">
                    <span className="font-medium">{pm.label}</span>
                    <span className="capitalize text-xs text-muted-foreground">{pm.payment_type.replace(/_/g, " ")}</span>
                  </div>
                  <p className="text-muted-foreground">{pm.account_holder_name}</p>
                  {pm.bank_name && <p className="text-muted-foreground">{pm.bank_name} — {pm.account_number}</p>}
                  {pm.is_default && <span className="inline-block rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">Default</span>}
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Payout Addresses Tab */}
        <TabsContent value="payouts">
          <DataTable
            empty="No payout addresses."
            headers={["Label", "Asset", "Network", "Address", "Verified", "Whitelisted"]}
            rows={payoutAddresses.map((a: any) => [
              a.label,
              a.asset,
              a.network,
              <span className="font-mono text-xs break-all max-w-[200px] inline-block">{a.address}</span>,
              a.is_verified ? "✓" : "✗",
              a.is_whitelisted ? "✓" : "✗",
            ])}
          />
        </TabsContent>

        {/* Support Tickets Tab */}
        <TabsContent value="support">
          <DataTable
            empty="No support tickets."
            headers={["Subject", "Category", "Status", "Created", "Updated"]}
            rows={tickets.map((t: any) => [
              t.subject,
              t.category || "—",
              <StatusBadge status={t.status} />,
              format(new Date(t.created_at), "PP"),
              format(new Date(t.updated_at), "PP"),
            ])}
          />
        </TabsContent>

        {/* KYC Details Tab */}
        <TabsContent value="kyc">
          {!kyc ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No KYC submission.</p>
          ) : (
            <Card>
              <CardContent className="pt-6 grid gap-4 sm:grid-cols-2 text-sm">
                <DetailRow label="Full Legal Name" value={kyc.full_legal_name} />
                <DetailRow label="Date of Birth" value={kyc.date_of_birth} />
                <DetailRow label="Nationality" value={kyc.nationality} />
                <DetailRow label="ID Type" value={kyc.id_type} />
                <DetailRow label="ID Number" value={kyc.id_number} />
                <DetailRow label="Phone" value={kyc.phone} />
                <DetailRow label="Occupation" value={kyc.occupation} />
                <DetailRow label="Source of Funds" value={kyc.source_of_funds} />
                <DetailRow label="Address" value={[kyc.address_line_1, kyc.address_line_2, kyc.city, kyc.postal_code].filter(Boolean).join(", ")} />
                <DetailRow label="Country" value={kyc.country} />
                <DetailRow label="Expected Monthly Volume" value={kyc.expected_monthly_volume || "—"} />
                <DetailRow label="Status" value={kyc.status.replace(/_/g, " ")} />
                <DetailRow label="Submitted" value={format(new Date(kyc.created_at), "PPp")} />
                {kyc.reviewed_at && <DetailRow label="Reviewed" value={format(new Date(kyc.reviewed_at), "PPp")} />}
                {kyc.admin_notes && <div className="sm:col-span-2"><DetailRow label="Admin Notes" value={kyc.admin_notes} /></div>}
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Login History Tab */}
        <TabsContent value="logins">
          <DataTable
            empty="No login events."
            headers={["Date", "IP Address", "Method", "City", "Country", "User Agent"]}
            rows={loginEvents.map((e: any) => [
              format(new Date(e.created_at), "PPp"),
              e.ip_address || "—",
              e.login_method || "—",
              e.city || "—",
              e.country || "—",
              <span className="max-w-[200px] inline-block truncate text-xs">{e.user_agent || "—"}</span>,
            ])}
          />
        </TabsContent>
      </Tabs>
    </AdminLayout>
  );
}

/* Reusable mini table */
function DataTable({ headers, rows, empty }: { headers: string[]; rows: React.ReactNode[][]; empty: string }) {
  if (rows.length === 0) return <p className="py-8 text-center text-sm text-muted-foreground">{empty}</p>;
  return (
    <div className="rounded-lg border bg-card shadow-card overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/50">
            {headers.map((h) => <th key={h} className="px-4 py-3 text-left font-medium text-muted-foreground">{h}</th>)}
          </tr>
        </thead>
        <tbody className="divide-y">
          {rows.map((row, i) => (
            <tr key={i} className="hover:bg-muted/30 transition-colors">
              {row.map((cell, j) => <td key={j} className="px-4 py-3">{cell}</td>)}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-0.5 capitalize">{value}</p>
    </div>
  );
}
