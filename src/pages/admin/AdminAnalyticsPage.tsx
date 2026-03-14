import { AdminLayout } from "@/components/layout/AdminLayout";
import { PageHeader } from "@/components/shared/PageHeader";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Skeleton } from "@/components/ui/skeleton";
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState, useMemo } from "react";
import { format, subDays, subMonths, startOfDay, startOfWeek, startOfMonth } from "date-fns";
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

type Period = "7d" | "30d" | "90d";

function periodToDays(p: Period) {
  return p === "7d" ? 7 : p === "30d" ? 30 : 90;
}

export default function AdminAnalyticsPage() {
  const [volumePeriod, setVolumePeriod] = useState<Period>("30d");

  // 1. Trade Volume
  const { data: volumeData, isLoading: volumeLoading } = useQuery({
    queryKey: ["admin-analytics-volume", volumePeriod],
    queryFn: async () => {
      const since = subDays(new Date(), periodToDays(volumePeriod)).toISOString();
      const { data } = await supabase
        .from("otc_trades")
        .select("gross_amount, quoted_rate, created_at")
        .gte("created_at", since);
      const byDay: Record<string, number> = {};
      for (const t of data || []) {
        const day = format(new Date(t.created_at), "yyyy-MM-dd");
        byDay[day] = (byDay[day] || 0) + Number(t.gross_amount) * Number(t.quoted_rate);
      }
      // Fill missing days
      const days = periodToDays(volumePeriod);
      const result = [];
      for (let i = days - 1; i >= 0; i--) {
        const d = format(subDays(new Date(), i), "yyyy-MM-dd");
        result.push({ date: d, label: format(new Date(d), "MMM d"), volume: Math.round(byDay[d] || 0) });
      }
      return result;
    },
  });

  // 2. Revenue (last 6 months)
  const { data: revenueData, isLoading: revLoading } = useQuery({
    queryKey: ["admin-analytics-revenue"],
    queryFn: async () => {
      const since = subMonths(new Date(), 6).toISOString();
      const [ledger, trades] = await Promise.all([
        supabase.from("ledger_entries").select("amount, created_at").eq("account_bucket", "fees_revenue").gte("created_at", since),
        supabase.from("otc_trades").select("created_at").gte("created_at", since),
      ]);
      const months: Record<string, { revenue: number; trades: number }> = {};
      for (let i = 5; i >= 0; i--) {
        const m = format(subMonths(new Date(), i), "yyyy-MM");
        months[m] = { revenue: 0, trades: 0 };
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

  // 3. User Growth (last 6 months, weekly)
  const { data: growthData, isLoading: growthLoading } = useQuery({
    queryKey: ["admin-analytics-growth"],
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("created_at").order("created_at", { ascending: true });
      if (!data?.length) return [];
      const since = subMonths(new Date(), 6);
      let cumulative = (data || []).filter((p) => new Date(p.created_at) < since).length;
      const weeks: Record<string, number> = {};
      for (const p of data || []) {
        const d = new Date(p.created_at);
        if (d < since) continue;
        const wk = format(startOfWeek(d), "yyyy-MM-dd");
        cumulative++;
        weeks[wk] = cumulative;
      }
      // Fill weeks
      const result: { week: string; label: string; users: number }[] = [];
      let last = (data || []).filter((p) => new Date(p.created_at) < since).length;
      let cursor = startOfWeek(since);
      const now = new Date();
      while (cursor <= now) {
        const wk = format(cursor, "yyyy-MM-dd");
        if (weeks[wk]) last = weeks[wk];
        result.push({ week: wk, label: format(cursor, "MMM d"), users: last });
        cursor = new Date(cursor.getTime() + 7 * 86400000);
      }
      return result;
    },
  });

  // 4. Asset Distribution
  const { data: assetData, isLoading: assetLoading } = useQuery({
    queryKey: ["admin-analytics-assets"],
    queryFn: async () => {
      const { data } = await supabase.from("otc_trades").select("asset, gross_amount, quoted_rate");
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
      <PageHeader title="Analytics" description="Trade volume, revenue, user growth, and asset distribution." />

      <div className="mt-6 grid gap-6 lg:grid-cols-2">
        {/* Trade Volume */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-base font-medium">Trade Volume Over Time</CardTitle>
            <Tabs value={volumePeriod} onValueChange={(v) => setVolumePeriod(v as Period)}>
              <TabsList className="h-8">
                <TabsTrigger value="7d" className="text-xs px-2">7d</TabsTrigger>
                <TabsTrigger value="30d" className="text-xs px-2">30d</TabsTrigger>
                <TabsTrigger value="90d" className="text-xs px-2">90d</TabsTrigger>
              </TabsList>
            </Tabs>
          </CardHeader>
          <CardContent>
            {volumeLoading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : (
              <ChartContainer config={volumeConfig} className="h-[250px] w-full">
                <AreaChart data={volumeData} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" className="stroke-border/40" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
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
          <CardHeader className="pb-2">
            <CardTitle className="text-base font-medium">Revenue & Trades (6 months)</CardTitle>
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
            <CardTitle className="text-base font-medium">User Growth (6 months)</CardTitle>
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
            <CardTitle className="text-base font-medium">Asset Distribution (All Time)</CardTitle>
          </CardHeader>
          <CardContent>
            {assetLoading ? (
              <Skeleton className="h-[250px] w-full" />
            ) : !assetData?.length ? (
              <p className="flex h-[250px] items-center justify-center text-sm text-muted-foreground">No trade data yet.</p>
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
