import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { format, subDays, subMonths, startOfWeek, differenceInDays, eachDayOfInterval, eachWeekOfInterval, eachMonthOfInterval, startOfMonth } from "date-fns";
import { CalendarIcon, Download } from "lucide-react";
import { cn } from "@/lib/utils";
import { DateRange } from "react-day-picker";
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid,
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell, Legend,
} from "recharts";

const ASSET_COLORS: Record<string, string> = {
  USDT: "hsl(142 60% 45%)",
  BTC: "hsl(36 90% 55%)",
  ETH: "hsl(225 60% 55%)",
  USDC: "hsl(210 70% 50%)",
};

const PRESETS = [
  { label: "7d", days: 7 },
  { label: "30d", days: 30 },
  { label: "90d", days: 90 },
  { label: "6m", days: 180 },
  { label: "1y", days: 365 },
] as const;

function exportCsv(filename: string, headers: string[], rows: Record<string, any>[], keys: string[]) {
  const csvContent = [
    headers.join(","),
    ...rows.map((r) => keys.map((k) => `"${r[k] ?? ""}"`).join(",")),
  ].join("\n");
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `${filename}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

function ExportButton({ onClick, disabled }: { onClick: () => void; disabled?: boolean }) {
  return (
    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={onClick} disabled={disabled} title="Export CSV">
      <Download className="h-3.5 w-3.5" />
    </Button>
  );
}

export default function AdminAnalyticsPage() {
  const [dateRange, setDateRange] = useState<DateRange>({
    from: subDays(new Date(), 30),
    to: new Date(),
  });

  const from = dateRange.from ?? subDays(new Date(), 30);
  const to = dateRange.to ?? new Date();
  const sinceISO = from.toISOString();
  const untilISO = to.toISOString();
  const totalDays = differenceInDays(to, from) + 1;

  function applyPreset(days: number) {
    setDateRange({ from: subDays(new Date(), days), to: new Date() });
  }

  // 1. Trade Volume
  const { data: volumeData, isLoading: volumeLoading } = useQuery({
    queryKey: ["admin-analytics-volume", sinceISO, untilISO],
    queryFn: async () => {
      const { data } = await supabase
        .from("otc_trades")
        .select("gross_amount, quoted_rate, created_at")
        .gte("created_at", sinceISO)
        .lte("created_at", untilISO);
      const byDay: Record<string, number> = {};
      for (const t of data || []) {
        const day = format(new Date(t.created_at), "yyyy-MM-dd");
        byDay[day] = (byDay[day] || 0) + Number(t.gross_amount) * Number(t.quoted_rate);
      }
      const days = eachDayOfInterval({ start: from, end: to });
      return days.map((d) => {
        const key = format(d, "yyyy-MM-dd");
        return { date: key, label: format(d, "MMM d"), volume: Math.round(byDay[key] || 0) };
      });
    },
  });

  // 2. Revenue
  const { data: revenueData, isLoading: revLoading } = useQuery({
    queryKey: ["admin-analytics-revenue", sinceISO, untilISO],
    queryFn: async () => {
      const [ledger, trades] = await Promise.all([
        supabase.from("ledger_entries").select("amount, created_at").eq("account_bucket", "fees_revenue").gte("created_at", sinceISO).lte("created_at", untilISO),
        supabase.from("otc_trades").select("created_at").gte("created_at", sinceISO).lte("created_at", untilISO),
      ]);
      const monthIntervals = eachMonthOfInterval({ start: from, end: to });
      const months: Record<string, { revenue: number; trades: number }> = {};
      for (const m of monthIntervals) {
        months[format(m, "yyyy-MM")] = { revenue: 0, trades: 0 };
      }
      for (const e of ledger.data || []) {
        const m = format(new Date(e.created_at), "yyyy-MM");
        if (months[m]) months[m].revenue += Number(e.amount);
      }
      for (const t of trades.data || []) {
        const m = format(new Date(t.created_at), "yyyy-MM");
        if (months[m]) months[m].trades += 1;
      }
      return Object.entries(months).map(([m, v]) => ({
        month: format(new Date(m + "-01"), "MMM yyyy"),
        revenue: Math.round(v.revenue),
        trades: v.trades,
      }));
    },
  });

  // 3. User Growth
  const { data: growthData, isLoading: growthLoading } = useQuery({
    queryKey: ["admin-analytics-growth", sinceISO, untilISO],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("created_at").order("created_at", { ascending: true });
      if (!data?.length) return [];
      let cumulative = data.filter((p) => new Date(p.created_at) < from).length;
      const weeks: Record<string, number> = {};
      for (const p of data) {
        const d = new Date(p.created_at);
        if (d < from || d > to) continue;
        const wk = format(startOfWeek(d), "yyyy-MM-dd");
        cumulative++;
        weeks[wk] = cumulative;
      }
      const weekIntervals = eachWeekOfInterval({ start: from, end: to });
      const result: { week: string; label: string; users: number }[] = [];
      let last = data.filter((p) => new Date(p.created_at) < from).length;
      for (const w of weekIntervals) {
        const wk = format(w, "yyyy-MM-dd");
        if (weeks[wk]) last = weeks[wk];
        result.push({ week: wk, label: format(w, "MMM d"), users: last });
      }
      return result;
    },
  });

  // 4. Asset Distribution (within date range)
  const { data: assetData, isLoading: assetLoading } = useQuery({
    queryKey: ["admin-analytics-assets", sinceISO, untilISO],
    queryFn: async () => {
      const { data } = await supabase
        .from("otc_trades")
        .select("asset, gross_amount, quoted_rate")
        .gte("created_at", sinceISO)
        .lte("created_at", untilISO);
      const byAsset: Record<string, number> = {};
      for (const t of data || []) {
        byAsset[t.asset] = (byAsset[t.asset] || 0) + Number(t.gross_amount) * Number(t.quoted_rate);
      }
      const total = Object.values(byAsset).reduce((a, b) => a + b, 0);
      return Object.entries(byAsset).map(([asset, value]) => ({
        asset,
        value: Math.round(value),
        percent: total > 0 ? Math.round((value / total) * 100) : 0,
      }));
    },
  });

  const volumeConfig = { volume: { label: "Volume (NPR)", color: "hsl(var(--primary))" } };
  const revenueConfig = {
    revenue: { label: "Revenue (NPR)", color: "hsl(142 60% 45%)" },
    trades: { label: "Trade Count", color: "hsl(var(--primary))" },
  };
  const growthConfig = { users: { label: "Total Users", color: "hsl(210 70% 50%)" } };
  const assetConfig = Object.fromEntries(
    (assetData || []).map((a) => [a.asset, { label: a.asset, color: ASSET_COLORS[a.asset] || "hsl(var(--muted))" }])
  );

  return (
    <AdminLayout>
      <PageHeader title="Analytics" description="Trade volume, revenue, user growth, and asset distribution.">
        <div className="flex items-center gap-2">
          {PRESETS.map((p) => (
            <Button
              key={p.label}
              variant={totalDays === p.days + 1 ? "default" : "outline"}
              size="sm"
              className="text-xs h-8 px-2.5"
              onClick={() => applyPreset(p.days)}
            >
              {p.label}
            </Button>
          ))}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className={cn("h-8 text-xs gap-1.5", !dateRange.from && "text-muted-foreground")}>
                <CalendarIcon className="h-3.5 w-3.5" />
                {dateRange.from ? (
                  dateRange.to ? (
                    `${format(dateRange.from, "MMM d")} – ${format(dateRange.to, "MMM d, yyyy")}`
                  ) : (
                    format(dateRange.from, "MMM d, yyyy")
                  )
                ) : (
                  "Pick dates"
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                mode="range"
                selected={dateRange}
                onSelect={(range) => range && setDateRange(range)}
                numberOfMonths={2}
                disabled={(date) => date > new Date()}
                initialFocus
                className={cn("p-3 pointer-events-auto")}
              />
            </PopoverContent>
          </Popover>
        </div>
      </PageHeader>

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Trade Volume */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-medium">Trade Volume Over Time</CardTitle>
            <ExportButton disabled={!volumeData?.length} onClick={() => exportCsv("trade-volume", ["Date", "Volume (NPR)"], volumeData || [], ["date", "volume"])} />
          </CardHeader>
          <CardContent>
            {volumeLoading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : (
              <ChartContainer config={volumeConfig} className="h-[250px] w-full">
                <AreaChart data={volumeData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} interval={totalDays > 60 ? Math.floor(totalDays / 10) : undefined} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `₨${(v / 1000).toFixed(0)}k`} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Area type="monotone" dataKey="volume" stroke="var(--color-volume)" fill="var(--color-volume)" fillOpacity={0.15} strokeWidth={2} />
                </AreaChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Revenue */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-medium">Revenue & Trades</CardTitle>
            <ExportButton disabled={!revenueData?.length} onClick={() => exportCsv("revenue-trades", ["Month", "Revenue (NPR)", "Trades"], revenueData || [], ["month", "revenue", "trades"])} />
          </CardHeader>
          <CardContent>
            {revLoading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : (
              <ChartContainer config={revenueConfig} className="h-[250px] w-full">
                <BarChart data={revenueData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                  <XAxis dataKey="month" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis yAxisId="left" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} tickFormatter={(v) => `₨${(v / 1000).toFixed(0)}k`} />
                  <YAxis yAxisId="right" orientation="right" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar yAxisId="left" dataKey="revenue" fill="var(--color-revenue)" radius={[4, 4, 0, 0]} />
                  <Bar yAxisId="right" dataKey="trades" fill="var(--color-trades)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* User Growth */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">User Growth</CardTitle>
          </CardHeader>
          <CardContent>
            {growthLoading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : (
              <ChartContainer config={growthConfig} className="h-[250px] w-full">
                <LineChart data={growthData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fontSize: 11 }} tickLine={false} axisLine={false} allowDecimals={false} />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Line type="monotone" dataKey="users" stroke="var(--color-users)" strokeWidth={2} dot={false} />
                </LineChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>

        {/* Asset Distribution */}
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Asset Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            {assetLoading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : !assetData?.length ? (
              <p className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">No trade data in this range.</p>
            ) : (
              <ChartContainer config={assetConfig} className="h-[250px] w-full">
                <PieChart>
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Pie data={assetData} dataKey="value" nameKey="asset" cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3}>
                    {assetData.map((entry) => (
                      <Cell key={entry.asset} fill={ASSET_COLORS[entry.asset] || "hsl(var(--muted))"} />
                    ))}
                  </Pie>
                  <Legend
                    formatter={(value) => {
                      const item = assetData.find((a) => a.asset === value);
                      return `${value} (${item?.percent ?? 0}%)`;
                    }}
                  />
                </PieChart>
              </ChartContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </AdminLayout>
  );
}
