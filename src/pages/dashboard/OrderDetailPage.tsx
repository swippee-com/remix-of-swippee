import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { ProofImage } from "@/components/shared/ProofImage";
import { Timeline } from "@/components/shared/Timeline";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Upload, ArrowLeft, HeadphonesIcon, ExternalLink } from "lucide-react";
import { useParams, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useFormattedDate } from "@/hooks/use-formatted-date";
import { useState, useRef } from "react";
import { toast } from "@/hooks/use-toast";
import { useRealtimeInvalidation } from "@/hooks/use-realtime";
import { cn } from "@/lib/utils";
import { useIsMobile } from "@/hooks/use-mobile";
import { PricingExplainer } from "@/components/trade/PricingExplainer";
import type { Tables } from "@/integrations/supabase/types";

type Order = Tables<"orders">;
type RateLock = Tables<"rate_locks">;

export default function OrderDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { formatDate } = useFormattedDate();
  const queryClient = useQueryClient();
  const isMobile = useIsMobile();
  const fileRef = useRef<HTMLInputElement>(null);
  const [refNumber, setRefNumber] = useState("");
  const [proofNotes, setProofNotes] = useState("");
  const [userTxHash, setUserTxHash] = useState("");

  const queryKeys = [["order-detail", id || ""], ["order-history", id || ""], ["order-proofs", id || ""]];
  useRealtimeInvalidation("orders", queryKeys);
  useRealtimeInvalidation("order_status_history", queryKeys);

  const { data: order, isLoading } = useQuery({
    queryKey: ["order-detail", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("id", id!)
        .eq("user_id", user!.id)
        .single();
      if (error) throw error;
      return data as Order;
    },
    enabled: !!id && !!user,
  });

  const { data: rateLock } = useQuery({
    queryKey: ["order-ratelock", order?.rate_lock_id],
    queryFn: async () => {
      const { data } = await supabase
        .from("rate_locks")
        .select("*")
        .eq("id", order!.rate_lock_id!)
        .single();
      return data as RateLock | null;
    },
    enabled: !!order?.rate_lock_id,
  });

  const { data: history = [] } = useQuery({
    queryKey: ["order-history", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("order_status_history")
        .select("*")
        .eq("order_id", id!)
        .order("created_at", { ascending: true });
      return data || [];
    },
    enabled: !!id,
  });

  const { data: proofs = [] } = useQuery({
    queryKey: ["order-proofs", id],
    queryFn: async () => {
      const { data } = await supabase
        .from("payment_proofs")
        .select("*")
        .eq("order_id", id!)
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
      const path = `${user!.id}/orders/${id}/${Date.now()}.${ext}`;
      const { error: upErr } = await supabase.storage.from("payment-proofs").upload(path, file);
      if (upErr) throw upErr;
      const { error } = await supabase.from("payment_proofs").insert({
        order_id: id!,
        user_id: user!.id,
        file_name: file.name,
        file_path: path,
        reference_number: refNumber || null,
        notes: proofNotes || null,
      });
      if (error) throw error;

      // Auto-transition: awaiting_payment or rate_locked → payment_proof_uploaded
      if (order && ["awaiting_payment", "rate_locked"].includes(order.status)) {
        await supabase.from("orders").update({ status: "payment_proof_uploaded" as any }).eq("id", id!);
        await supabase.from("order_status_history").insert({
          order_id: id!,
          old_status: order.status,
          new_status: "payment_proof_uploaded" as any,
          actor_id: user!.id,
          actor_role: "user",
          note: "Payment proof uploaded by user",
        });
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order-proofs", id] });
      queryClient.invalidateQueries({ queryKey: ["order-detail", id] });
      queryClient.invalidateQueries({ queryKey: ["order-history", id] });
      setRefNumber("");
      setProofNotes("");
      if (fileRef.current) fileRef.current.value = "";
      toast({ title: "Payment proof uploaded" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  // For sell orders: user submits their crypto tx hash
  const submitTxHashMutation = useMutation({
    mutationFn: async () => {
      if (!userTxHash.trim()) throw new Error("Please enter a transaction hash.");
      const { error } = await supabase.from("orders").update({ settlement_tx_hash: userTxHash.trim() } as any).eq("id", id!);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["order-detail", id] });
      setUserTxHash("");
      toast({ title: "Transaction hash submitted" });
    },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </DashboardLayout>
    );
  }

  if (!order) {
    return (
      <DashboardLayout>
        <div className="py-20 text-center">
          <p className="text-muted-foreground">{t("orders.notFound")}</p>
          <Button asChild className="mt-4">
            <Link to="/dashboard/orders">{t("orders.backToOrders")}</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const timelineSteps = history.map((h, i) => ({
    label: h.new_status.replace(/_/g, " ").replace(/\b\w/g, (c: string) => c.toUpperCase()),
    timestamp: h.created_at,
    description: h.note || undefined,
    completed: true,
    active: i === history.length - 1,
  }));

  const showUpload = ["awaiting_payment", "rate_locked"].includes(order.status);
  const isSell = order.side === "sell";
  const showUserTxHash = isSell && ["awaiting_payment", "rate_locked"].includes(order.status);
  const txHash = (order as any).settlement_tx_hash as string | null;

  return (
    <DashboardLayout>
      <div className="mb-4">
        <Button asChild variant="ghost" size="sm">
          <Link to="/dashboard/orders">
            <ArrowLeft className="mr-1 h-4 w-4" /> {t("orders.backToOrders")}
          </Link>
        </Button>
      </div>

      <PageHeader
        title={`${order.side === "buy" ? "Buy" : "Sell"} ${order.asset} — Order`}
        description={`${order.network} • ${order.order_type}`}
      >
        <StatusBadge status={order.status} />
      </PageHeader>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Order Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">{t("orders.orderSummary")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
            <div>
              <p className="text-muted-foreground">{t("orders.colSide")}</p>
              <p className={cn("font-semibold", order.side === "buy" ? "text-success" : "text-destructive")}>
                {order.side === "buy" ? "Buy" : "Sell"}
              </p>
            </div>
            <div>
              <p className="text-muted-foreground">{t("orders.colAsset")}</p>
              <p className="font-semibold">{order.asset} ({order.network})</p>
            </div>
            <div>
              <p className="text-muted-foreground">{t("orders.lockedRate")}</p>
              <p className="font-semibold">NPR {Number(order.final_rate_npr).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{t("orders.fees")}</p>
              <p className="font-semibold">NPR {Number(order.fee_total_npr).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{t("orders.youPay")}</p>
              <p className="font-semibold">NPR {Number(order.total_pay_npr).toLocaleString()}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{t("orders.youReceive")}</p>
              <p className="font-semibold">{Number(order.total_receive_crypto)} {order.asset}</p>
            </div>
            <div>
              <p className="text-muted-foreground">{t("orders.colDate")}</p>
              <p className="font-semibold">{formatDate(order.created_at, "PPp")}</p>
            </div>
          </CardContent>
        </Card>

        {/* Rate Snapshot */}
        {rateLock && (
          <Card>
            <CardHeader>
              <CardTitle className="text-base">{t("orders.rateSnapshot")}</CardTitle>
            </CardHeader>
            <CardContent className="grid gap-3 text-sm sm:grid-cols-2">
              <div>
                <p className="text-muted-foreground">{t("orders.cryptoUsdPrice")}</p>
                <p className="font-semibold">${Number(rateLock.crypto_usd_price).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">{t("orders.usdNprRate")}</p>
                <p className="font-semibold">NPR {Number(rateLock.usd_npr_rate).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">{t("orders.basePrice")}</p>
                <p className="font-semibold">NPR {Number(rateLock.base_npr_price).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">{t("orders.finalRate")}</p>
                <p className="font-semibold">NPR {Number(rateLock.final_rate_npr).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">{t("orders.fees")}</p>
                <p className="font-semibold">NPR {Number(rateLock.fees_npr).toLocaleString()}</p>
              </div>
              <div>
                <p className="text-muted-foreground">{t("orders.lockedAt")}</p>
                <p className="font-semibold">{formatDate(rateLock.created_at, "PPp")}</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Settlement TX Hash display */}
      {txHash && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Settlement Transaction</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-1">Transaction Hash</p>
            <code className="text-sm break-all font-mono bg-muted px-2 py-1 rounded">{txHash}</code>
          </CardContent>
        </Card>
      )}

      {/* Sell order: user submits crypto tx hash */}
      {showUserTxHash && !txHash && (
        <Card className="mt-6">
          <CardHeader>
            <CardTitle className="text-base">Submit Crypto Transaction Hash</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">
              After sending your {order.asset} to our address, paste your blockchain transaction hash below.
            </p>
            <form onSubmit={(e) => { e.preventDefault(); submitTxHashMutation.mutate(); }} className="flex gap-2">
              <Input
                placeholder="0x... or transaction hash"
                value={userTxHash}
                onChange={(e) => setUserTxHash(e.target.value)}
                className="flex-1 font-mono text-sm"
              />
              <Button type="submit" size="sm" disabled={submitTxHashMutation.isPending}>
                {submitTxHashMutation.isPending ? "Submitting…" : "Submit"}
              </Button>
            </form>
          </CardContent>
        </Card>
      )}

      {/* Timeline */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">{t("orders.statusTimeline")}</CardTitle>
        </CardHeader>
        <CardContent>
          {timelineSteps.length === 0 ? (
            <p className="text-sm text-muted-foreground">{t("orders.noHistory")}</p>
          ) : (
            <Timeline steps={timelineSteps} compact={isMobile} />
          )}
        </CardContent>
      </Card>

      {/* Pricing Explainer */}
      {rateLock && (
        <Card className="mt-6">
          <CardContent className="pt-6">
            <PricingExplainer />
          </CardContent>
        </Card>
      )}

      {/* Payment Proofs */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle className="text-base">{t("orders.paymentProofs")}</CardTitle>
        </CardHeader>
        <CardContent>
          {proofs.length > 0 && (
            <div className="space-y-4 mb-4">
              {proofs.map((p) => (
                <div key={p.id} className="rounded border bg-muted/30 p-4 space-y-3">
                  <ProofImage filePath={p.file_path} fileName={p.file_name} />
                  <div className="flex items-center justify-between">
                    <div className="text-sm">
                      <p className="font-medium">{p.file_name}</p>
                      <p className="text-xs text-muted-foreground">
                        {p.reference_number && `Ref: ${p.reference_number} • `}
                        {formatDate(p.created_at, "PPp")}
                      </p>
                    </div>
                    <StatusBadge status={p.status} />
                  </div>
                </div>
              ))}
            </div>
          )}
          {showUpload && (
            <form onSubmit={(e) => { e.preventDefault(); uploadMutation.mutate(); }} className="space-y-3">
              <div className="rounded-lg border-2 border-dashed bg-muted/30 p-4 text-center">
                <Upload className="mx-auto h-5 w-5 text-muted-foreground" />
                <p className="mt-1 text-sm font-medium">{t("orders.uploadProof")}</p>
                <input ref={fileRef} type="file" className="mt-2 text-xs" accept="image/*,.pdf" />
              </div>
              <Input placeholder={t("orders.refNumber")} value={refNumber} onChange={(e) => setRefNumber(e.target.value)} />
              <Textarea placeholder={t("orders.proofNotes")} rows={2} value={proofNotes} onChange={(e) => setProofNotes(e.target.value)} />
              <Button type="submit" disabled={uploadMutation.isPending} size="sm">
                {uploadMutation.isPending ? t("orders.uploading") : t("orders.submitProof")}
              </Button>
            </form>
          )}
        </CardContent>
      </Card>

      {/* Support Button */}
      <div className="mt-6 flex justify-center">
        <Button asChild variant="outline">
          <Link to={`/dashboard/support`}>
            <HeadphonesIcon className="mr-2 h-4 w-4" /> {t("orders.contactSupport")}
          </Link>
        </Button>
      </div>
    </DashboardLayout>
  );
}
