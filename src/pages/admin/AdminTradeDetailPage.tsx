import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Timeline } from "@/components/shared/Timeline";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useState, useEffect } from "react";
import { toast } from "@/hooks/use-toast";
import type { Database } from "@/integrations/supabase/types";

type TradeStatus = Database["public"]["Enums"]["trade_status"];

const statusOptions: TradeStatus[] = [
  "pending_settlement", "awaiting_fiat_payment", "payment_proof_uploaded",
  "fiat_received", "awaiting_crypto_transfer", "crypto_received",
  "ready_to_release", "completed", "disputed", "cancelled", "failed",
];

export default function AdminTradeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [newStatus, setNewStatus] = useState<TradeStatus | "">("");
  const [statusNote, setStatusNote] = useState("");
  const [settlementNotes, setSettlementNotes] = useState("");
  const [proofUrls, setProofUrls] = useState<Record<string, string>>({});

  const { data: trade, isLoading } = useQuery({
    queryKey: ["admin-trade-detail", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("otc_trades").select("*").eq("id", id!).single();
      if (error) throw error;
      const { data: profile } = await supabase.from("profiles").select("full_name, email").eq("id", data.user_id).single();
      return { ...data, profile };
    },
    enabled: !!id,
  });

  const { data: history = [] } = useQuery({
    queryKey: ["admin-trade-history", id],
    queryFn: async () => {
      const { data } = await supabase.from("trade_status_history").select("*").eq("trade_id", id!).order("created_at", { ascending: true });
      return data || [];
    },
    enabled: !!id,
  });

  const { data: proofs = [] } = useQuery({
    queryKey: ["admin-trade-proofs", id],
    queryFn: async () => {
      const { data } = await supabase.from("payment_proofs").select("*").eq("trade_id", id!).order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!id,
  });

  const updateStatusMutation = useMutation({
    mutationFn: async () => {
      if (!newStatus) throw new Error("Select a status.");
      const { error } = await supabase.from("otc_trades").update({ status: newStatus, settlement_notes: settlementNotes || trade?.settlement_notes || null }).eq("id", id!);
      if (error) throw error;
      await supabase.from("trade_status_history").insert({
        trade_id: id!,
        from_status: trade!.status,
        to_status: newStatus,
        changed_by: user!.id,
        note: statusNote || null,
      });
      await supabase.from("audit_logs").insert({
        action: "trade_status_update",
        actor_user_id: user!.id,
        actor_role: "admin",
        target_type: "otc_trade",
        target_id: id!,
        metadata: { from: trade!.status, to: newStatus, note: statusNote || null },
      });
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-trade-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["admin-trade-history", id] });
      setNewStatus("");
      setStatusNote("");
      toast({ title: "Trade status updated" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const reviewProofMutation = useMutation({
    mutationFn: async ({ proofId, status }: { proofId: string; status: string }) => {
      const { error } = await supabase.from("payment_proofs").update({ status, reviewed_by: user!.id, reviewed_at: new Date().toISOString() }).eq("id", proofId);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-trade-proofs", id] });
      toast({ title: "Proof reviewed" });
    },
  });

  useEffect(() => {
    if (proofs.length === 0) return;
    const fetchUrls = async () => {
      const urls: Record<string, string> = {};
      await Promise.all(
        proofs.map(async (p) => {
          const { data } = await supabase.storage.from("payment-proofs").createSignedUrl(p.file_path, 3600);
          if (data?.signedUrl) urls[p.id] = data.signedUrl;
        })
      );
      setProofUrls(urls);
    };
    fetchUrls();
  }, [proofs]);

  if (isLoading) {
    return <AdminLayout><div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div></AdminLayout>;
  }

  if (!trade) {
    return <AdminLayout><div className="py-20 text-center"><p className="text-muted-foreground">Trade not found.</p><Button asChild className="mt-4"><Link to="/admin/trades">Back</Link></Button></div></AdminLayout>;
  }

  const timelineSteps = history.map((h, i) => ({
    label: h.to_status.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()),
    timestamp: h.created_at,
    description: h.note || undefined,
    completed: true,
    active: i === history.length - 1,
  }));

  return (
    <AdminLayout>
      <PageHeader title={`Trade — ${trade.asset}`} description={`${trade.profile?.full_name || "—"} (${trade.profile?.email || "—"})`}>
        <StatusBadge status={trade.status} />
      </PageHeader>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border bg-card p-6 shadow-card space-y-3">
          <h3 className="font-semibold">Trade Info</h3>
          <div className="grid gap-2 sm:grid-cols-2 text-sm">
            <p><span className="font-medium">Side:</span> {trade.side}</p>
            <p><span className="font-medium">Asset:</span> {trade.asset}</p>
            <p><span className="font-medium">Network:</span> {trade.network}</p>
            <p><span className="font-medium">Gross:</span> {trade.gross_amount}</p>
            <p><span className="font-medium">Fee:</span> {trade.fee_amount}</p>
            <p><span className="font-medium">Net:</span> {trade.net_amount}</p>
            <p><span className="font-medium">Rate:</span> {Number(trade.quoted_rate).toLocaleString()} {trade.fiat_currency}</p>
            <p><span className="font-medium">Created:</span> {format(new Date(trade.created_at), "PPp")}</p>
          </div>
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-card">
          <h3 className="font-semibold mb-3">Timeline</h3>
          {timelineSteps.length === 0 ? (
            <p className="text-sm text-muted-foreground">No history yet.</p>
          ) : (
            <Timeline steps={timelineSteps} />
          )}
        </div>
      </div>

      {/* Update Status */}
      <div className="mt-6 rounded-lg border bg-card p-6 shadow-card space-y-4">
        <h3 className="font-semibold">Update Status</h3>
        <div className="grid gap-4 sm:grid-cols-2">
          <div>
            <label className="text-sm font-medium">New Status</label>
            <Select value={newStatus} onValueChange={(v) => setNewStatus(v as TradeStatus)}>
              <SelectTrigger className="mt-1"><SelectValue placeholder="Select status" /></SelectTrigger>
              <SelectContent>
                {statusOptions.map((s) => <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm font-medium">Note</label>
            <Textarea className="mt-1" rows={2} value={statusNote} onChange={(e) => setStatusNote(e.target.value)} placeholder="Optional note..." />
          </div>
        </div>
        <div>
          <label className="text-sm font-medium">Settlement Notes</label>
          <Textarea className="mt-1" rows={2} value={settlementNotes || trade.settlement_notes || ""} onChange={(e) => setSettlementNotes(e.target.value)} />
        </div>
        <Button onClick={() => updateStatusMutation.mutate()} disabled={!newStatus || updateStatusMutation.isPending}>
          {updateStatusMutation.isPending ? "Updating…" : "Update Status"}
        </Button>
      </div>

      {/* Payment Proofs */}
      <div className="mt-6 rounded-lg border bg-card p-6 shadow-card">
        <h3 className="font-semibold mb-3">Payment Proofs</h3>
        {proofs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No proofs uploaded yet.</p>
        ) : (
          <div className="space-y-3">
            {proofs.map((p) => (
              <div key={p.id} className="flex flex-col sm:flex-row sm:items-center justify-between rounded bg-muted/50 p-3 gap-2">
                <div className="text-sm">
                  <a href={getProofUrl(p.file_path)} target="_blank" rel="noopener noreferrer" className="font-medium underline">{p.file_name}</a>
                  <p className="text-xs text-muted-foreground">{p.reference_number && `Ref: ${p.reference_number} • `}{format(new Date(p.created_at), "PPp")}</p>
                  {p.notes && <p className="text-xs text-muted-foreground mt-1">{p.notes}</p>}
                </div>
                <div className="flex items-center gap-2">
                  <StatusBadge status={p.status} />
                  {p.status === "pending" && (
                    <>
                      <Button size="sm" variant="success" onClick={() => reviewProofMutation.mutate({ proofId: p.id, status: "approved" })}>Approve</Button>
                      <Button size="sm" variant="destructive" onClick={() => reviewProofMutation.mutate({ proofId: p.id, status: "rejected" })}>Reject</Button>
                    </>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
