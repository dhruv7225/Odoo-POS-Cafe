import React, { useState, useEffect, useCallback } from "react";
import { toast } from "sonner";
import {
  Wallet, CreditCard, Banknote, QrCode,
  CheckCircle2, Clock, DollarSign, ReceiptText, RefreshCw
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { CashierLayout } from "@/layouts/CashierLayout";
import { orderApi, paymentApi, paymentMethodApi, sessionApi, dashboardApi, razorpayApi } from "@/lib/api";
import type { PaymentPayload } from "@/lib/api";
import { connectWebSocket, subscribe } from "@/lib/websocket";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter
} from "@/components/ui/dialog";

declare global { interface Window { Razorpay: any } }

type PaymentMethod = { id: number; name: string; code: string; requiresReference: boolean; active: boolean; upiId?: string };
type SessionData = { id: number; status: string; openingCash: number; totalSales: number; openedAt: string };
type OrderData = {
  id: number; orderNo: string; tableNo: string | null; floorName: string | null;
  status: string; totalAmount: number; paymentStatus: string; paidAmount: number;
  remainingAmount: number; createdAt: string;
  items: { productName: string; qty: number; lineTotal: number; variantName?: string; selectedToppings?: string }[];
};
type DashData = {
  totalSales: number; totalOrders: number; completedOrders: number;
  pendingOrders: number; cancelledOrders: number; salesByPaymentMethod: Record<string, number>;
};

