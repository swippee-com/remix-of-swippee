import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useParams, Link } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Send, Clock } from "lucide-react";
import { format } from "date-fns";
import { useState } from "react";
import { CreateQuoteModal } from "@/components/admin/CreateQuoteModal";

export default function AdminQuoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const [showModal, setShowModal] = useState(false);
  const queryClient = useQueryClient();

  const { data: quoteRequest, isLoading } = useQuery({
    queryKey: ["admin-quote-request", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quote_requests")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const { data: userProfile } = useQuery({
    queryKey: ["admin-user-profile", quoteRequest?.user_id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("full_name, email, phone")
        .eq("id", quoteRequest!.user_id)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!quoteRequest?.user_id,
  });

  const { data: existingQuote } = useQuery({
    queryKey: ["admin-quote-for-request", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("quotes")
        .select("*")
        .eq("quote_request_id", id!)
        .order("created_at", { ascending: false })
        .limit(1)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  if (isLoading) {
    return (
      <AdminLayout>
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </AdminLayout>
    );
  }

  if (!quoteRequest) {
    return (
      <AdminLayout>
        <div className="text-center py-20">
          <p className="text-muted-foreground">Quote request not found.</p>
          <Button variant="outline" className="mt-4" asChild>
            <Link to="/admin/quotes">Back to Quotes</Link>
          </Button>
        </div>
      </AdminLayout>
    );
  }

  const canSendQuote = ["submitted", "under_review"].includes(quoteRequest.status) && !existingQuote;

  return (
    <AdminLayout>
      <div className="mb-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/admin/quotes">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to Quotes
          </Link>
        </Button>
      </div>

      <PageHeader
        title={`${quoteRequest.side === "buy" ? "Buy" : "Sell"} ${quoteRequest.amount_crypto ?? ""} ${quoteRequest.asset}`}
        description={`Request from ${userProfile?.full_name || "User"} · ${format(new Date(quoteRequest.created_at), "PPp")}`}
      >
        <div className="flex items-center gap-3">
          <StatusBadge status={quoteRequest.status} />
          {canSendQuote && (
            <Button onClick={() => setShowModal(true)}>
              <Send className="mr-1 h-4 w-4" /> Create Quote
            </Button>
          )}
        </div>
      </PageHeader>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Request Details */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Request Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <DetailRow label="Side" value={quoteRequest.side === "buy" ? "Buy Crypto" : "Sell Crypto"} />
            <DetailRow label="Asset" value={quoteRequest.asset} />
            <DetailRow label="Network" value={quoteRequest.network} />
            {quoteRequest.amount_crypto && (
              <DetailRow label="Crypto Amount" value={`${quoteRequest.amount_crypto} ${quoteRequest.asset}`} />
            )}
            {quoteRequest.amount_fiat && (
              <DetailRow label="Fiat Amount" value={`${quoteRequest.fiat_currency} ${Number(quoteRequest.amount_fiat).toLocaleString()}`} />
            )}
            <DetailRow label="Currency" value={quoteRequest.fiat_currency} />
            <DetailRow label="Status" value={quoteRequest.status.replace(/_/g, " ")} />
            {quoteRequest.notes && <DetailRow label="Notes" value={quoteRequest.notes} />}
          </CardContent>
        </Card>

        {/* User Info */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">User Information</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 text-sm">
            <DetailRow label="Name" value={userProfile?.full_name || "—"} />
            <DetailRow label="Email" value={userProfile?.email || "—"} />
            <DetailRow label="Phone" value={userProfile?.phone || "—"} />
          </CardContent>
        </Card>

        {/* Existing Quote */}
        {existingQuote && (
          <Card className="lg:col-span-2">
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <span>Sent Quote</span>
                {existingQuote.is_accepted === true && (
                  <span className="text-xs font-medium text-success">✓ Accepted</span>
                )}
                {existingQuote.is_accepted === false && (
                  <span className="text-xs font-medium text-destructive">✕ Declined</span>
                )}
                {existingQuote.is_accepted === null && (
                  <span className="text-xs font-medium text-warning flex items-center gap-1">
                    <Clock className="h-3 w-3" /> Awaiting Response
                  </span>
                )}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid gap-3 text-sm sm:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-md bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Quoted Rate</p>
                  <p className="font-semibold">{quoteRequest.fiat_currency} {Number(existingQuote.quoted_price).toLocaleString()}</p>
                </div>
                <div className="rounded-md bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">Fee</p>
                  <p className="font-semibold">{quoteRequest.fiat_currency} {Number(existingQuote.fee_amount).toLocaleString()}</p>
                </div>
                <div className="rounded-md bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">User Pays</p>
                  <p className="font-semibold">{quoteRequest.fiat_currency} {Number(existingQuote.total_user_pays).toLocaleString()}</p>
                </div>
                <div className="rounded-md bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground">User Receives</p>
                  <p className="font-semibold">{Number(existingQuote.total_user_receives).toLocaleString()}</p>
                </div>
              </div>
              {existingQuote.settlement_instructions && (
                <div className="mt-4 rounded-md bg-muted/50 p-3">
                  <p className="text-xs text-muted-foreground mb-1">Settlement Instructions</p>
                  <p className="text-sm whitespace-pre-wrap">{existingQuote.settlement_instructions}</p>
                </div>
              )}
              {existingQuote.internal_note && (
                <div className="mt-3 rounded-md border border-warning/30 bg-warning/5 p-3">
                  <p className="text-xs text-warning mb-1">Internal Note (not visible to user)</p>
                  <p className="text-sm">{existingQuote.internal_note}</p>
                </div>
              )}
              <p className="mt-3 text-xs text-muted-foreground">
                Expires: {format(new Date(existingQuote.expires_at), "PPp")}
              </p>
            </CardContent>
          </Card>
        )}
      </div>

      {showModal && (
        <CreateQuoteModal
          quoteRequest={quoteRequest}
          open={showModal}
          onClose={() => setShowModal(false)}
          onCreated={() => {
            setShowModal(false);
            queryClient.invalidateQueries({ queryKey: ["admin-quote-for-request", id] });
            queryClient.invalidateQueries({ queryKey: ["admin-quote-request", id] });
          }}
        />
      )}
    </AdminLayout>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span>{value}</span>
    </div>
  );
}
