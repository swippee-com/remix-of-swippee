import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { StatusBadge } from "@/components/shared/StatusBadge";
import { EmptyState } from "@/components/shared/EmptyState";
import { Button } from "@/components/ui/button";
import { ArrowLeftRight, Eye, Download, FileText, FileSpreadsheet } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { useQuery } from "@tanstack/react-query";
import { format } from "date-fns";
import { Link } from "react-router-dom";
import { useMemo, useState } from "react";
import { useRealtimeInvalidation } from "@/hooks/use-realtime";
import { BRAND } from "@/config/brand";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

function exportCSV(trades: any[]) {
  const headers = ["Side", "Asset", "Gross Amount", "Net Amount", "Fee", "Rate", "Fiat Currency", "Status", "Date"];
  const rows = trades.map((t) => [t.side, t.asset, t.gross_amount, t.net_amount, t.fee_amount, t.quoted_rate, t.fiat_currency, t.status, format(new Date(t.created_at), "yyyy-MM-dd")]);
  const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `swippee-trades-${format(new Date(), "yyyy-MM-dd")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

async function exportPDF(trades: any[]) {
  const { default: jsPDF } = await import("jspdf");
  await import("jspdf-autotable");
  const doc = new jsPDF();
  doc.setFontSize(18);
  doc.text(BRAND.name + " — Trade History", 14, 20);
  doc.setFontSize(10);
  doc.text(`Generated: ${format(new Date(), "PPp")}`, 14, 28);
  (doc as any).autoTable({
    startY: 34,
    head: [["Side", "Asset", "Amount", "Rate", "Fee", "Status", "Date"]],
    body: trades.map((t) => [t.side, t.asset, `${t.gross_amount} ${t.asset}`, `${Number(t.quoted_rate).toLocaleString()} ${t.fiat_currency}`, t.fee_amount, t.status.replace(/_/g, " "), format(new Date(t.created_at), "PP")]),
    styles: { fontSize: 8 },
    headStyles: { fillColor: [24, 24, 27] },
  });
  doc.save(`swippee-trades-${format(new Date(), "yyyy-MM-dd")}.pdf`);
}

export default function TradesPage() {
  const { user } = useAuth();
  const { t } = useLanguage();
  const keys = useMemo(() => [["user-trades"]], []);
  useRealtimeInvalidation("otc_trades", keys);

  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");

  const { data: trades = [], isLoading } = useQuery({
    queryKey: ["user-trades"],
    queryFn: async () => {
      const { data, error } = await supabase.from("otc_trades").select("*").eq("user_id", user!.id).order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  const filteredTrades = useMemo(() => {
    return trades.filter((t) => {
      const d = new Date(t.created_at);
      if (dateFrom && d < new Date(dateFrom)) return false;
      if (dateTo && d > new Date(dateTo + "T23:59:59")) return false;
      return true;
    });
  }, [trades, dateFrom, dateTo]);

  return (
    <DashboardLayout>
      <PageHeader title={t("trades.title")} description={t("trades.description")}>
        {trades.length > 0 && (
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm"><Download className="mr-1 h-3 w-3" /> {t("trades.export")}</Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => exportCSV(filteredTrades)}><FileSpreadsheet className="mr-2 h-4 w-4" /> {t("trades.exportCsv")}</DropdownMenuItem>
              <DropdownMenuItem onClick={() => exportPDF(filteredTrades)}><FileText className="mr-2 h-4 w-4" /> {t("trades.exportPdf")}</DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        )}
      </PageHeader>

      {trades.length > 0 && (
        <div className="mt-4 flex items-center gap-3">
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground">{t("trades.from")}</label>
            <Input type="date" className="h-8 w-auto text-xs" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-xs text-muted-foreground">{t("trades.to")}</label>
            <Input type="date" className="h-8 w-auto text-xs" value={dateTo} onChange={(e) => setDateTo(e.target.value)} />
          </div>
          {(dateFrom || dateTo) && (
            <Button variant="ghost" size="sm" className="text-xs" onClick={() => { setDateFrom(""); setDateTo(""); }}>{t("trades.clear")}</Button>
          )}
        </div>
      )}

      {isLoading ? (
        <div className="flex justify-center py-12"><div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" /></div>
      ) : filteredTrades.length === 0 ? (
        <EmptyState icon={<ArrowLeftRight className="mx-auto h-10 w-10" />} title={t("trades.noTrades")} description={t("trades.noTradesDesc")} className="mt-6" />
      ) : (
        <div className="mt-6 rounded-lg border bg-card shadow-card">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="border-b bg-muted/50">
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">{t("trades.colSide")}</th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">{t("trades.colAsset")}</th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">{t("trades.colAmount")}</th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">{t("trades.colRate")}</th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">{t("trades.colStatus")}</th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">{t("trades.colDate")}</th>
                <th className="px-6 py-3 text-left font-medium text-muted-foreground">{t("trades.colAction")}</th>
              </tr></thead>
              <tbody className="divide-y">
                {filteredTrades.map((t_item) => (
                  <tr key={t_item.id} className="hover:bg-muted/30 transition-colors">
                    <td className="px-6 py-4 capitalize">{t_item.side}</td>
                    <td className="px-6 py-4">{t_item.asset}</td>
                    <td className="px-6 py-4">{t_item.gross_amount} {t_item.asset}</td>
                    <td className="px-6 py-4">{Number(t_item.quoted_rate).toLocaleString()} {t_item.fiat_currency}</td>
                    <td className="px-6 py-4"><StatusBadge status={t_item.status} /></td>
                    <td className="px-6 py-4 text-muted-foreground">{format(new Date(t_item.created_at), "PP")}</td>
                    <td className="px-6 py-4"><Button variant="ghost" size="sm" asChild><Link to={`/dashboard/trades/${t_item.id}`}><Eye className="h-3 w-3 mr-1" /> {t("trades.view")}</Link></Button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </DashboardLayout>
  );
}
