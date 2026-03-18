import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Timeline } from "@/components/shared/Timeline";
import { ProofImage } from "@/components/shared/ProofImage";
import { AdminNotes } from "@/components/admin/AdminNotes";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";
import { User, Receipt, Lock, CreditCard, MapPin, ChevronDown, CheckCircle, XCircle, Truck, Play } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type OrderStatus = Database["public"]["Enums"]["order_status"];

const ORDER_STATUSES: OrderStatus[] = [
  "draft", "rate_locked", "awaiting_payment", "payment_proof_uploaded",
  "under_review", "manual_review", "approved_for_settlement",
  "settlement_in_progress", "completed", "expired", "cancelled", "rejected",
];

const TERMINAL_STATUSES: OrderStatus[] = ["completed", "expired", "cancelled", "rejected"];

export default function AdminOrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [newStatus, setNewStatus] = useState<OrderStatus | "">("");
  const [statusNote, setStatusNote] = useState("");
  const [txHashInput, setTxHashInput] = useState("");
  const [settlementNotesInput, setSettlementNotesInput] = useState("");

  const { data: order, isLoading } = useQuery({
    queryKey: ["admin-order-detail", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("orders").select("*").eq("id", id!).single();
      if (error) throw error;
      const { data: profile } = await supabase.from("profiles").select("full_name, email").eq("id", data.user_id).single();
      const { data: kyc } = await supabase.from("kyc_submissions").select("status").eq("user_id", data.user_id).order("created_at", { ascending: false }).limit(1).maybeSingle();
      let rateLock = null;
      if (data.rate_lock_id) {
        const { data: rl } = await supabase.from("rate_locks").select("*").eq("id", data.rate_lock_id).single();
        rateLock = rl;
      }
      let payoutAddress = null;
      if (data.payout_address_id) {
        const { data: pa } = await supabase.from("payout_addresses").select("*").eq("id", data.payout_address_id).single();
        payoutAddress = pa;
      }
      return { ...data, profile, kyc, rateLock, payoutAddress };
    },
    enabled: !!id,
  });

  const { data: history = [] } = useQuery({
    queryKey: ["admin-order-history", id],
    queryFn: async () => {
      const { data } = await supabase.from("order_status_history").select("*").eq("order_id", id!).order("created_at", { ascending: true });
      return data || [];
    },
    enabled: !!id,
  });

  const { data: proofs = [] } = useQuery({
    queryKey: ["admin-order-proofs", id],
    queryFn: async () => {
      const { data } = await supabase.from("payment_proofs").select("*").eq("order_id", id!).order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!id,
  });

  const invalidateAll = () => {
    queryClient.invalidateQueries({ queryKey: ["admin-order-detail", id] });
    queryClient.invalidateQueries({ queryKey: ["admin-order-history", id] });
    queryClient.invalidateQueries({ queryKey: ["admin-order-proofs", id] });
  };

  const transitionMutation = useMutation({
    mutationFn: async ({ toStatus, note, txHash, notes }: { toStatus: OrderStatus; note?: string; txHash?: string; notes?: string }) => {
      const updates: Record<string, any> = { status: toStatus };
      if (txHash) updates.settlement_tx_hash = txHash;
      if (notes) updates.settlement_notes = notes;

      const { error } = await supabase.from("orders").update(updates).eq("id", id!);
      if (error) throw error;
      await supabase.from("order_status_history").insert({
        order_id: id!,
        old_status: order!.status,
        new_status: toStatus,
        actor_id: user!.id,
        actor_role: "admin",
        note: note || null,
      });
      await supabase.from("audit_logs").insert({
        action: "order_status_update",
        actor_user_id: user!.id,
        actor_role: "admin",
        target_type: "order",
        target_id: id!,
        metadata: { from: order!.status, to: toStatus, note: note || null },
      });
    },
    onSuccess: () => {
      invalidateAll();
      setNewStatus("");
      setStatusNote("");
      setTxHashInput("");
      setSettlementNotesInput("");
      toast({ title: "Order status updated" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const reviewProofMutation = useMutation({
    mutationFn: async ({ proofId, status }: { proofId: string; status: string }) => {
      const { error } = await supabase.from("payment_proofs").update({ status, reviewed_by: user!.id, reviewed_at: new Date().toISOString() }).eq("id", proofId);
      if (error) throw error;
      // Auto-advance: when approving proof and order is payment_proof_uploaded → approved_for_settlement
      if (status === "approved" && order && order.status === "payment_proof_uploaded") {
        await supabase.from("orders").update({ status: "approved_for_settlement" as any }).eq("id", id!);
        await supabase.from("order_status_history").insert({
          order_id: id!,
          old_status: order.status,
          new_status: "approved_for_settlement" as any,
          actor_id: user!.id,
          actor_role: "admin",
          note: "Payment proof approved — auto-advanced to settlement",
        });
      }
    },
    onSuccess: () => {
      invalidateAll();
      toast({ title: "Proof reviewed" });
    },
  });

  if (isLoading) {
    return <AdminLayout><div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div></AdminLayout>;
  }

  if (!order) {
    return <AdminLayout><div className="py-20 text-center"><p className="text-muted-foreground">Order not found.</p><Button asChild className="mt-4"><Link to="/admin/orders">Back</Link></Button></div></AdminLayout>;
  }

  const timelineSteps = history.map((h, i) => ({
    label: h.new_status.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()),
    timestamp: h.created_at,
    description: h.note || undefined,
    completed: true,
    active: i === history.length - 1,
  }));

  const isTerminal = TERMINAL_STATUSES.includes(order.status);
  const txHash = (order as any).settlement_tx_hash as string | null;
  const sNotes = (order as any).settlement_notes as string | null;

  // Contextual action buttons
  const renderActionButtons = () => {
    if (isTerminal) return <p className="text-sm text-muted-foreground">This order is in a terminal state.</p>;

    const status = order.status as OrderStatus;
    const isPending = transitionMutation.isPending;

    return (
      <div className="space-y-4">
        <div className="flex flex-wrap gap-2">
          {status === "payment_proof_uploaded" && (
            <Button onClick={() => transitionMutation.mutate({ toStatus: "approved_for_settlement", note: "Payment accepted by admin" })} disabled={isPending}>
              <CheckCircle className="mr-1 h-4 w-4" /> Accept Payment
            </Button>
          )}

          {status === "manual_review" && (
            <>
              <Button onClick={() => transitionMutation.mutate({ toStatus: "approved_for_settlement", note: "Manual review passed" })} disabled={isPending}>
                <CheckCircle className="mr-1 h-4 w-4" /> Approve
              </Button>
              <Button variant="destructive" onClick={() => transitionMutation.mutate({ toStatus: "rejected", note: "Rejected after manual review" })} disabled={isPending}>
                <XCircle className="mr-1 h-4 w-4" /> Reject
              </Button>
            </>
          )}

          {status === "under_review" && (
            <Button onClick={() => transitionMutation.mutate({ toStatus: "approved_for_settlement", note: "Review passed" })} disabled={isPending}>
              <CheckCircle className="mr-1 h-4 w-4" /> Approve
            </Button>
          )}

          {status === "approved_for_settlement" && (
            <div className="w-full space-y-3">
              <div className="grid gap-3 sm:grid-cols-2">
                <div>
                  <label className="text-sm font-medium">TX Hash {order.side === "buy" ? "(your outgoing crypto tx)" : "(user's incoming crypto tx)"}</label>
                  <Input className="mt-1 font-mono text-sm" placeholder="0x... or transaction hash" value={txHashInput} onChange={(e) => setTxHashInput(e.target.value)} />
                </div>
                <div>
                  <label className="text-sm font-medium">Settlement Notes</label>
                  <Textarea className="mt-1" rows={2} value={settlementNotesInput} onChange={(e) => setSettlementNotesInput(e.target.value)} placeholder="Optional notes..." />
                </div>
              </div>
              <Button onClick={() => transitionMutation.mutate({ toStatus: "settlement_in_progress", note: "Settlement started", txHash: txHashInput || undefined, notes: settlementNotesInput || undefined })} disabled={isPending}>
                <Play className="mr-1 h-4 w-4" /> Begin Settlement
              </Button>
            </div>
          )}

          {status === "settlement_in_progress" && (
            <div className="w-full space-y-3">
              {!txHash && (
                <div>
                  <label className="text-sm font-medium">TX Hash</label>
                  <Input className="mt-1 font-mono text-sm" placeholder="0x... or transaction hash" value={txHashInput} onChange={(e) => setTxHashInput(e.target.value)} />
                </div>
              )}
              <Button onClick={() => transitionMutation.mutate({ toStatus: "completed", note: "Settlement completed", txHash: txHashInput || undefined })} disabled={isPending}>
                <Truck className="mr-1 h-4 w-4" /> Mark Completed
              </Button>
            </div>
          )}

          {/* Cancel button for any non-terminal */}
          <Button variant="outline" className="text-destructive border-destructive/30" onClick={() => transitionMutation.mutate({ toStatus: "cancelled", note: "Cancelled by admin" })} disabled={isPending}>
            <XCircle className="mr-1 h-4 w-4" /> Cancel Order
          </Button>
        </div>
      </div>
    );
  };

  return (
    <AdminLayout>
      <PageHeader title={`Order — ${order.asset}/${order.network}`} description={`${order.profile?.full_name || "—"} (${order.profile?.email || "—"})`}>
        <StatusBadge status={order.status} />
      </PageHeader>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* User Card */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><User className="h-4 w-4" /> User</CardTitle>
          </CardHeader>
          <CardContent className="text-sm space-y-1">
            <p><span className="font-medium">Name:</span> {order.profile?.full_name || "—"}</p>
            <p><span className="font-medium">Email:</span> {order.profile?.email || "—"}</p>
            <div className="flex items-center gap-2">
              <span className="font-medium">KYC:</span>
              <StatusBadge status={order.kyc?.status || "not_submitted"} />
            </div>
            <Button variant="link" size="sm" className="p-0 h-auto" asChild>
              <Link to={`/admin/users/${order.user_id}`}>View User →</Link>
            </Button>
          </CardContent>
        </Card>

        {/* Order Summary */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><Receipt className="h-4 w-4" /> Order Summary</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid gap-2 sm:grid-cols-2 text-sm">
              <p><span className="font-medium">Side:</span> <Badge variant="outline" className="capitalize">{order.side}</Badge></p>
              <p><span className="font-medium">Asset:</span> {order.asset}</p>
              <p><span className="font-medium">Network:</span> {order.network}</p>
              <p><span className="font-medium">Type:</span> {order.order_type}</p>
              <p><span className="font-medium">Rate:</span> NPR {Number(order.final_rate_npr).toLocaleString()}</p>
              <p><span className="font-medium">Fees:</span> NPR {Number(order.fee_total_npr).toLocaleString()}</p>
              <p><span className="font-medium">Total Pay:</span> NPR {Number(order.total_pay_npr).toLocaleString()}</p>
              <p><span className="font-medium">Total Receive:</span> {Number(order.total_receive_crypto).toFixed(8)} {order.asset}</p>
              {order.requires_manual_review && <p className="text-destructive font-medium col-span-2">⚠ Requires Manual Review (Risk: {order.risk_score})</p>}
              <p className="text-muted-foreground"><span className="font-medium">Created:</span> {format(new Date(order.created_at), "PPp")}</p>
            </div>
          </CardContent>
        </Card>

        {/* Settlement Info */}
        {(txHash || sNotes) && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base">Settlement Info</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-2">
              {txHash && (
                <div>
                  <p className="text-muted-foreground text-xs font-medium">TX Hash</p>
                  <code className="text-sm break-all font-mono bg-muted px-2 py-1 rounded">{txHash}</code>
                </div>
              )}
              {sNotes && (
                <div>
                  <p className="text-muted-foreground text-xs font-medium">Notes</p>
                  <p>{sNotes}</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Pricing Snapshot */}
        {order.rateLock && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><Lock className="h-4 w-4" /> Rate Lock Snapshot</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-2 sm:grid-cols-2 text-sm">
                <p><span className="font-medium">Crypto USD:</span> ${Number(order.rateLock.crypto_usd_price).toLocaleString()}</p>
                <p><span className="font-medium">USD/NPR:</span> {Number(order.rateLock.usd_npr_rate).toLocaleString()}</p>
                <p><span className="font-medium">Base NPR:</span> {Number(order.rateLock.base_npr_price).toLocaleString()}</p>
                <p><span className="font-medium">Final Rate:</span> {Number(order.rateLock.final_rate_npr).toLocaleString()}</p>
                <p><span className="font-medium">Fees:</span> NPR {Number(order.rateLock.fees_npr).toLocaleString()}</p>
                <p><span className="font-medium">Payment:</span> {order.rateLock.payment_method?.replace(/_/g, " ") || "—"}</p>
                <p><span className="font-medium">Expires:</span> {format(new Date(order.rateLock.expires_at), "PPp")}</p>
                <p><span className="font-medium">Status:</span> {order.rateLock.status}</p>
              </div>
            </CardContent>
          </Card>
        )}

        {/* Payout Address */}
        {order.payoutAddress && (
          <Card>
            <CardHeader className="pb-3">
              <CardTitle className="text-base flex items-center gap-2"><MapPin className="h-4 w-4" /> Payout Address</CardTitle>
            </CardHeader>
            <CardContent className="text-sm space-y-1">
              <p><span className="font-medium">Label:</span> {order.payoutAddress.label}</p>
              <p><span className="font-medium">Address:</span> <code className="text-xs break-all">{order.payoutAddress.address}</code></p>
              <p><span className="font-medium">Network:</span> {order.payoutAddress.network}</p>
              {order.payoutAddress.destination_tag && <p><span className="font-medium">Tag:</span> {order.payoutAddress.destination_tag}</p>}
            </CardContent>
          </Card>
        )}

        {/* Timeline */}
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Timeline</CardTitle>
          </CardHeader>
          <CardContent>
            {timelineSteps.length === 0 ? (
              <p className="text-sm text-muted-foreground">No history yet.</p>
            ) : (
              <Timeline steps={timelineSteps} />
            )}
          </CardContent>
        </Card>

        {/* Notes */}
        <AdminNotes targetId={id!} targetType="order" />
      </div>

      {/* Quick Actions */}
      <Card className="mt-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Actions</CardTitle>
        </CardHeader>
        <CardContent>
          {renderActionButtons()}

          {/* Advanced: full dropdown override */}
          {!isTerminal && (
            <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen} className="mt-4">
              <CollapsibleTrigger asChild>
                <Button variant="ghost" size="sm" className="text-muted-foreground">
                  <ChevronDown className={`mr-1 h-3 w-3 transition-transform ${advancedOpen ? "rotate-180" : ""}`} />
                  Advanced Override
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="mt-3 space-y-4 border-t pt-4">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="text-sm font-medium">New Status</label>
                    <Select value={newStatus} onValueChange={(v) => setNewStatus(v as OrderStatus)}>
                      <SelectTrigger className="mt-1"><SelectValue placeholder="Select status" /></SelectTrigger>
                      <SelectContent>
                        {ORDER_STATUSES.map((s) => (
                          <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <label className="text-sm font-medium">Note</label>
                    <Textarea className="mt-1" rows={2} value={statusNote} onChange={(e) => setStatusNote(e.target.value)} placeholder="Optional note..." />
                  </div>
                </div>
                <Button onClick={() => { if (newStatus) transitionMutation.mutate({ toStatus: newStatus as OrderStatus, note: statusNote }); }} disabled={!newStatus || transitionMutation.isPending}>
                  {transitionMutation.isPending ? "Updating…" : "Force Update"}
                </Button>
              </CollapsibleContent>
            </Collapsible>
          )}
        </CardContent>
      </Card>

      {/* Payment Proofs */}
      <Card className="mt-6">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2"><CreditCard className="h-4 w-4" /> Payment Proofs</CardTitle>
        </CardHeader>
        <CardContent>
          {proofs.length === 0 ? (
            <p className="text-sm text-muted-foreground">No proofs uploaded yet.</p>
          ) : (
            <div className="space-y-4">
              {proofs.map((p) => (
                <div key={p.id} className="rounded border bg-muted/30 p-4 space-y-3">
                  <ProofImage filePath={p.file_path} fileName={p.file_name} />
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div className="text-sm">
                      <p className="font-medium">{p.file_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.reference_number && `Ref: ${p.reference_number} • `}
                        {format(new Date(p.created_at), "PPp")}
                      </p>
                      {p.notes && <p className="text-xs text-muted-foreground mt-1">{p.notes}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <StatusBadge status={p.status} />
                      {p.status === "pending" && (
                        <>
                          <Button size="sm" variant="default" onClick={() => reviewProofMutation.mutate({ proofId: p.id, status: "approved" })}>Approve</Button>
                          <Button size="sm" variant="destructive" onClick={() => reviewProofMutation.mutate({ proofId: p.id, status: "rejected" })}>Reject</Button>
                        </>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </AdminLayout>
  );
}
