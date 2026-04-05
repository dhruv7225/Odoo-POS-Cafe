import React, { useEffect, useState } from "react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  ArrowUpRight, Package, DollarSign,
  ChevronDown, CheckCircle, Clock, XCircle
} from "lucide-react";
import {
  LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer
} from "recharts";
import { revenueData } from "@/lib/mockData";
import { dashboardApi, orderApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const DONUT_COLORS = ['#FF6B35', '#FCA311', '#4A5568', '#A0AEC0', '#E53E3E', '#38A169'];

type DashData = {
  totalSales: number; totalOrders: number; completedOrders: number;
  pendingOrders: number; cancelledOrders: number; averageOrderValue: number;
  salesByPaymentMethod: Record<string, number>;
  topProducts: { productName: string; totalQty: number; totalRevenue: number }[];
  topCategories: { categoryName: string; totalQty: number; totalRevenue: number }[];
};

type RecentOrder = {
  id: number; orderNo: string; tableNo: string | null; totalAmount: number;
  status: string; paymentStatus: string; createdAt: string;
  items: { productName: string; qty: number }[];
};

export const Dashboard: React.FC = () => {
  const { restaurantId } = useAuth();
  const [dash, setDash] = useState<DashData | null>(null);
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([]);

  useEffect(() => {
    if (!restaurantId) return;
    dashboardApi.restaurant(restaurantId).then((d) => setDash(d as any)).catch(() => {});
    orderApi.listByRestaurant(restaurantId).then((orders) => setRecentOrders(orders.slice(0, 6) as any)).catch(() => {});
  }, [restaurantId]);

  const topCategoriesData = dash?.topCategories?.map((c) => ({
    name: c.categoryName,
    value: c.totalQty,
  })) || [];

  return (
    <AdminLayout>
      <div className="flex flex-col lg:flex-row gap-6 w-full max-w-7xl mx-auto">

        {/* Main Content Column */}
        <div className="flex-1 space-y-6 min-w-0">

          {/* Header */}
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-bold tracking-tight text-foreground">Dashboard</h2>
              <p className="text-sm text-muted-foreground mt-1">Hello Admin, welcome back!</p>
            </div>
            <div className="relative">
              <div className="flex items-center gap-2 bg-card border border-border px-4 py-2 rounded-full cursor-pointer shadow-sm hover:bg-accent transition-colors">
                <SearchIcon />
                <span className="text-sm text-muted-foreground mr-6">Search anything</span>
              </div>
            </div>
          </div>

          {/* KPI Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="rounded-xl shadow-sm border-border/60">
              <CardContent className="p-5 flex items-start gap-4">
                <div className="bg-orange-500 p-3 rounded-xl shadow-sm shadow-orange-200">
                  <Package className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Total Orders</p>
                  <div className="flex items-end gap-2 mt-1">
                    <h3 className="text-2xl font-bold">{dash?.totalOrders ?? 0}</h3>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-xl shadow-sm border-border/60">
              <CardContent className="p-5 flex items-start gap-4">
                <div className="bg-orange-600 p-3 rounded-xl shadow-sm shadow-orange-200">
                  <CheckCircle className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Completed</p>
                  <div className="flex items-end gap-2 mt-1">
                    <h3 className="text-2xl font-bold">{dash?.completedOrders ?? 0}</h3>
                    {dash && dash.totalOrders > 0 && (
                      <Badge variant="outline" className="text-emerald-500 bg-emerald-50 border-emerald-100 flex items-center gap-1 mb-1 shadow-none rounded-md px-1.5 py-0">
                        <ArrowUpRight className="h-3 w-3" /> {Math.round((dash.completedOrders / dash.totalOrders) * 100)}%
                      </Badge>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-xl shadow-sm border-border/60">
              <CardContent className="p-5 flex items-start gap-4">
                <div className="bg-orange-500 p-3 rounded-xl shadow-sm shadow-orange-200">
                  <DollarSign className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Total Revenue</p>
                  <div className="flex items-end gap-2 mt-1">
                    <h3 className="text-2xl font-bold">₹{dash?.totalSales?.toFixed(2) ?? "0.00"}</h3>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Total Revenue Line Chart (mock data — would need historical API) */}
          <Card className="rounded-xl shadow-sm border-border/60">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-lg">Total Revenue</CardTitle>
                <div className="text-2xl font-bold mt-1">₹{dash?.totalSales?.toFixed(2) ?? "0.00"}</div>
              </div>
              <div className="relative">
                <select className="appearance-none bg-accent/50 hover:bg-accent text-xs font-semibold py-1.5 pl-3 pr-8 rounded-lg cursor-pointer outline-none border-0 text-foreground transition-colors">
                  <option>Last 8 Months</option>
                  <option>Last 6 Months</option>
                  <option>This Year</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-end gap-4 text-xs font-medium mb-4">
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-orange-500"></span> Income</div>
                <div className="flex items-center gap-1.5"><span className="w-2 h-2 rounded-full bg-gray-700"></span> Expense</div>
              </div>
              <div className="h-[220px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={revenueData} margin={{ top: 5, right: 10, left: -20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#737373' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#737373' }} tickFormatter={(value) => `${value/1000}k`} />
                    <Tooltip
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)' }}
                      formatter={(value: any, name: any) => [`₹${Number(value).toLocaleString()}`, String(name).charAt(0).toUpperCase() + String(name).slice(1)]}
                      cursor={{ stroke: '#fca311', strokeWidth: 1, strokeDasharray: '5 5' }}
                    />
                    <Line type="monotone" dataKey="income" stroke="#FF6B35" strokeWidth={3} dot={{ r: 4, fill: '#fff', strokeWidth: 2 }} activeDot={{ r: 6, stroke: '#FF6B35', strokeWidth: 2, fill: '#fff' }} />
                    <Line type="monotone" dataKey="expense" stroke="#4A5568" strokeWidth={3} dot={false} activeDot={{ r: 6, stroke: '#4A5568', strokeWidth: 2, fill: '#fff' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Recent Orders — from real API */}
          <Card className="rounded-xl shadow-sm border-border/60 overflow-hidden">
            <div className="p-6 border-b border-border/50 flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Recent Orders</CardTitle>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/20">
                  <tr>
                    <th className="px-6 py-4 font-medium tracking-wider">Order</th>
                    <th className="px-6 py-4 font-medium tracking-wider">Table</th>
                    <th className="px-6 py-4 font-medium tracking-wider">Items</th>
                    <th className="px-6 py-4 font-medium tracking-wider">Amount</th>
                    <th className="px-6 py-4 font-medium tracking-wider">Status</th>
                    <th className="px-6 py-4 font-medium tracking-wider">Payment</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {recentOrders.map((order) => (
                    <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-medium text-foreground">{order.orderNo}</td>
                      <td className="px-6 py-4">{order.tableNo || "—"}</td>
                      <td className="px-6 py-4 text-xs text-muted-foreground max-w-[200px] truncate">
                        {order.items?.map((i) => `${i.qty}× ${i.productName}`).join(", ")}
                      </td>
                      <td className="px-6 py-4 font-semibold">₹{order.totalAmount?.toFixed(2)}</td>
                      <td className="px-6 py-4">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border
                          ${order.status === "COMPLETED" ? "bg-emerald-50 text-emerald-600 border-emerald-200"
                          : order.status === "CANCELLED" ? "bg-gray-100 text-gray-600 border-gray-200"
                          : "bg-orange-50 text-orange-600 border-orange-200"}
                        `}>
                          {order.status === "COMPLETED" && <CheckCircle className="w-3.5 h-3.5" />}
                          {order.status !== "COMPLETED" && order.status !== "CANCELLED" && <Clock className="w-3.5 h-3.5" />}
                          {order.status === "CANCELLED" && <XCircle className="w-3.5 h-3.5" />}
                          {order.status}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <Badge className={`text-[10px] ${order.paymentStatus === "PAID" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>
                          {order.paymentStatus}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                  {recentOrders.length === 0 && (
                    <tr><td colSpan={6} className="px-6 py-8 text-center text-muted-foreground">No orders today</td></tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right Sidebar Column */}
        <div className="w-full lg:w-[340px] shrink-0 space-y-6">

          {/* Top Categories Donut — from real API */}
          <Card className="rounded-xl shadow-sm border-border/60">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">Top Categories</CardTitle>
            </CardHeader>
            <CardContent>
              {topCategoriesData.length > 0 ? (
                <>
                  <div className="h-[200px] w-full relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={topCategoriesData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={80}
                          paddingAngle={2}
                          dataKey="value"
                          stroke="none"
                        >
                          {topCategoriesData.map((_, index) => (
                            <Cell key={`cell-${index}`} fill={DONUT_COLORS[index % DONUT_COLORS.length]} />
                          ))}
                        </Pie>
                        <Tooltip contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)' }} />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                      <div className="text-center">
                        <span className="block text-2xl font-bold">{dash?.totalOrders ?? 0}</span>
                        <span className="block text-xs text-muted-foreground">Orders</span>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-y-3 gap-x-2 mt-4 px-2">
                    {topCategoriesData.map((cat, idx) => (
                      <div key={cat.name} className="flex items-center gap-2 text-sm">
                        <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: DONUT_COLORS[idx] }}></span>
                        <span className="text-muted-foreground font-medium truncate">{cat.name}</span>
                        <span className="font-semibold ml-auto">{cat.value}</span>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <p className="text-center py-8 text-muted-foreground text-sm">No data yet</p>
              )}
            </CardContent>
          </Card>

          {/* Top Products */}
          <Card className="rounded-xl shadow-sm border-border/60">
            <CardHeader className="pb-4">
              <CardTitle className="text-base">Top Products</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {dash?.topProducts?.slice(0, 5).map((item) => (
                <div key={item.productName} className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-sm">{item.productName}</p>
                    <p className="text-xs text-muted-foreground">{item.totalQty} sold</p>
                  </div>
                  <span className="font-bold text-orange-500">₹{item.totalRevenue.toFixed(0)}</span>
                </div>
              ))}
              {(!dash?.topProducts || dash.topProducts.length === 0) && (
                <p className="text-center py-4 text-muted-foreground text-sm">No data yet</p>
              )}
            </CardContent>
          </Card>

          {/* Payment Methods Breakdown */}
          {dash?.salesByPaymentMethod && Object.keys(dash.salesByPaymentMethod).length > 0 && (
            <Card className="rounded-xl shadow-sm border-border/60">
              <CardHeader className="pb-4">
                <CardTitle className="text-base">Payment Methods</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {Object.entries(dash.salesByPaymentMethod).map(([method, amount]) => (
                  <div key={method} className="flex items-center justify-between">
                    <span className="text-sm font-medium">{method}</span>
                    <span className="font-bold text-sm">₹{Number(amount).toFixed(2)}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

const SearchIcon = () => (
  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-muted-foreground">
    <circle cx="11" cy="11" r="8"></circle>
    <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
  </svg>
);
