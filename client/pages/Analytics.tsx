import type { ReactElement } from "react";
import { useQuery } from "@tanstack/react-query";
import { type AnalyticsSummary, type ApiResponse } from "@shared/api";
import { AppShell } from "@/components/app-shell";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Download, LineChart, Radar, Sparkles } from "lucide-react";

const COLORS = ["#f97316", "#0ea5e9", "#22c55e", "#a855f7", "#ef4444", "#f59e0b"];

export default function Analytics() {
  const { data: analyticsResponse, isLoading } = useQuery<ApiResponse<AnalyticsSummary>>({
    queryKey: ["analytics"],
    queryFn: async () => {
      const response = await fetch("/api/analytics/summary");
      if (!response.ok) throw new Error("Failed to fetch analytics");
      return response.json();
    },
  });

  const summary = analyticsResponse?.data;

  return (
    <AppShell
      title="Analytics Studio"
      description="Track revenue projection, member value, point-code activity, menu specials, and access-model signals from one reporting surface."
      actions={
        <Button>
          <Download className="mr-2 h-4 w-4" />
          Export snapshot
        </Button>
      }
    >
      <section className="grid gap-5 xl:grid-cols-4">
        {summary?.metrics.map((metric) => (
          <Card key={metric.label} className="border-border/60 bg-card/90 shadow-lg">
            <CardContent className="p-5">
              <div className="text-xs font-bold uppercase tracking-[0.22em] text-muted-foreground">{metric.label}</div>
              <div className="mt-2 text-3xl font-black tracking-tight">{metric.value}</div>
              <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <Badge variant={metric.trend === "up" ? "default" : metric.trend === "down" ? "destructive" : "secondary"}>
                  {metric.change}% vs prior
                </Badge>
                <span>{metric.trend}</span>
              </div>
            </CardContent>
          </Card>
        ))}
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <Card className="border-border/60 bg-card/90 shadow-xl">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-2xl font-black tracking-tight">Revenue + member growth</CardTitle>
              <p className="text-sm text-muted-foreground">Projected order contribution against acquisition momentum.</p>
            </div>
            <Badge variant="outline" className="rounded-full px-3 py-1">
              Combined view
            </Badge>
          </CardHeader>
          <CardContent className="grid gap-6 lg:grid-cols-2">
            <ChartCard title="Revenue projection">
              <AreaChart data={summary?.revenueData}>
                <defs>
                  <linearGradient id="revenue-fill" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f97316" stopOpacity={0.28} />
                    <stop offset="95%" stopColor="#f97316" stopOpacity={0.02} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip />
                <Area type="monotone" dataKey="value" stroke="#f97316" fill="url(#revenue-fill)" strokeWidth={3} />
              </AreaChart>
            </ChartCard>

            <ChartCard title="Member growth">
              <BarChart data={summary?.memberGrowthData}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="value" radius={[10, 10, 0, 0]} fill="#0ea5e9" />
              </BarChart>
            </ChartCard>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-slate-950 text-white shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl font-black tracking-tight">
              <Sparkles className="h-5 w-5 text-amber-300" />
              Live operating signals
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {summary?.activityFeed.map((item) => (
              <div key={item.id} className="rounded-3xl border border-white/10 bg-white/5 p-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="font-bold text-white">{item.title}</div>
                  <Badge variant="outline" className="border-white/20 text-slate-200">
                    {item.category}
                  </Badge>
                </div>
                <p className="mt-2 text-sm text-slate-300">{item.detail}</p>
                <div className="mt-3 text-xs uppercase tracking-[0.22em] text-slate-500">{item.time}</div>
              </div>
            ))}
          </CardContent>
        </Card>
      </section>

      <section className="mt-8 grid gap-6 xl:grid-cols-3">
        <Card className="border-border/60 bg-card/90 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl font-black tracking-tight">
              <Radar className="h-5 w-5 text-primary" />
              Channel mix
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-[280px]">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={summary?.channelMixData} dataKey="value" nameKey="name" innerRadius={65} outerRadius={92}>
                    {summary?.channelMixData.map((item, index) => (
                      <Cell key={item.name} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="mt-4 space-y-2 text-sm">
              {summary?.channelMixData.map((item, index) => (
                <div key={item.name} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-2.5 w-2.5 rounded-full" style={{ backgroundColor: COLORS[index % COLORS.length] }} />
                    <span className="text-muted-foreground">{item.name}</span>
                  </div>
                  <span className="font-bold">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/90 shadow-xl">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-2xl font-black tracking-tight">
              <LineChart className="h-5 w-5 text-primary" />
              Tier distribution
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ChartCard title="Loyalty tiers" height={280}>
              <BarChart data={summary?.tierDistributionData} layout="vertical">
                <CartesianGrid horizontal={false} strokeDasharray="3 3" />
                <XAxis type="number" tickLine={false} axisLine={false} />
                <YAxis type="category" dataKey="name" tickLine={false} axisLine={false} width={80} />
                <Tooltip />
                <Bar dataKey="value" radius={[0, 10, 10, 0]} fill="#22c55e" />
              </BarChart>
            </ChartCard>
          </CardContent>
        </Card>

        <Card className="border-border/60 bg-card/90 shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl font-black tracking-tight">Location performance</CardTitle>
          </CardHeader>
          <CardContent>
            <ChartCard title="Spend by favorite location" height={280}>
              <BarChart data={summary?.locationPerformanceData}>
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis dataKey="name" tickLine={false} axisLine={false} />
                <YAxis tickLine={false} axisLine={false} />
                <Tooltip />
                <Bar dataKey="value" radius={[10, 10, 0, 0]} fill="#a855f7" />
              </BarChart>
            </ChartCard>
          </CardContent>
        </Card>
      </section>
    </AppShell>
  );
}

function ChartCard({
  title,
  children,
  height = 240,
}: {
  title: string;
  children: ReactElement;
  height?: number;
}) {
  return (
    <div>
      <div className="mb-3 text-sm font-bold text-foreground">{title}</div>
      <div style={{ height }}>
        <ResponsiveContainer width="100%" height="100%">
          {children}
        </ResponsiveContainer>
      </div>
    </div>
  );
}
