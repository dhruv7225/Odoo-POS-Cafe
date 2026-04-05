import React, { useEffect, useState } from "react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, TrendingUp, Award, Calendar, BarChart3 } from "lucide-react";
import {
  BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line,
} from "recharts";
import { dashboardApi, orderApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const COLORS = ["#FF6B35", "#FCA311", "#4A5568", "#38A169", "#E53E3E", "#3182CE", "#805AD5", "#D69E2E"];

type DashData = {
  totalSales: number; totalOrders: number; completedOrders: number;
  cancelledOrders: number; averageOrderValue: number;
  salesByPaymentMethod: Record<string, number>;
  topProducts: { productName: string; totalQty: number; totalRevenue: number }[];
  topCategories: { categoryName: string; totalQty: number; totalRevenue: number }[];
};

export const Analytics: React.FC = () => {
  const { restaurantId } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dash, setDash] = useState<DashData | null>(null);
  const [allOrders, setAllOrders] = useState<any[]>([]);
  const [dateFrom, setDateFrom] = useState(() => {
    const d = new Date(); d.setMonth(d.getMonth() - 1); return d.toISOString().split("T")[0];
  });
  const [dateTo, setDateTo] = useState(() => new Date().toISOString().split("T")[0]);

  useEffect(() => {
    if (!restaurantId) return;
    setLoading(true);
    Promise.all([
      dashboardApi.restaurant(restaurantId, dateFrom, dateTo),
      orderApi.listByRestaurant(restaurantId, { from: dateFrom, to: dateTo }),
    ]).then(([d, orders]) => {
      setDash(d as any);
      setAllOrders(orders);
    }).catch(() => {}).finally(() => setLoading(false));
  }, [restaurantId, dateFrom, dateTo]);

  // Compute analytics from orders
  const ordersByDay = (() => {
    const map: Record<string, { date: string; orders: number; revenue: number }> = {};
    allOrders.forEach(o => {
      const day = new Date(o.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric" });
      if (!map[day]) map[day] = { date: day, orders: 0, revenue: 0 };
      map[day].orders++;
      if (o.paymentStatus === "PAID") map[day].revenue += o.totalAmount;
    });
    return Object.values(map).slice(-14);
  })();

  const busiestDay = ordersByDay.reduce((max, d) => d.orders > (max?.orders || 0) ? d : max, ordersByDay[0]);

  const ordersByHour = (() => {
    const hours = Array.from({ length: 24 }, (_, i) => ({ hour: `${i}:00`, orders: 0 }));
    allOrders.forEach(o => { const h = new Date(o.createdAt).getHours(); hours[h].orders++; });
    return hours.filter(h => h.orders > 0);
  })();

  const peakHour = ordersByHour.reduce((max, h) => h.orders > (max?.orders || 0) ? h : max, ordersByHour[0]);

  const completionRate = dash && dash.totalOrders > 0 ? Math.round((dash.completedOrders / dash.totalOrders) * 100) : 0;

  const paymentData = dash ? Object.entries(dash.salesByPaymentMethod).map(([name, value]) => ({ name, value: Number(value) })) : [];

  if (loading) return (
    <AdminLayout><div className="flex items-center justify-center h-64"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div></AdminLayout>
  );

  return (
    <AdminLayout>
      <div className="w-full max-w-7xl mx-auto space-y-6">
        {/* Header + Date Range */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Analytics</h2>
            <p className="text-sm text-muted-foreground mt-1">Performance insights and trends</p>
          </div>
          <div className="flex items-center gap-3">
            <div>
              <Label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">From</Label>
              <Input type="date" value={dateFrom} onChange={e => setDateFrom(e.target.value)} className="h-9 rounded-xl text-sm w-36" />
            </div>
            <div>
              <Label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">To</Label>
              <Input type="date" value={dateTo} onChange={e => setDateTo(e.target.value)} className="h-9 rounded-xl text-sm w-36" />
            </div>
          </div>
        </div>

        {/* KPI Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="rounded-xl shadow-sm border-border/60">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-primary/10"><TrendingUp size={18} className="text-primary" /></div>
                <div><p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Revenue</p>
                  <p className="text-xl font-bold">₹{(dash?.totalSales || 0).toFixed(0)}</p></div>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-xl shadow-sm border-border/60">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-blue-100"><BarChart3 size={18} className="text-blue-600" /></div>
                <div><p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Avg Order</p>
                  <p className="text-xl font-bold">₹{(dash?.averageOrderValue || 0).toFixed(0)}</p></div>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-xl shadow-sm border-border/60">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-emerald-100"><Award size={18} className="text-emerald-600" /></div>
                <div><p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Completion</p>
                  <p className="text-xl font-bold">{completionRate}%</p></div>
              </div>
            </CardContent>
          </Card>
          <Card className="rounded-xl shadow-sm border-border/60">
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-xl bg-amber-100"><Calendar size={18} className="text-amber-600" /></div>
                <div><p className="text-[10px] text-muted-foreground font-medium uppercase tracking-wider">Busiest Day</p>
                  <p className="text-lg font-bold">{busiestDay?.date || "—"}</p>
                  <p className="text-[10px] text-muted-foreground">{busiestDay?.orders || 0} orders</p></div>
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Revenue by Day */}
          <Card className="rounded-xl shadow-sm border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Daily Revenue</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={ordersByDay} margin={{ top: 5, right: 10, left: -10, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#737373" }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#737373" }} tickFormatter={v => `₹${v}`} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }}
                      formatter={(v: any) => [`₹${Number(v).toFixed(0)}`, "Revenue"]} />
                    <Line type="monotone" dataKey="revenue" stroke="#FF6B35" strokeWidth={2.5} dot={{ r: 3, fill: "#fff", strokeWidth: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Orders by Day */}
          <Card className="rounded-xl shadow-sm border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Daily Orders</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ordersByDay} margin={{ top: 5, right: 10, left: -10, bottom: 5 }} barSize={24}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" />
                    <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#737373" }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#737373" }} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
                    <Bar dataKey="orders" fill="#FFEDD5" radius={[6, 6, 6, 6]} activeBar={{ fill: "#FF6B35" }} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Peak Hours */}
          <Card className="rounded-xl shadow-sm border-border/60">
            <CardHeader className="pb-2">
              <div className="flex items-center justify-between">
                <CardTitle className="text-base">Peak Hours</CardTitle>
                {peakHour && <Badge variant="outline" className="text-xs">Peak: {peakHour.hour} ({peakHour.orders} orders)</Badge>}
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[260px]">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={ordersByHour} margin={{ top: 5, right: 10, left: -10, bottom: 5 }} barSize={16}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" />
                    <XAxis dataKey="hour" axisLine={false} tickLine={false} tick={{ fontSize: 10, fill: "#737373" }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 11, fill: "#737373" }} />
                    <Tooltip contentStyle={{ borderRadius: 12, border: "none", boxShadow: "0 4px 12px rgba(0,0,0,0.1)" }} />
                    <Bar dataKey="orders" fill="#3182CE" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Payment Methods Pie */}
          <Card className="rounded-xl shadow-sm border-border/60">
            <CardHeader className="pb-2">
              <CardTitle className="text-base">Payment Methods</CardTitle>
            </CardHeader>
            <CardContent>
              {paymentData.length > 0 ? (
                <div className="h-[260px] relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie data={paymentData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} paddingAngle={3} dataKey="value" stroke="none">
                        {paymentData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                      </Pie>
                      <Tooltip contentStyle={{ borderRadius: 12, border: "none" }} formatter={(v: any) => [`₹${Number(v).toFixed(0)}`, ""]} />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="text-center">
                      <p className="text-2xl font-bold">₹{(dash?.totalSales || 0).toFixed(0)}</p>
                      <p className="text-[10px] text-muted-foreground">Total</p>
                    </div>
                  </div>
                </div>
              ) : <p className="text-center py-16 text-muted-foreground text-sm">No payment data</p>}
              <div className="flex flex-wrap gap-3 mt-2 justify-center">
                {paymentData.map((d, i) => (
                  <div key={d.name} className="flex items-center gap-1.5 text-xs">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: COLORS[i % COLORS.length] }} />
                    <span className="text-muted-foreground">{d.name}</span>
                    <span className="font-semibold">₹{d.value.toFixed(0)}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Top Products & Categories */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="rounded-xl shadow-sm border-border/60">
            <CardHeader className="pb-3"><CardTitle className="text-base">Top Products</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {dash?.topProducts?.slice(0, 8).map((p, i) => (
                <div key={p.productName} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{p.productName}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-[10px] text-muted-foreground">{p.totalQty} sold</span>
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(p.totalQty / (dash.topProducts[0]?.totalQty || 1)) * 100}%` }} />
                      </div>
                    </div>
                  </div>
                  <span className="text-sm font-bold text-primary shrink-0">₹{p.totalRevenue.toFixed(0)}</span>
                </div>
              ))}
              {(!dash?.topProducts?.length) && <p className="text-center py-6 text-muted-foreground text-sm">No data</p>}
            </CardContent>
          </Card>

          <Card className="rounded-xl shadow-sm border-border/60">
            <CardHeader className="pb-3"><CardTitle className="text-base">Top Categories</CardTitle></CardHeader>
            <CardContent className="space-y-3">
              {dash?.topCategories?.slice(0, 8).map((c, i) => (
                <div key={c.categoryName} className="flex items-center gap-3">
                  <span className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: COLORS[i % COLORS.length] + "20", color: COLORS[i % COLORS.length] }}>{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{c.categoryName}</p>
                    <div className="flex items-center gap-3 mt-0.5">
                      <span className="text-[10px] text-muted-foreground">{c.totalQty} items</span>
                      <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden">
                        <div className="h-full rounded-full transition-all" style={{ width: `${(c.totalQty / (dash.topCategories[0]?.totalQty || 1)) * 100}%`, backgroundColor: COLORS[i % COLORS.length] }} />
                      </div>
                    </div>
                  </div>
                  <span className="text-sm font-bold shrink-0" style={{ color: COLORS[i % COLORS.length] }}>₹{c.totalRevenue.toFixed(0)}</span>
                </div>
              ))}
              {(!dash?.topCategories?.length) && <p className="text-center py-6 text-muted-foreground text-sm">No data</p>}
            </CardContent>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
};