export const CashierDashboard: React.FC = () => {
  const { restaurantId } = useAuth();
  const [session, setSession] = useState<SessionData | null>(null);
  const [orders, setOrders] = useState<OrderData[]>([]);
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([]);
  const [dashData, setDashData] = useState<DashData | null>(null);
  const [openingCash, setOpeningCash] = useState("0");
  const [loading, setLoading] = useState(true);

  // Payment dialog state
  const [payingOrder, setPayingOrder] = useState<OrderData | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<PaymentMethod | null>(null);
  const [cashReceived, setCashReceived] = useState("");
  const [paymentLoading, setPaymentLoading] = useState(false);
  const [statusFilter, setStatusFilter] = useState<string>("UNPAID");

  const loadData = useCallback(async () => {
    if (!restaurantId) return;
    try {
      const [sessionsRes, methodsRes] = await Promise.all([
        sessionApi.listByRestaurant(restaurantId),
        paymentMethodApi.list(restaurantId),
      ]);
      setPaymentMethods(methodsRes.filter((m: PaymentMethod) => m.active));
      const active = sessionsRes.find((s: any) => s.status === "OPEN");
      if (active) {
        setSession(active);
        // Load ALL restaurant orders for today (not just session — pending orders from before session)
        const [ordersRes, dashRes] = await Promise.all([
          orderApi.listByRestaurant(restaurantId),
          dashboardApi.session(active.id),
        ]);
        setOrders(ordersRes);
        setDashData(dashRes as any);
      } else {
        setSession(null);
        // Still load today's orders so cashier sees pending ones
        const ordersRes = await orderApi.listByRestaurant(restaurantId);
        setOrders(ordersRes);
        setDashData(null);
      }
    } catch (err: any) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [restaurantId]);

  useEffect(() => { loadData(); }, [loadData]);

  // WebSocket
  useEffect(() => {
    if (!restaurantId) return;
    connectWebSocket().catch(() => {});
    const unsubs = [
      subscribe(`/topic/cashier/${restaurantId}/payment-request`, (order: any) => {
        toast.info(`Payment requested: ${order.orderNo} — Table ${order.tableNo || "?"}`, {
          description: `Amount: ₹${order.totalAmount}`,
          duration: 8000,
        });
        loadData();
      }),
      subscribe(`/topic/cashier/${restaurantId}/payment-completed`, () => loadData()),
      subscribe(`/topic/orders/${restaurantId}/new-order`, () => loadData()),
      subscribe(`/topic/kitchen/${restaurantId}/order-ready`, () => loadData()),
      subscribe(`/topic/kitchen/${restaurantId}/ticket-update`, () => loadData()),
    ];
    return () => unsubs.forEach((u) => u());
  }, [restaurantId, loadData]);

  // Poll
  useEffect(() => {
    const interval = setInterval(loadData, 12000);
    return () => clearInterval(interval);
  }, [loadData]);

  const openSession = async () => {
    if (!restaurantId) return;
    try {
      const s = await sessionApi.open({ restaurantId, openingCash: parseFloat(openingCash) || 0 });
      setSession(s as any);
      toast.success("Session opened!");
      loadData();
    } catch (err: any) { toast.error(err.message); }
  };

  const unpaidCount = orders.filter(o => o.paymentStatus === "UNPAID" && o.status !== "CANCELLED").length;

  const closeSession = async () => {
    if (!session) return;
    if (unpaidCount > 0) {
      toast.error(`Cannot close session — ${unpaidCount} unpaid order${unpaidCount > 1 ? "s" : ""} remaining. Collect all payments first.`);
      return;
    }
    try {
      await sessionApi.close({ sessionId: session.id, closingCash: session.totalSales });
      toast.success("Session closed!");
      setSession(null);
      setDashData(null);
    } catch (err: any) { toast.error(err.message); }
  };

  // ─── PAYMENT HANDLERS ───────────────────────────────
  const openPaymentDialog = (order: OrderData) => {
    setPayingOrder(order);
    setSelectedMethod(null);
    setCashReceived("");
  };

  const getChange = () => {
    if (!payingOrder) return 0;
    const received = parseFloat(cashReceived) || 0;
    return Math.max(0, received - payingOrder.remainingAmount);
  };

  const isCashValid = () => {
    if (!payingOrder) return false;
    return (parseFloat(cashReceived) || 0) >= payingOrder.remainingAmount;
  };

  const handleCashPayment = async () => {
    if (!payingOrder || !selectedMethod || !session) return;
    setPaymentLoading(true);
    try {
      const payload: PaymentPayload = {
        restaurantId: restaurantId!,
        orderId: payingOrder.id,
        posSessionId: session.id,
        paymentMethodId: selectedMethod.id,
        amount: payingOrder.remainingAmount,
      };
      await paymentApi.collectCash(payload);
      toast.success(`Cash collected: ₹${payingOrder.remainingAmount.toFixed(2)}${getChange() > 0 ? ` (Change: ₹${getChange().toFixed(2)})` : ""}`);
      setPayingOrder(null);
      loadData();
    } catch (err: any) { toast.error(err.message); }
    finally { setPaymentLoading(false); }
  };

  const handleRazorpayPayment = async () => {
    if (!payingOrder || !selectedMethod || !session) return;
    setPaymentLoading(true);
    try {
      // Step 1: Create pending payment in DB
      const pendingPayment: any = await paymentApi.createOnline({
        restaurantId: restaurantId!,
        orderId: payingOrder.id,
        posSessionId: session.id,
        paymentMethodId: selectedMethod.id,
        amount: payingOrder.remainingAmount,
      });

      // Step 2: Create Razorpay order
      const rzpOrder = await razorpayApi.createOrder({
        restaurantId: restaurantId!,
        orderId: payingOrder.id,
        amount: payingOrder.remainingAmount,
        paymentType: "ORDER",
      });

      // Step 3: Open Razorpay checkout
      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY || "rzp_test_SZNQWghI1RTGsJ",
        amount: Math.round(payingOrder.remainingAmount * 100),
        currency: "INR",
        name: "POSCafe",
        description: `Order ${payingOrder.orderNo}`,
        order_id: rzpOrder.razorpayOrderId,
        handler: async (response: any) => {
          // Step 4: Verify with backend
          try {
            await razorpayApi.verify(pendingPayment.id, {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            });
            // Step 5: Confirm the payment in our system
            await paymentApi.confirm(pendingPayment.id, response.razorpay_payment_id);
            toast.success(`Payment of ₹${payingOrder.remainingAmount.toFixed(2)} via ${selectedMethod.name} successful!`);
            setPayingOrder(null);
            loadData();
          } catch (verifyErr: any) {
            toast.error("Payment verification failed: " + verifyErr.message);
            await paymentApi.fail(pendingPayment.id);
            loadData();
          }
        },
        modal: {
          ondismiss: async () => {
            toast.error("Payment cancelled");
            await paymentApi.fail(pendingPayment.id);
            setPaymentLoading(false);
            loadData();
          },
        },
        theme: { color: "#FF6B35" },
      };

      const rzp = new window.Razorpay(options);
      rzp.on("payment.failed", async (response: any) => {
        toast.error("Payment failed: " + (response.error?.description || "Unknown error"));
        await paymentApi.fail(pendingPayment.id);
        setPaymentLoading(false);
        loadData();
      });
      rzp.open();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setPaymentLoading(false);
    }
  };

  const handlePayment = () => {
    if (!selectedMethod) return;
    if (selectedMethod.code === "CASH") {
      handleCashPayment();
    } else {
      handleRazorpayPayment();
    }
  };

  // ─── FILTERS ────────────────────────────────────────
  const filteredOrders = orders.filter((o) => {
    if (statusFilter === "ALL") return true;
    if (statusFilter === "UNPAID") return o.paymentStatus === "UNPAID" && o.status !== "CANCELLED";
    if (statusFilter === "READY") return o.status === "READY";
    if (statusFilter === "PAID") return o.paymentStatus === "PAID";
    return true;
  });

  const getMethodIcon = (code: string) => {
    if (code === "CASH") return <Banknote size={20} />;
    if (code === "UPI" || code === "RAZORPAY") return <QrCode size={20} />;
    return <CreditCard size={20} />;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DRAFT": return "bg-gray-100 text-gray-700";
      case "CONFIRMED": return "bg-blue-100 text-blue-700";
      case "IN_KITCHEN": return "bg-amber-100 text-amber-700";
      case "READY": return "bg-emerald-100 text-emerald-700";
      case "COMPLETED": return "bg-green-100 text-green-700";
      default: return "bg-gray-100 text-gray-700";
    }
  };

  if (loading) {
    return (
      <CashierLayout>
        <div className="flex items-center justify-center h-64">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
        </div>
      </CashierLayout>
    );
  }

  // No session — show open session form
  if (!session) {
    return (
      <CashierLayout>
        <div className="max-w-md mx-auto mt-24">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Wallet size={24} className="text-primary" />
                Open New Session
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label>Opening Cash (₹)</Label>
                <Input type="number" value={openingCash} onChange={(e) => setOpeningCash(e.target.value)} placeholder="0.00" className="h-11" />
              </div>
              <Button onClick={openSession} className="w-full h-11 font-semibold">Start Session</Button>
              {/* Show pending orders even without session */}
              {orders.filter(o => o.paymentStatus === "UNPAID" && o.status !== "CANCELLED").length > 0 && (
                <p className="text-sm text-amber-600 text-center">
                  {orders.filter(o => o.paymentStatus === "UNPAID" && o.status !== "CANCELLED").length} unpaid orders pending. Open a session to collect payments.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </CashierLayout>
    );
  }

  return (
    <CashierLayout>
      <div className="space-y-6">
        {/* Session Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2.5 rounded-xl bg-emerald-100"><DollarSign size={20} className="text-emerald-600" /></div><div><p className="text-xs text-muted-foreground font-medium">Total Sales</p><p className="text-xl font-bold">₹{dashData?.totalSales?.toFixed(2) ?? "0.00"}</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2.5 rounded-xl bg-blue-100"><ReceiptText size={20} className="text-blue-600" /></div><div><p className="text-xs text-muted-foreground font-medium">Total Orders</p><p className="text-xl font-bold">{orders.filter(o => o.status !== "CANCELLED").length}</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2.5 rounded-xl bg-green-100"><CheckCircle2 size={20} className="text-green-600" /></div><div><p className="text-xs text-muted-foreground font-medium">Completed</p><p className="text-xl font-bold">{orders.filter(o => o.status === "COMPLETED").length}</p></div></div></CardContent></Card>
          <Card><CardContent className="pt-6"><div className="flex items-center gap-3"><div className="p-2.5 rounded-xl bg-amber-100"><Clock size={20} className="text-amber-600" /></div><div><p className="text-xs text-muted-foreground font-medium">Pending</p><p className="text-xl font-bold">{orders.filter(o => o.paymentStatus === "UNPAID" && o.status !== "CANCELLED").length}</p></div></div></CardContent></Card>
        </div>

        {/* Payment Method Breakdown */}
        {dashData?.salesByPaymentMethod && Object.keys(dashData.salesByPaymentMethod).length > 0 && (
          <Card><CardHeader className="pb-3"><CardTitle className="text-base">Sales by Payment Method</CardTitle></CardHeader><CardContent><div className="flex flex-wrap gap-4">
            {Object.entries(dashData.salesByPaymentMethod).map(([method, amount]) => (
              <div key={method} className="flex items-center gap-2 bg-muted/50 rounded-lg px-4 py-2">
                <span className="font-medium text-sm">{method}</span>
                <span className="text-primary font-bold">₹{Number(amount).toFixed(2)}</span>
              </div>
            ))}
          </div></CardContent></Card>
        )}

        {/* Orders */}
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold">Orders</h2>
          <div className="flex items-center gap-2">
            <div className="flex gap-1 bg-muted/40 p-1 rounded-xl border border-border/50">
              {["ALL", "UNPAID", "READY", "PAID"].map((f) => (
                <Button key={f} variant={statusFilter === f ? "default" : "ghost"} size="sm" className="rounded-lg text-xs h-8" onClick={() => setStatusFilter(f)}>{f}</Button>
              ))}
            </div>
            <Button variant="outline" size="icon" onClick={loadData} className="rounded-xl h-8 w-8"><RefreshCw size={14} /></Button>
          </div>
        </div>

        <div className="grid gap-3">
          {filteredOrders.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">No orders found.</div>
          ) : filteredOrders.map((order) => (
            <Card key={order.id} className="hover:shadow-md transition-shadow">
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-lg">{order.orderNo}</span>
                      <Badge className={`${getStatusColor(order.status)} text-[10px] font-semibold`}>{order.status}</Badge>
                      <Badge className={`text-[10px] font-semibold ${order.paymentStatus === "PAID" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"}`}>{order.paymentStatus}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-0.5">
                      {order.tableNo ? `Table ${order.tableNo}` : ""}{order.floorName ? ` · ${order.floorName}` : ""}
                      {" · "}{new Date(order.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </p>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {order.items.map((item, i) => (
                        <span key={i}>{item.qty}× {item.productName}{item.variantName ? ` (${item.variantName})` : ""}{i < order.items.length - 1 ? ", " : ""}</span>
                      ))}
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="text-lg font-bold">₹{order.totalAmount.toFixed(2)}</p>
                      {order.paymentStatus !== "PAID" && <p className="text-xs text-red-500">Due: ₹{order.remainingAmount.toFixed(2)}</p>}
                    </div>
                    {order.paymentStatus !== "PAID" && order.remainingAmount > 0 && session && (
                      <Button onClick={() => openPaymentDialog(order)} className="font-semibold gap-2">
                        <Wallet size={16} />Collect
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Close Session */}
        <div className="flex items-center justify-between pt-4 border-t">
          {unpaidCount > 0 && (
            <p className="text-sm text-red-500 font-medium">
              {unpaidCount} unpaid order{unpaidCount > 1 ? "s" : ""} — collect all payments before closing.
            </p>
          )}
          <Button variant="destructive" onClick={closeSession} className="ml-auto">
            Close Session (Total: ₹{session.totalSales.toFixed(2)})
          </Button>
        </div>
      </div>

      {/* ─── PAYMENT DIALOG ─────────────────────────────── */}
      <Dialog open={!!payingOrder} onOpenChange={(open) => !open && setPayingOrder(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Collect Payment — {payingOrder?.orderNo}</DialogTitle>
          </DialogHeader>

          {payingOrder && (
            <div className="space-y-5">
              {/* Order Summary */}
              <div className="bg-muted/50 rounded-lg p-4 space-y-1.5">
                <div className="flex justify-between text-sm"><span>Table</span><span className="font-medium">{payingOrder.tableNo} · {payingOrder.floorName}</span></div>
                <div className="flex justify-between text-sm"><span>Items</span><span className="text-xs text-muted-foreground">{payingOrder.items.map(i => `${i.qty}× ${i.productName}`).join(", ")}</span></div>
                <div className="h-px bg-border" />
                <div className="flex justify-between text-lg font-bold text-primary">
                  <span>Amount to Collect</span>
                  <span>₹{payingOrder.remainingAmount.toFixed(2)}</span>
                </div>
              </div>

              {/* Payment Method Selection */}
              <div>
                <Label className="mb-2 block font-semibold">Payment Method</Label>
                <div className="grid grid-cols-2 gap-2">
                  {paymentMethods.map((m) => (
                    <Button key={m.id} variant={selectedMethod?.id === m.id ? "default" : "outline"} className="h-14 flex flex-col gap-1" onClick={() => { setSelectedMethod(m); setCashReceived(""); }}>
                      {getMethodIcon(m.code)}
                      <span className="text-xs">{m.name}</span>
                    </Button>
                  ))}
                </div>
              </div>

              {/* CASH: Show received amount + change */}
              {selectedMethod?.code === "CASH" && (
                <div className="space-y-3">
                  <div className="space-y-2">
                    <Label>Cash Received (₹)</Label>
                    <Input type="number" value={cashReceived} onChange={(e) => setCashReceived(e.target.value)} placeholder={payingOrder.remainingAmount.toFixed(2)} className="h-12 text-lg font-bold" autoFocus />
                  </div>
                  {parseFloat(cashReceived) > 0 && (
                    <div className="bg-emerald-50 rounded-lg p-3 border border-emerald-200">
                      <div className="flex justify-between text-sm"><span>Bill Amount</span><span className="font-medium">₹{payingOrder.remainingAmount.toFixed(2)}</span></div>
                      <div className="flex justify-between text-sm"><span>Cash Received</span><span className="font-medium">₹{(parseFloat(cashReceived) || 0).toFixed(2)}</span></div>
                      <div className="h-px bg-emerald-200 my-1.5" />
                      <div className={`flex justify-between text-lg font-bold ${isCashValid() ? "text-emerald-600" : "text-red-500"}`}>
                        <span>{isCashValid() ? "Change" : "Short"}</span>
                        <span>₹{isCashValid() ? getChange().toFixed(2) : (payingOrder.remainingAmount - (parseFloat(cashReceived) || 0)).toFixed(2)}</span>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* CARD/UPI/RAZORPAY: Show Razorpay will open */}
              {selectedMethod && selectedMethod.code !== "CASH" && (
                <div className="bg-blue-50 rounded-lg p-4 text-center border border-blue-200">
                  {selectedMethod.code === "UPI" || selectedMethod.code === "RAZORPAY" ? (
                    <>
                      <QrCode size={48} className="mx-auto text-blue-500 mb-2" />
                      <p className="text-sm text-blue-700 font-medium">Razorpay UPI checkout will open</p>
                    </>
                  ) : (
                    <>
                      <CreditCard size={48} className="mx-auto text-blue-500 mb-2" />
                      <p className="text-sm text-blue-700 font-medium">Razorpay card checkout will open</p>
                    </>
                  )}
                  <p className="text-lg font-bold text-blue-800 mt-1">₹{payingOrder.remainingAmount.toFixed(2)}</p>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setPayingOrder(null)}>Cancel</Button>
            <Button
              onClick={handlePayment}
              disabled={!selectedMethod || paymentLoading || (selectedMethod?.code === "CASH" && !isCashValid())}
              className="gap-2"
            >
              {paymentLoading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <CheckCircle2 size={16} />
              )}
              {selectedMethod?.code === "CASH" ? "Confirm Cash Payment" : "Open Payment Gateway"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </CashierLayout>
  );
};
