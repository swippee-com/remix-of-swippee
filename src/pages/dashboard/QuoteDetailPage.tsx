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
import { useLanguage } from "@/contexts/LanguageContext";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Clock, CheckCircle2, XCircle, AlertTriangle } from "lucide-react";
import { format, formatDistanceToNow, isPast } from "date-fns";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

export default function QuoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: quoteRequest, isLoading } = useQuery({
    queryKey: ["quote-request", id],
    queryFn: async () => { const { data, error } = await supabase.from("quote_requests").select("*").eq("id", id!).single(); if (error) throw error; return data; },
    enabled: !!id,
  });

  const { data: quote } = useQuery({
    queryKey: ["quote-for-request", id],
    queryFn: async () => { const { data, error } = await supabase.from("quotes").select("*").eq("quote_request_id", id!).order("created_at", { ascending: false }).limit(1).maybeSingle(); if (error) throw error; return data; },
    enabled: !!id,
  });

  const acceptMutation = useMutation({
    mutationFn: async () => {
      if (!quote || !quoteRequest) throw new Error("No quote");
      const { error: quoteError } = await supabase.from("quotes").update({ is_accepted: true, accepted_at: new Date().toISOString() }).eq("id", quote.id);
      if (quoteError) throw quoteError;
    },
    onSuccess: () => { toast({ title: "Quote accepted!", description: "Your trade will be processed shortly." }); queryClient.invalidateQueries({ queryKey: ["quote-request", id] }); queryClient.invalidateQueries({ queryKey: ["quote-for-request", id] }); },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  const declineMutation = useMutation({
    mutationFn: async () => {
      if (!quote || !quoteRequest) throw new Error("No quote");
      const { error: quoteError } = await supabase.from("quotes").update({ is_accepted: false }).eq("id", quote.id);
      if (quoteError) throw quoteError;
      const { error: qrError } = await supabase.from("quote_requests").update({ status: "rejected" as any }).eq("id", quoteRequest.id);
      if (qrError) throw qrError;
    },
    onSuccess: () => { toast({ title: "Quote declined" }); queryClient.invalidateQueries({ queryKey: ["quote-request", id] }); queryClient.invalidateQueries({ queryKey: ["quote-for-request", id] }); },
    onError: (err: any) => toast({ title: "Error", description: err.message, variant: "destructive" }),
  });

  if (isLoading) {
    return <DashboardLayout><div className="flex items-center justify-center py-20"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div></DashboardLayout>;
  }

  if (!quoteRequest) {
    return <DashboardLayout><div className="text-center py-20"><p className="text-muted-foreground">{t("quoteDetail.notFound")}</p><Button variant="outline" className="mt-4" asChild><Link to="/dashboard/quotes">{t("quoteDetail.backToQuotes")}</Link></Button></div></DashboardLayout>;
  }

  const isExpired = quote?.expires_at && isPast(new Date(quote.expires_at));
  const canAcceptDecline = quote && !quote.is_accepted && quote.is_accepted !== false && !isExpired && (quoteRequest.status === "quoted" || quoteRequest.status === "awaiting_user_acceptance");

  return (
    <DashboardLayout>
      <div className="mb-4">
        <Button variant="ghost" size="sm" asChild><Link to="/dashboard/quotes"><ArrowLeft className="mr-1 h-4 w-4" /> {t("quoteDetail.backToQuotes")}</Link></Button>
      </div>

      <PageHeader
        title={`${quoteRequest.side === "buy" ? t("quoteDetail.buyCrypto") : t("quoteDetail.sellCrypto")} ${quoteRequest.amount_crypto ?? ""} ${quoteRequest.asset}`}
        description={`${t("dashboard.quoteRequest")} · ${format(new Date(quoteRequest.created_at), "PPp")}`}
      >
        <StatusBadge status={quoteRequest.status} />
      </PageHeader>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader><CardTitle className="text-base">{t("quoteDetail.requestDetails")}</CardTitle></CardHeader>
          <CardContent className="space-y-3 text-sm">
            <DetailRow label={t("quoteDetail.side")} value={quoteRequest.side === "buy" ? t("quoteDetail.buyCrypto") : t("quoteDetail.sellCrypto")} />
            <DetailRow label={t("quoteDetail.asset")} value={quoteRequest.asset} />
            <DetailRow label={t("quoteDetail.network")} value={quoteRequest.network} />
            {quoteRequest.amount_crypto && <DetailRow label={t("quoteDetail.cryptoAmount")} value={`${quoteRequest.amount_crypto} ${quoteRequest.asset}`} />}
            {quoteRequest.amount_fiat && <DetailRow label={t("quoteDetail.fiatAmount")} value={`${quoteRequest.fiat_currency} ${Number(quoteRequest.amount_fiat).toLocaleString()}`} />}
            <DetailRow label={t("quoteDetail.currency")} value={quoteRequest.fiat_currency} />
            {quoteRequest.notes && <DetailRow label={t("quoteDetail.notes")} value={quoteRequest.notes} />}
          </CardContent>
        </Card>

        {quote ? (
          <Card className={cn(
            "border-2",
            quote.is_accepted === true ? "border-success/30" : quote.is_accepted === false ? "border-destructive/30" : isExpired ? "border-muted" : "border-primary/30"
          )}>
            <CardHeader>
              <CardTitle className="flex items-center justify-between text-base">
                <span>{t("quoteDetail.quoteFromAdmin")}</span>
                {quote.is_accepted === true && <CheckCircle2 className="h-5 w-5 text-success" />}
                {quote.is_accepted === false && <XCircle className="h-5 w-5 text-destructive" />}
                {isExpired && quote.is_accepted === null && <AlertTriangle className="h-5 w-5 text-warning" />}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <DetailRow label={t("quoteDetail.quotedRate")} value={`${quoteRequest.fiat_currency} ${Number(quote.quoted_price).toLocaleString()}`} highlight />
              <DetailRow label={t("quoteDetail.fee")} value={`${quoteRequest.fiat_currency} ${Number(quote.fee_amount).toLocaleString()}`} />
              {quote.spread_amount && <DetailRow label={t("quoteDetail.spread")} value={`${quoteRequest.fiat_currency} ${Number(quote.spread_amount).toLocaleString()}`} />}
              <Separator />
              <DetailRow label={quoteRequest.side === "buy" ? t("quoteDetail.youPay") : t("quoteDetail.youReceive")} value={`${quoteRequest.fiat_currency} ${Number(quoteRequest.side === "buy" ? quote.total_user_pays : quote.total_user_receives).toLocaleString()}`} highlight />
              <DetailRow label={quoteRequest.side === "buy" ? t("quoteDetail.youReceive") : t("quoteDetail.youSend")} value={`${Number(quoteRequest.side === "buy" ? quote.total_user_receives : quote.total_user_pays).toLocaleString()} ${quoteRequest.asset}`} highlight />
              <Separator />
              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                {isExpired ? <span className="text-destructive">{t("quoteDetail.expired")} {formatDistanceToNow(new Date(quote.expires_at), { addSuffix: true })}</span> : <span>{t("quoteDetail.expires")} {formatDistanceToNow(new Date(quote.expires_at), { addSuffix: true })}</span>}
              </div>
              {quote.settlement_instructions && (
                <div className="mt-3 rounded-md bg-muted/50 p-3">
                  <p className="text-xs font-medium text-muted-foreground mb-1">{t("quoteDetail.settlementInstructions")}</p>
                  <p className="text-sm whitespace-pre-wrap">{quote.settlement_instructions}</p>
                </div>
              )}

              {canAcceptDecline && (
                <div className="flex gap-3 pt-4">
                  <AlertDialog>
                    <AlertDialogTrigger asChild><Button className="flex-1" disabled={acceptMutation.isPending}><CheckCircle2 className="mr-1 h-4 w-4" /> {t("quoteDetail.acceptQuote")}</Button></AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t("quoteDetail.acceptConfirmTitle")}</AlertDialogTitle>
                        <AlertDialogDescription>
                          {quoteRequest.side === "buy"
                            ? `${t("quoteDetail.youPay")} ${quoteRequest.fiat_currency} ${Number(quote.total_user_pays).toLocaleString()} → ${t("quoteDetail.youReceive")} ${Number(quote.total_user_receives).toLocaleString()} ${quoteRequest.asset}`
                            : `${t("quoteDetail.youSend")} ${Number(quote.total_user_pays).toLocaleString()} ${quoteRequest.asset} → ${t("quoteDetail.youReceive")} ${quoteRequest.fiat_currency} ${Number(quote.total_user_receives).toLocaleString()}`}
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t("quoteDetail.cancel")}</AlertDialogCancel>
                        <AlertDialogAction onClick={() => acceptMutation.mutate()}>{t("quoteDetail.acceptQuote")}</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>

                  <AlertDialog>
                    <AlertDialogTrigger asChild><Button variant="outline" className="flex-1" disabled={declineMutation.isPending}><XCircle className="mr-1 h-4 w-4" /> {t("quoteDetail.decline")}</Button></AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle>{t("quoteDetail.declineConfirmTitle")}</AlertDialogTitle>
                        <AlertDialogDescription>{t("quoteDetail.declineConfirmDesc")}</AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel>{t("quoteDetail.cancel")}</AlertDialogCancel>
                        <AlertDialogAction onClick={() => declineMutation.mutate()} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{t("quoteDetail.declineQuote")}</AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              )}

              {quote.is_accepted === true && <div className="rounded-md bg-success/10 p-3 text-sm text-success">✓ {t("quoteDetail.quoteAccepted")} {format(new Date(quote.accepted_at!), "PPp")}</div>}
              {quote.is_accepted === false && <div className="rounded-md bg-destructive/10 p-3 text-sm text-destructive">{t("quoteDetail.quoteDeclined")}</div>}
            </CardContent>
          </Card>
        ) : (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <Clock className="h-10 w-10 text-muted-foreground/50 mb-3" />
              <p className="text-sm font-medium">{t("quoteDetail.awaitingQuote")}</p>
              <p className="text-xs text-muted-foreground mt-1">{t("quoteDetail.awaitingQuoteDesc")}</p>
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
