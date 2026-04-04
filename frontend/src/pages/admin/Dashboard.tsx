import React from "react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  ArrowUpRight, Package, Users, DollarSign, 
  ChevronDown, Utensils, Smartphone, CheckCircle, Clock, XCircle 
} from "lucide-react";
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from "recharts";
import { kpiMetrics, revenueData, weeklyOrdersData, topCategoriesData, orderTypesData, trendingMenu, recentOrders } from "@/lib/mockData";

const DONUT_COLORS = ['#FF6B35', '#FCA311', '#4A5568', '#A0AEC0'];

export const Dashboard: React.FC = () => {
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
                    <h3 className="text-2xl font-bold">{kpiMetrics.totalOrders.value}</h3>
                    <Badge variant="outline" className="text-emerald-500 bg-emerald-50 border-emerald-100 flex items-center gap-1 mb-1 shadow-none rounded-md px-1.5 py-0">
                      <ArrowUpRight className="h-3 w-3" /> {kpiMetrics.totalOrders.change}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-xl shadow-sm border-border/60">
              <CardContent className="p-5 flex items-start gap-4">
                <div className="bg-orange-600 p-3 rounded-xl shadow-sm shadow-orange-200">
                  <Users className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-muted-foreground">Total Customer</p>
                  <div className="flex items-end gap-2 mt-1">
                    <h3 className="text-2xl font-bold">{kpiMetrics.totalCustomers.value}</h3>
                    <Badge variant="outline" className="text-emerald-500 bg-emerald-50 border-emerald-100 flex items-center gap-1 mb-1 shadow-none rounded-md px-1.5 py-0">
                      <ArrowUpRight className="h-3 w-3" /> {kpiMetrics.totalCustomers.change}
                    </Badge>
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
                    <h3 className="text-2xl font-bold">{kpiMetrics.totalRevenue.value}</h3>
                    <Badge variant="outline" className="text-emerald-500 bg-emerald-50 border-emerald-100 flex items-center gap-1 mb-1 shadow-none rounded-md px-1.5 py-0">
                      <ArrowUpRight className="h-3 w-3" /> {kpiMetrics.totalRevenue.change}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Total Revenue Line Chart */}
          <Card className="rounded-xl shadow-sm border-border/60">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <div>
                <CardTitle className="text-lg">Total Revenue</CardTitle>
                <div className="text-2xl font-bold mt-1">$184,839</div>
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
                      formatter={(value: any, name: any) => [`$${Number(value).toLocaleString()}`, String(name).charAt(0).toUpperCase() + String(name).slice(1)]}
                      cursor={{ stroke: '#fca311', strokeWidth: 1, strokeDasharray: '5 5' }}
                    />
                    <Line type="monotone" dataKey="income" stroke="#FF6B35" strokeWidth={3} dot={{ r: 4, fill: '#fff', strokeWidth: 2 }} activeDot={{ r: 6, stroke: '#FF6B35', strokeWidth: 2, fill: '#fff' }} />
                    <Line type="monotone" dataKey="expense" stroke="#4A5568" strokeWidth={3} dot={false} activeDot={{ r: 6, stroke: '#4A5568', strokeWidth: 2, fill: '#fff' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Orders Overview Bar Chart */}
          <Card className="rounded-xl shadow-sm border-border/60">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-lg">Orders Overview</CardTitle>
              <div className="relative">
                <select className="appearance-none bg-accent/50 hover:bg-accent text-xs font-semibold py-1.5 pl-3 pr-8 rounded-lg cursor-pointer outline-none border-0 text-foreground transition-colors">
                  <option>This Week</option>
                  <option>Last Week</option>
                  <option>This Month</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              </div>
            </CardHeader>
            <CardContent>
              <div className="h-[200px] w-full mt-2">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyOrdersData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }} barSize={32}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E5E5E5" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#737373' }} dy={10} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#737373' }} />
                    <Tooltip 
                      cursor={{ fill: 'transparent' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)', backgroundColor: '#111827', color: '#fff' }}
                      itemStyle={{ color: '#fff' }}
                      formatter={(value: any) => [`${value} orders`, '']}
                      labelStyle={{ display: 'none' }}
                    />
                    <Bar dataKey="orders" fill="#FFEDD5" radius={[6, 6, 6, 6]} activeBar={<rect fill="#FF6B35" rx={6} ry={6} />} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </CardContent>
          </Card>

          {/* Recent Orders */}
          <Card className="rounded-xl shadow-sm border-border/60 overflow-hidden">
            <div className="p-6 border-b border-border/50 flex flex-row items-center justify-between">
              <CardTitle className="text-lg">Recent Orders</CardTitle>
              <div className="flex items-center gap-3">
                <div className="relative hidden sm:block">
                  <select className="appearance-none bg-accent/50 hover:bg-accent text-xs font-semibold py-1.5 pl-3 pr-8 rounded-lg cursor-pointer outline-none border-0 text-foreground transition-colors">
                    <option>This Week</option>
                    <option>Last Week</option>
                  </select>
                  <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                </div>
                <button className="text-xs font-semibold text-primary bg-primary/10 hover:bg-primary/20 px-3 py-1.5 rounded-lg transition-colors">
                  See All Orders
                </button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/20">
                  <tr>
                    <th className="px-6 py-4 font-medium tracking-wider">Order ID</th>
                    <th className="px-6 py-4 font-medium tracking-wider">Menu</th>
                    <th className="px-6 py-4 font-medium tracking-wider">Qty</th>
                    <th className="px-6 py-4 font-medium tracking-wider">Amount</th>
                    <th className="px-6 py-4 font-medium tracking-wider">Customer</th>
                    <th className="px-6 py-4 font-medium tracking-wider">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {recentOrders.slice(0, 4).map((order) => (
                    <tr key={order.id} className="hover:bg-muted/30 transition-colors">
                      <td className="px-6 py-4 font-medium text-foreground">{order.id}</td>
                      <td className="px-6 py-4 min-w-[200px]">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                            <img src={trendingMenu[Math.floor(Math.random() * trendingMenu.length)].image} alt="" className="object-cover h-full w-full opacity-90" />
                          </div>
                          <div>
                            <p className="font-medium text-foreground">{order.item}</p>
                            <p className="text-xs text-muted-foreground mt-0.5">Category</p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 font-medium">{order.quantity}</td>
                      <td className="px-6 py-4 font-semibold">{order.amount}</td>
                      <td className="px-6 py-4 text-foreground">{order.customer}</td>
                      <td className="px-6 py-4">
                        <div className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border
                          ${order.status === "Completed" ? "bg-emerald-50 text-emerald-600 border-emerald-200" 
                          : order.status === "Pending" ? "bg-orange-50 text-orange-600 border-orange-200" 
                          : "bg-gray-100 text-gray-600 border-gray-200"}
                        `}>
                          {order.status === "Completed" && <CheckCircle className="w-3.5 h-3.5" />}
                          {order.status === "Pending" && <Clock className="w-3.5 h-3.5" />}
                          {order.status === "Cancelled" && <XCircle className="w-3.5 h-3.5" />}
                          {order.status === "Pending" ? "On Process" : order.status}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        {/* Right Sidebar Column */}
        <div className="w-full lg:w-[340px] shrink-0 space-y-6">

          {/* Top Categories Donut */}
          <Card className="rounded-xl shadow-sm border-border/60">
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-base">Top Categories</CardTitle>
              <div className="relative">
                <select className="appearance-none bg-accent/50 hover:bg-accent text-xs font-semibold py-1.5 pl-3 pr-8 rounded-lg cursor-pointer outline-none border-0 text-foreground transition-colors">
                  <option>This Month</option>
                  <option>Last Month</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              </div>
            </CardHeader>
            <CardContent>
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
                {/* Center text for Donut */}
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="text-center">
                    <span className="block text-2xl font-bold">{orderTypesData.reduce((acc, curr) => acc + curr.value, 0)}</span>
                    <span className="block text-xs text-muted-foreground">Orders</span>
                  </div>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-y-3 gap-x-2 mt-4 px-2">
                {topCategoriesData.map((cat, idx) => (
                  <div key={cat.name} className="flex items-center gap-2 text-sm">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: DONUT_COLORS[idx] }}></span>
                    <span className="text-muted-foreground font-medium">{cat.name}</span>
                    <span className="font-semibold ml-auto">{cat.value}%</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* Order Types List */}
          <Card className="rounded-xl shadow-sm border-border/60">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-base">Order Types</CardTitle>
              <div className="relative">
                <select className="appearance-none bg-accent/50 hover:bg-accent text-xs font-semibold py-1.5 pl-3 pr-8 rounded-lg cursor-pointer outline-none border-0 text-foreground transition-colors">
                  <option>This Month</option>
                  <option>Last Month</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              </div>
            </CardHeader>
            <CardContent className="space-y-5">
              {orderTypesData.map((type, idx) => (
                <div key={type.name} className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center shrink-0 border border-orange-100">
                    {idx === 0 && <Utensils className="h-5 w-5 text-orange-500" />}
                    {idx === 1 && <Package className="h-5 w-5 text-orange-500" />}
                    {idx === 2 && <Smartphone className="h-5 w-5 text-orange-500" />}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-end mb-1.5">
                      <p className="text-sm font-semibold text-foreground">{type.name} <span className="text-muted-foreground ml-1 font-medium">{type.percentage}%</span></p>
                      <span className="text-sm font-bold text-foreground">{type.value}</span>
                    </div>
                    {/* Progress Bar styled like reference */}
                    <div className="h-2 w-full bg-muted rounded-full overflow-hidden">
                      <div className="h-full bg-orange-500 rounded-full" style={{ width: `${type.percentage}%` }}></div>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

          {/* Trending Menus */}
          <Card className="rounded-xl shadow-sm border-border/60">
            <CardHeader className="flex flex-row items-center justify-between pb-4">
              <CardTitle className="text-base">Trending Menus</CardTitle>
              <div className="relative">
                <select className="appearance-none bg-accent/50 hover:bg-accent text-xs font-semibold py-1.5 pl-3 pr-8 rounded-lg cursor-pointer outline-none border-0 text-foreground transition-colors">
                  <option>This Week</option>
                  <option>Last Week</option>
                </select>
                <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {trendingMenu.slice(0, 2).map((item) => (
                <div key={item.id} className="group cursor-pointer">
                  <div className="relative h-36 w-full rounded-xl overflow-hidden mb-3">
                    <img src={item.image} alt={item.name} className="object-cover h-full w-full group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <div className="flex justify-between items-start">
                    <div>
                      <h4 className="font-bold text-foreground group-hover:text-primary transition-colors">{item.name}</h4>
                      <p className="text-xs text-muted-foreground mt-0.5">Food Category</p>
                    </div>
                    <span className="font-bold text-orange-500">{item.price}</span>
                  </div>
                  <div className="flex items-center gap-3 mt-2 text-xs font-medium text-muted-foreground">
                    <span className="flex items-center"><span className="text-amber-500 mr-1">★</span> {item.rating}</span>
                    <span className="flex items-center"><Package className="h-3.5 w-3.5 mr-1" /> 350 orders</span>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>

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
)
