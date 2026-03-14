import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { useParams, useNavigate, Link } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Clock, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { format, formatDistanceToNow, isPast } from "date-fns";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function QuoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: quoteRequest, isLoading } = useQuery({
    queryKey: ["quote-request", id],
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

  const { data: quote } = useQuery({
    queryKey: ["quote-for-request", id],
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

  const acceptMutation = useMutation({
    mutationFn: async () => {
      if (!quote || !quoteRequest) throw new Error("No quote");

      // Update quote
      const { error: quoteError } = await supabase
        .from("quotes")
        .update({ is_accepted: true, accepted_at: new Date().toISOString() })
        .eq("id", quote.id);
      if (quoteError) throw quoteError;

      // Update quote request status
      const { error: qrError } = await supabase
        .from("quote_requests")
        .update({ status: "accepted" as any })
        .eq("id", quoteRequest.id);
      if (qrError) throw qrError;
    },
    onSuccess: () => {
      toast({ title: "Quote accepted!", description: "Your trade will be processed shortly." });
      queryClient.invalidateQueries({ queryKey: ["quote-request", id] });
      queryClient.invalidateQueries({ queryKey: ["quote-for-request", id] });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  const declineMutation = useMutation({
    mutationFn: async () => {
      if (!quote || !quoteRequest) throw new Error("No quote");

      const { error: quoteError } = await supabase
        .from("quotes")
        .update({ is_accepted: false })
        .eq("id", quote.id);
      if (quoteError) throw quoteError;

      const { error: qrError } = await supabase
        .from("quote_requests")
        .update({ status: "rejected" as any })
        .eq("id", quoteRequest.id);
      if (qrError) throw qrError;
    },
    onSuccess: () => {
      toast({ title: "Quote declined" });
      queryClient.invalidateQueries({ queryKey: ["quote-request", id] });
      queryClient.invalidateQueries({ queryKey: ["quote-for-request", id] });
    },
    onError: (err: any) => {
      toast({ title: "Error", description: err.message, variant: "destructive" });
    },
  });

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center py-20">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </DashboardLayout>
    );
  }

  if (!quoteRequest) {
    return (
      <DashboardLayout>
        <div className="text-center py-20">
          <p className="text-muted-foreground">Quote request not found.</p>
          <Button variant="outline" className="mt-4" asChild>
            <Link to="/dashboard/quotes">Back to Quotes</Link>
          </Button>
        </div>
      </DashboardLayout>
    );
  }

  const isExpired = quote?.expires_at && isPast(new Date(quote.expires_at));
  const canAcceptDecline =
    quote &&
    !quote.is_accepted &&
    quote.is_accepted !== false &&
    !isExpired &&
    (quoteRequest.status === "quoted" || quoteRequest.status === "awaiting_user_acceptance");

  return (
    <DashboardLayout>
      <div className="mb-4">
        <Button variant="ghost" size="sm" asChild>
          <Link to="/dashboard/quotes">
            <ArrowLeft className="mr-1 h-4 w-4" /> Back to Quotes
          </Link>
        </Button>
      </div>

      <PageHeader
        title={`${quoteRequest.side === "buy" ? "Buy" : "Sell"} ${quoteRequest.amount_crypto ?? ""} ${quoteRequest.asset}`}
        description={`Quote Request · Created ${format(new Date(quoteRequest.created_at), "PPp")}`}
      >
        <StatusBadge status={quoteRequest.status} />
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
            {quoteRequest.notes && <DetailRow label="Notes" value={quoteRequest.notes} />}
          </CardContent>
        </Card>

        {/* Quote Response */}
        {quote ? (
          <Card className={cn(
            "border-2",
            quote.is_accepted === true ? "border-success/30" :
            quote.is_accepted === false ? "border-destructive/30" :
            isExpired ? "border-muted" : "border-primary/30"
          )}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <span>Quote from Admin</span>
                {quote.is_accepted === true && <CheckCircle2 className="h-5 w-5 text-success" />}
                {quote.is_accepted === false && <XCircle className="h-5 w-5 text-destructive" />}
                {isExpired && quote.is_accepted === null && <AlertTriangle className="h-5 w-5 text-warning" />}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <DetailRow label="Quoted Rate" value={`${quoteRequest.fiat_currency} ${Number(quote.quoted_price).toLocaleString()}`} highlight />
              <DetailRow label="Fee" value={`${quoteRequest.fiat_currency} ${Number(quote.fee_amount).toLocaleString()}`} />
              {quote.spread_amount && (
                <DetailRow label="Spread" value={`${quoteRequest.fiat_currency} ${Number(quote.spread_amount).toLocaleString()}`} />
              )}
              <Separator />
              <DetailRow
                label={quoteRequest.side === "buy" ? "You Pay" : "You Receive"}
                value={`${quoteRequest.fiat_currency} ${Number(quoteRequest.side === "buy" ? quote.total_user_pays : quote.total_user_receives).toLocaleString()}`}
                highlight
              />
              <DetailRow
                label={quoteRequest.side === "buy" ? "You Receive" : "You Send"}
                value={`${Number(quoteRequest.side === "buy" ? quote.total_user_receives : quote.total_user_pays).toLocaleString()} ${quoteRequest.asset}`}
                highlight
              />
              <Separator />
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {isExpired ? (
                  <span className="text-destructive">Expired {formatDistanceToNow(new Date(quote.expires_at), { addSuffix: true })}</span>
                ) : (
                  <span>Expires {formatDistanceToNow(new Date(quote.expires_at), { addSuffix: true })}</span>
                )}
              </div>
              {quote.settlement_instructions && (
                <div className="mt-3 rounded-md bg-muted/50 p-3">
                  <p className="text-xs font-medium text-muted-foreground mb-1">Settlement Instructions</p>
                  <p className="text-sm whitespace-pre-wrap">{quote.settlement_instructions}</p>
                </div>
              )}

              {canAcceptDecline && (
                <div className="flex gap-3 pt-4">
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button className="flex-1" disabled={acceptMutation.isPending}>
                        <CheckCircle2 className="mr-1 h-4 w-4" /> Accept Quote
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Accept this quote?</AlertDialogTitle>
                        <AlertDialogDescription>
                          You'll be committing to {quoteRequest.side === "buy" ? "pay" : "send"}{" "}
                          <strong>
                            {quoteRequest.side === "buy"
                              ? `${quoteRequest.fiat_currency} ${Number(quote.total_user_pays).toLocaleString()}`
                              : `${Number(quote.total_user_pays).toLocaleString()} ${quoteRequest.asset}`}
                          </strong>{" "}
                          and receive{" "}
                          <strong>
                            {quoteRequest.side === "buy"
                              ? `${Number(quote.total_user_receives).toLocaleString()} ${quoteRequest.asset}`
                              : `${quoteRequest.fiat_currency} ${Number(quote.total_user_receives).toLocaleString()}`}
                          </strong>. This cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction onClick={() => acceptMutation.mutate()}>
                          Accept Quote
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" className="flex-1" disabled={declineMutation.isPending}>
                        <XCircle className="mr-1 h-4 w-4" /> Decline
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>Decline this quote?</AlertDialogTitle>
                        <AlertDialogDescription>
                          You can request a new quote anytime. This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => declineMutation.mutate()}
                          className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                          Decline Quote
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}

              {quote.is_accepted === true && (
                <div className="rounded-md bg-success/10 p-3 text-sm text-success">
                  ✓ Quote accepted on {format(new Date(quote.accepted_at!), "PPp")}
                </div>
              )}
              {quote.is_accepted === false && (
                <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">
                  Quote was declined
                </div>
              )}
            </CardContent>
          </Card>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Clock className="h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="text-sm font-medium">Awaiting Quote</p>
              <p className="text-xs text-muted-foreground mt-1">
                Our team is reviewing your request and will send a quote soon.
              </p>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

function DetailRow({ label, value, highlight }: { label: string; value: string; highlight?: boolean }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{label}</span>
      <span className={highlight ? "font-semibold" : ""}>{value}</span>
    </div>
  );
}

function cn(...classes: (string | boolean | undefined)[]) {
  return classes.filter(Boolean).join(" ");
}
