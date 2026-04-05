import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  ChevronLeft, ChevronRight, Download, FileSpreadsheet, Loader2,
  Search, Package, DollarSign, CheckCircle, Clock,
} from "lucide-react";
import { orderApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import { toast } from "sonner";

type OrderRow = {
  id: number; orderNo: string; tableNo: string | null; floorName: string | null;
  status: string; totalAmount: number; paymentStatus: string; paidAmount: number;
  waiterName: string | null; cashierName: string | null; customerName: string | null;
  createdAt: string; items: { productName: string; qty: number; lineTotal: number }[];
};

const PAGE_SIZE = 10;

export const OrdersManagement: React.FC = () => {
  const { restaurantId } = useAuth();
  const [orders, setOrders] = useState<OrderRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [expandedOrder, setExpandedOrder] = useState<number | null>(null);

  const loadOrders = async () => {
    if (!restaurantId) return;
    setLoading(true);
    try {
      const opts: any = {};
      if (statusFilter !== "ALL") opts.status = statusFilter;
      if (dateFrom) opts.from = dateFrom;
      if (dateTo) opts.to = dateTo;
      const data = await orderApi.listByRestaurant(restaurantId, opts);
      setOrders(data as OrderRow[]);
    } catch (err: any) { toast.error(err.message); }
    finally { setLoading(false); }
  };

  useEffect(() => { loadOrders(); }, [restaurantId, statusFilter, dateFrom, dateTo]);

  const filtered = orders.filter(o => {
    if (!searchTerm) return true;
    const q = searchTerm.toLowerCase();
    return o.orderNo.toLowerCase().includes(q) || (o.tableNo || "").toLowerCase().includes(q) ||
      (o.waiterName || "").toLowerCase().includes(q) || (o.cashierName || "").toLowerCase().includes(q);
  });

  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paged = filtered.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  // Summary stats
  const totalRevenue = orders.filter(o => o.paymentStatus === "PAID").reduce((s, o) => s + o.totalAmount, 0);
  const completedCount = orders.filter(o => o.status === "COMPLETED").length;
  const pendingCount = orders.filter(o => o.status !== "COMPLETED" && o.status !== "CANCELLED").length;
  const cancelledCount = orders.filter(o => o.status === "CANCELLED").length;

  const statusColor: Record<string, string> = {
    DRAFT: "bg-gray-100 text-gray-700", CONFIRMED: "bg-blue-100 text-blue-700",
    IN_KITCHEN: "bg-amber-100 text-amber-700", READY: "bg-emerald-100 text-emerald-700",
    COMPLETED: "bg-green-100 text-green-700", CANCELLED: "bg-red-100 text-red-700",
  };
  const payColor = (ps: string) => ps === "PAID" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700";

  const exportCSV = () => {
    const h = ["Order No","Table","Floor","Status","Payment","Total","Waiter","Cashier","Date","Items"];
    const rows = filtered.map(o => [o.orderNo, o.tableNo||"", o.floorName||"", o.status, o.paymentStatus,
      o.totalAmount.toFixed(2), o.waiterName||"", o.cashierName||"",
      new Date(o.createdAt).toLocaleString(), o.items.map(i=>`${i.qty}x ${i.productName}`).join("; ")]);
    const csv = [h,...rows].map(r=>r.map(c=>`"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv],{type:"text/csv"});
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "orders.csv"; a.click();
  };

  const exportPDF = () => {
    const html = `<html><head><title>Orders Report</title>
    <style>body{font-family:system-ui,sans-serif;padding:24px;color:#1a1a1a}
    table{width:100%;border-collapse:collapse;font-size:11px;margin-top:16px}
    th,td{border:1px solid #e5e5e5;padding:8px;text-align:left}
    th{background:#f9fafb;font-weight:600;text-transform:uppercase;font-size:10px;letter-spacing:0.5px}
    h1{font-size:20px;margin:0}p{color:#666;font-size:12px;margin:4px 0 0}
    .stats{display:flex;gap:24px;margin:16px 0}.stat{}.stat b{font-size:18px;display:block}
    .stat span{font-size:11px;color:#888}</style></head>
    <body><h1>Orders Report</h1><p>${dateFrom||"All dates"} – ${dateTo||"Today"}</p>
    <div class="stats"><div class="stat"><b>${filtered.length}</b><span>Total Orders</span></div>
    <div class="stat"><b>₹${totalRevenue.toFixed(2)}</b><span>Revenue</span></div>
    <div class="stat"><b>${completedCount}</b><span>Completed</span></div>
    <div class="stat"><b>${cancelledCount}</b><span>Cancelled</span></div></div>
    <table><tr><th>Order</th><th>Table</th><th>Status</th><th>Payment</th><th>Total</th><th>Waiter</th><th>Cashier</th><th>Date</th><th>Items</th></tr>
    ${filtered.map(o=>`<tr><td>${o.orderNo}</td><td>${o.tableNo||"-"} ${o.floorName?`(${o.floorName})`:""}</td>
    <td>${o.status}</td><td>${o.paymentStatus}</td><td>₹${o.totalAmount.toFixed(2)}</td>
    <td>${o.waiterName||"-"}</td><td>${o.cashierName||"-"}</td>
    <td>${new Date(o.createdAt).toLocaleString()}</td>
    <td>${o.items.map(i=>`${i.qty}× ${i.productName}`).join(", ")}</td></tr>`).join("")}</table></body></html>`;
    const w = window.open("","_blank"); if(w){w.document.write(html);w.document.close();w.print();}
  };

  return (
    <AdminLayout>
      <div className="w-full max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-foreground">Orders</h2>
            <p className="text-sm text-muted-foreground mt-1">View and export all restaurant orders</p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={exportCSV} className="gap-1.5 rounded-xl font-semibold">
              <FileSpreadsheet size={14} /> CSV
            </Button>
            <Button variant="outline" size="sm" onClick={exportPDF} className="gap-1.5 rounded-xl font-semibold">
              <Download size={14} /> PDF
            </Button>
          </div>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="rounded-xl shadow-sm border-border/60">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-blue-100"><Package size={18} className="text-blue-600" /></div>
              <div><p className="text-[11px] text-muted-foreground font-medium">Total Orders</p><p className="text-xl font-bold">{filtered.length}</p></div>
            </CardContent>
          </Card>
          <Card className="rounded-xl shadow-sm border-border/60">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-emerald-100"><DollarSign size={18} className="text-emerald-600" /></div>
              <div><p className="text-[11px] text-muted-foreground font-medium">Revenue</p><p className="text-xl font-bold">₹{totalRevenue.toFixed(0)}</p></div>
            </CardContent>
          </Card>
          <Card className="rounded-xl shadow-sm border-border/60">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-green-100"><CheckCircle size={18} className="text-green-600" /></div>
              <div><p className="text-[11px] text-muted-foreground font-medium">Completed</p><p className="text-xl font-bold">{completedCount}</p></div>
            </CardContent>
          </Card>
          <Card className="rounded-xl shadow-sm border-border/60">
            <CardContent className="p-4 flex items-center gap-3">
              <div className="p-2.5 rounded-xl bg-amber-100"><Clock size={18} className="text-amber-600" /></div>
              <div><p className="text-[11px] text-muted-foreground font-medium">Pending</p><p className="text-xl font-bold">{pendingCount}</p></div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="rounded-xl border-border/60 shadow-sm">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-end gap-3">
              <div className="flex-1 min-w-[180px]">
                <Label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Search</Label>
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-3.5 h-3.5" />
                  <Input placeholder="Order, table, waiter..." value={searchTerm} onChange={e=>{setSearchTerm(e.target.value);setPage(0);}} className="pl-9 h-9 rounded-xl text-sm" />
                </div>
              </div>
              <div className="w-32">
                <Label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">Status</Label>
                <Select value={statusFilter} onValueChange={v=>{setStatusFilter(v);setPage(0);}}>
                  <SelectTrigger className="h-9 rounded-xl text-sm"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    {["ALL","DRAFT","CONFIRMED","IN_KITCHEN","READY","COMPLETED","CANCELLED"].map(s=>(
                      <SelectItem key={s} value={s}>{s === "ALL" ? "All" : s.replace("_"," ")}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-32">
                <Label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">From</Label>
                <Input type="date" value={dateFrom} onChange={e=>{setDateFrom(e.target.value);setPage(0);}} className="h-9 rounded-xl text-sm" />
              </div>
              <div className="w-32">
                <Label className="text-[10px] text-muted-foreground uppercase tracking-wider mb-1 block">To</Label>
                <Input type="date" value={dateTo} onChange={e=>{setDateTo(e.target.value);setPage(0);}} className="h-9 rounded-xl text-sm" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center h-48"><Loader2 className="h-8 w-8 animate-spin text-primary" /></div>
        ) : (
          <div className="rounded-xl border shadow-sm bg-card overflow-hidden">
            <Table>
              <TableHeader className="bg-muted/30">
                <TableRow className="hover:bg-transparent">
                  <TableHead className="text-[10px] font-semibold uppercase tracking-wider">Order</TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-wider">Table</TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-wider">Amount</TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-wider">Status</TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-wider">Payment</TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-wider">Waiter</TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-wider">Cashier</TableHead>
                  <TableHead className="text-[10px] font-semibold uppercase tracking-wider">Time</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {paged.length === 0 ? (
                  <TableRow><TableCell colSpan={8} className="h-32 text-center text-muted-foreground">No orders found.</TableCell></TableRow>
                ) : paged.map(o => (
                  <React.Fragment key={o.id}>
                    <TableRow className="hover:bg-muted/30 cursor-pointer" onClick={()=>setExpandedOrder(expandedOrder===o.id?null:o.id)}>
                      <TableCell>
                        <p className="font-semibold text-sm text-foreground">{o.orderNo}</p>
                      </TableCell>
                      <TableCell>
                        <p className="text-sm font-medium">{o.tableNo||"—"}</p>
                        {o.floorName && <p className="text-[10px] text-muted-foreground">{o.floorName}</p>}
                      </TableCell>
                      <TableCell className="font-bold text-sm">₹{o.totalAmount.toFixed(2)}</TableCell>
                      <TableCell><Badge className={`${statusColor[o.status]||""} text-[10px] font-semibold`}>{o.status}</Badge></TableCell>
                      <TableCell><Badge className={`${payColor(o.paymentStatus)} text-[10px] font-semibold`}>{o.paymentStatus}</Badge></TableCell>
                      <TableCell className="text-sm text-muted-foreground">{o.waiterName||"—"}</TableCell>
                      <TableCell className="text-sm text-muted-foreground">{o.cashierName||"—"}</TableCell>
                      <TableCell className="text-xs text-muted-foreground whitespace-nowrap">
                        {new Date(o.createdAt).toLocaleDateString()}<br/>
                        <span className="text-[10px]">{new Date(o.createdAt).toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"})}</span>
                      </TableCell>
                    </TableRow>
                    {expandedOrder===o.id && (
                      <TableRow className="bg-muted/20">
                        <TableCell colSpan={8} className="py-3">
                          <div className="flex flex-wrap gap-6 text-xs">
                            <div>
                              <p className="text-[10px] text-muted-foreground uppercase font-semibold mb-1">Items</p>
                              {o.items.map((it,i)=>(
                                <p key={i} className="text-foreground">{it.qty}× {it.productName} <span className="text-muted-foreground">— ₹{it.lineTotal.toFixed(2)}</span></p>
                              ))}
                            </div>
                            {o.waiterName && <div><p className="text-[10px] text-muted-foreground uppercase font-semibold mb-1">Waiter</p><p>{o.waiterName}</p></div>}
                            {o.cashierName && <div><p className="text-[10px] text-muted-foreground uppercase font-semibold mb-1">Cashier</p><p>{o.cashierName}</p></div>}
                          </div>
                        </TableCell>
                      </TableRow>
                    )}
                  </React.Fragment>
                ))}
              </TableBody>
            </Table>

            {totalPages > 1 && (
              <div className="flex items-center justify-between px-4 py-3 border-t bg-muted/10">
                <p className="text-xs text-muted-foreground">
                  {page*PAGE_SIZE+1}–{Math.min((page+1)*PAGE_SIZE,filtered.length)} of {filtered.length}
                </p>
                <div className="flex items-center gap-1">
                  <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg" disabled={page===0} onClick={()=>setPage(p=>p-1)}><ChevronLeft size={13}/></Button>
                  {Array.from({length:Math.min(totalPages,5)},(_,i)=>{
                    const p=page<3?i:page-2+i; if(p>=totalPages) return null;
                    return <Button key={p} variant={p===page?"default":"outline"} size="icon" className="h-7 w-7 rounded-lg text-[11px]" onClick={()=>setPage(p)}>{p+1}</Button>;
                  })}
                  <Button variant="outline" size="icon" className="h-7 w-7 rounded-lg" disabled={page>=totalPages-1} onClick={()=>setPage(p=>p+1)}><ChevronRight size={13}/></Button>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </AdminLayout>
  );
};
