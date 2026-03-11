import { Link } from "react-router-dom";
import { ArrowLeft, BarChart3, TrendingUp, TrendingDown, Minus, Download, Calendar } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { AnalyticsSummary, ApiResponse } from "@shared/api";
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { BrandMark } from "@/components/brand-mark";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useBranding } from "@/lib/branding";

const COLORS = ["#f59e0b", "#3b82f6", "#10b981", "#ef4444", "#8b5cf6"];

export default function Analytics() {
  const { brand } = useBranding();
  const { data: analyticsResponse, isLoading } = useQuery<ApiResponse<AnalyticsSummary>>({
    queryKey: ["analytics"],
    queryFn: async () => {
      const response = await fetch("/api/analytics/summary");
      if (!response.ok) throw new Error("Failed to fetch analytics");
      return response.json();
    },
  });

  const data = analyticsResponse?.data;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-muted pb-12">
      {/* Header */}
      <header className="border-b border-border bg-card shadow-sm sticky top-0 z-10 backdrop-blur-sm bg-card/80">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link to="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
              <BrandMark
                image={brand.logoImage}
                text={brand.logo}
                label={`${brand.name} logo`}
                primary={brand.primary}
                accent={brand.accent}
                className="h-10 w-10 rounded-lg"
                imageClassName="object-contain bg-white p-1.5"
                textClassName="text-[11px]"
              />
              <div>
                <h1 className="text-xl font-bold text-foreground tracking-tight">{brand.name}</h1>
                <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-black">Analytics Dashboard</p>
              </div>
            </Link>
            <div className="flex items-center gap-3">
              <Button variant="outline" size="sm" className="hidden sm:flex items-center gap-2">
                <Calendar className="h-4 w-4" />
                Last 30 Days
              </Button>
              <Button size="sm" className="items-center gap-2">
                <Download className="h-4 w-4" />
                Export Data
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Breadcrumb & Intro */}
        <div className="mb-8">
          <Link to="/" className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4">
            <ArrowLeft className="h-4 w-4" />
            Back to Dashboard
          </Link>
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <h2 className="text-3xl font-black text-foreground tracking-tight">Platform Insights</h2>
              <p className="text-muted-foreground">Monitor your restaurant's digital growth and engagement.</p>
            </div>
          </div>
        </div>

        {/* Metric Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {isLoading ? (
            Array(4).fill(0).map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader className="h-16 bg-muted/50" />
                <CardContent className="h-12 bg-muted/20" />
              </Card>
            ))
          ) : (
            data?.metrics.map((metric, i) => (
              <Card key={i} className="border-border/60 shadow-sm hover:shadow-md transition-shadow">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-bold text-muted-foreground uppercase tracking-wider">{metric.label}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-black">{metric.value}</div>
                  <div className="flex items-center gap-1 mt-1">
                    {metric.trend === "up" ? (
                      <TrendingUp className="h-3 w-3 text-green-500" />
                    ) : metric.trend === "down" ? (
                      <TrendingDown className="h-3 w-3 text-red-500" />
                    ) : (
                      <Minus className="h-3 w-3 text-muted-foreground" />
                    )}
                    <span className={`text-[10px] font-bold ${metric.trend === "up" ? "text-green-500" : metric.trend === "down" ? "text-red-500" : "text-muted-foreground"}`}>
                      {metric.change}% from last period
                    </span>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>

        {/* Charts Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
          {/* Revenue Chart */}
          <Card className="border-border/60 shadow-lg overflow-hidden">
            <CardHeader className="bg-muted/5 p-6 border-b border-border/40">
              <CardTitle className="text-lg font-bold">Revenue Growth</CardTitle>
              <CardDescription>Monthly performance analytics across all locations.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={data?.revenueData}>
                  <defs>
                    <linearGradient id="colorValue" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#f59e0b" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `$${value}`} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#fff", borderRadius: "8px", border: "1px solid #e2e8f0", boxShadow: "0 4px 6px -1px rgb(0 0 0 / 0.1)" }}
                    itemStyle={{ color: "#f59e0b", fontWeight: "bold" }}
                  />
                  <Area type="monotone" dataKey="value" stroke="#f59e0b" strokeWidth={3} fillOpacity={1} fill="url(#colorValue)" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Member Growth Chart */}
          <Card className="border-border/60 shadow-lg overflow-hidden">
            <CardHeader className="bg-muted/5 p-6 border-b border-border/40">
              <CardTitle className="text-lg font-bold">Member Acquisition</CardTitle>
              <CardDescription>Loyalty program registration velocity by week.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 h-[350px]">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={data?.memberGrowthData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} dy={10} />
                  <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip />
                  <Line type="monotone" dataKey="value" stroke="#3b82f6" strokeWidth={4} dot={{ r: 6, fill: "#3b82f6", strokeWidth: 2, stroke: "#fff" }} activeDot={{ r: 8 }} />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Pie Chart & Activity */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Top Selling Categories */}
          <Card className="lg:col-span-1 border-border/60 shadow-lg flex flex-col">
            <CardHeader className="bg-muted/5 p-6 border-b border-border/40">
              <CardTitle className="text-lg font-bold">Menu Distribution</CardTitle>
              <CardDescription>Top selling items by volume.</CardDescription>
            </CardHeader>
            <CardContent className="p-6 flex-1 flex flex-col justify-center">
              <div className="h-[250px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={data?.topItemsData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {data?.topItemsData.map((_, index) => (
                        <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 mt-4">
                {data?.topItemsData.map((item, i) => (
                  <div key={i} className="flex items-center justify-between text-xs font-bold">
                    <div className="flex items-center gap-2">
                      <div className="h-2 w-2 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                      <span className="text-muted-foreground">{item.name}</span>
                    </div>
                    <span>{item.value} units</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity Card */}
          <Card className="lg:col-span-2 border-border/60 shadow-lg overflow-hidden">
             <CardHeader className="bg-muted/5 p-6 border-b border-border/40">
              <CardTitle className="text-lg font-bold">Platform Activity</CardTitle>
              <CardDescription>Live feed of loyalty and menu events.</CardDescription>
            </CardHeader>
            <CardContent className="p-0">
               <div className="divide-y divide-border">
                {[
                  { action: "Points Earned", user: "John Doe", detail: "+150 pts (Signature Burger)", time: "2 mins ago", icon: "✨" },
                  { action: "New Member", user: "Sarah Smith", detail: "Joined 'Standard Loyalty'", time: "15 mins ago", icon: "👤" },
                  { action: "Reward Redeemed", user: "Mike J.", detail: "-500 pts (Free Appetizer)", time: "42 mins ago", icon: "🎁" },
                  { action: "Menu Updated", user: "Admin", detail: "Updated 'Main Menu' items", time: "1 hour ago", icon: "📜" },
                  { action: "Points Earned", user: "Jane D.", detail: "+85 pts (Caesar Salad)", time: "3 hours ago", icon: "✨" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center justify-between p-4 hover:bg-muted/20 transition-colors">
                    <div className="flex items-center gap-4">
                      <div className="h-10 w-10 rounded-full bg-muted flex items-center justify-center text-lg">{item.icon}</div>
                      <div>
                        <div className="text-sm font-black text-foreground">{item.action}</div>
                        <div className="text-xs text-muted-foreground font-semibold">{item.user} — {item.detail}</div>
                      </div>
                    </div>
                    <div className="text-[10px] font-black uppercase text-muted-foreground tracking-widest">{item.time}</div>
                  </div>
                ))}
              </div>
              <div className="p-4 bg-muted/10 border-t border-border flex justify-center">
                <Button variant="ghost" size="sm" className="font-black text-[10px] uppercase tracking-widest">View Full Logs</Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
