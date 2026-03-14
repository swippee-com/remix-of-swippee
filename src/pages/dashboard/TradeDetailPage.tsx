import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Timeline } from "@/components/shared/Timeline";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Upload } from "lucide-react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { useState, useRef } from "react";
import { toast } from "@/hooks/use-toast";

export default function TradeDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [refNumber, setRefNumber] = useState("");
  const [proofNotes, setProofNotes] = useState("");

  const { data: trade, isLoading } = useQuery({
    queryKey: ["trade-detail", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("otc_trades")
        .select("*")
        .eq("id", id!)
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id && !!user,
  });

  const { data: history = [] } = useQuery({
    queryKey: ["trade-history", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("trade_status_history")
        .select("*")
        .eq("trade_id", id!)
        .order("created_at", { ascending: true });
      return data || [];
    },
    enabled: !!id,
  });

  const { data: proofs = [] } = useQuery({
    queryKey: ["trade-proofs", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("payment_proofs")
        .select("*")
        .eq("trade_id", id!)
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return data || [];
    },
    enabled: !!id && !!user,
  });

  const uploadMutation = useMutation({
    mutationFn: async () => {
      const file = fileRef.current?.files?.[0];
      if (!file) throw new Error("Please select a file.");
      const ext = file.name.split(".").pop();
      const path = `${user!.id}/${id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("payment-proofs").upload(path, file);
      if (upErr) throw upErr;
      const { error } = await supabase.from("payment_proofs").insert({
        trade_id: id!,
        user_id: user!.id,
        file_name: file.name,
        file_path: path,
        reference_number: refNumber || null,
        notes: proofNotes || null,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["trade-proofs", id] });
      setRefNumber("");
      setProofNotes("");
      if (fileRef.current) fileRef.current.value = "";
      toast({ title: "Payment proof uploaded" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  if (isLoading) {
    return <DashboardLayout><div className="flex justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div></DashboardLayout>;
  }

  if (!trade) {
    return <DashboardLayout><div className="py-20 text-center"><p className="text-muted-foreground">Trade not found.</p><Button asChild className="mt-4"><Link to="/dashboard/trades">Back to Trades</Link></Button></div></DashboardLayout>;
  }

  const timelineItems = history.map((h) => ({
    label: h.to_status.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    date: format(new Date(h.created_at), "PPp"),
    description: h.note || undefined,
  }));

  const showUpload = ["awaiting_fiat_payment", "pending_settlement"].includes(trade.status);

  return (
    <DashboardLayout>
      <PageHeader title={`Trade — ${trade.asset}`} description={`${trade.side.toUpperCase()} ${trade.gross_amount} ${trade.asset}`}>
        <StatusBadge status={trade.status} />
      </PageHeader>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <div className="rounded-lg border bg-card p-6 shadow-card space-y-3">
          <h3 className="font-semibold">Trade Info</h3>
          <div className="grid gap-2 sm:grid-cols-2 text-sm">
            <p><span className="font-medium">Side:</span> {trade.side}</p>
            <p><span className="font-medium">Asset:</span> {trade.asset}</p>
            <p><span className="font-medium">Network:</span> {trade.network}</p>
            <p><span className="font-medium">Gross Amount:</span> {trade.gross_amount}</p>
            <p><span className="font-medium">Fee:</span> {trade.fee_amount}</p>
            <p><span className="font-medium">Net Amount:</span> {trade.net_amount}</p>
            <p><span className="font-medium">Rate:</span> {Number(trade.quoted_rate).toLocaleString()} {trade.fiat_currency}</p>
            <p><span className="font-medium">Created:</span> {format(new Date(trade.created_at), "PPp")}</p>
          </div>
          {trade.settlement_notes && (
            <div className="mt-2 rounded bg-muted/50 p-3 text-sm">
              <p className="font-medium text-xs text-muted-foreground mb-1">Settlement Notes</p>
              <p>{trade.settlement_notes}</p>
            </div>
          )}
        </div>

        <div className="rounded-lg border bg-card p-6 shadow-card">
          <h3 className="font-semibold mb-3">Status Timeline</h3>
          {timelineItems.length === 0 ? (
            <p className="text-sm text-muted-foreground">No status history yet.</p>
          ) : (
            <Timeline items={timelineItems} />
          )}
        </div>
      </div>

      {/* Payment Proofs */}
      <div className="mt-6 rounded-lg border bg-card p-6 shadow-card">
        <h3 className="font-semibold mb-3">Payment Proofs</h3>
        {proofs.length > 0 && (
          <div className="space-y-2 mb-4">
            {proofs.map((p) => (
              <div key={p.id} className="flex items-center justify-between rounded bg-muted/50 p-3 text-sm">
                <div>
                  <p className="font-medium">{p.file_name}</p>
                  <p className="text-xs text-muted-foreground">{p.reference_number && `Ref: ${p.reference_number} • `}{format(new Date(p.created_at), "PPp")}</p>
                </div>
                <StatusBadge status={p.status} />
              </div>
            ))}
          </div>
        )}
        {showUpload && (
          <form onSubmit={(e) => { e.preventDefault(); uploadMutation.mutate(); }} className="space-y-3">
            <div className="rounded-lg border-2 border-dashed bg-muted/30 p-4 text-center">
              <Upload className="mx-auto h-5 w-5 text-muted-foreground" />
              <p className="mt-1 text-sm font-medium">Upload Payment Proof</p>
              <input ref={fileRef} type="file" className="mt-2 text-xs" accept="image/*,.pdf" />
            </div>
            <Input placeholder="Reference number (optional)" value={refNumber} onChange={(e) => setRefNumber(e.target.value)} />
            <Textarea placeholder="Notes (optional)" rows={2} value={proofNotes} onChange={(e) => setProofNotes(e.target.value)} />
            <Button type="submit" disabled={uploadMutation.isPending} size="sm">
              {uploadMutation.isPending ? "Uploading…" : "Submit Proof"}
            </Button>
          </form>
        )}
      </div>
    </DashboardLayout>
  );
}
