import { useState, useEffect, useRef, useCallback } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Plus, Minus, UtensilsCrossed, ShoppingCart, X, Search, Box,
  Coffee, ChefHat, CircleCheckBig, Loader2,
} from "lucide-react";
import { toast } from "sonner";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter,
} from "@/components/ui/sheet";
import { productApi, orderApi, tableApi } from "@/lib/api";
import type { OrderCreatePayload } from "@/lib/api";
import { connectWebSocket, subscribe } from "@/lib/websocket";

// ─── Types ───
interface CartItem {
  id: string;
  cartKey: string;
  name: string;
  price: number;
  quantity: number;
  productId: number;
  selectedVariant?: { id?: number; name: string; priceOption: number };
  selectedToppings?: { id?: number; name: string; price: number }[];
}

type OrderPhase = "browsing" | "placed" | "confirmed" | "preparing" | "ready";

const STORAGE_KEY = "poscafe_customer_order";

// ─── Main Component ───
export function CustomerOrderStatus() {
  const { tableId: tableIdParam, floorId: floorIdParam } = useParams<{ tableId: string; floorId: string }>();

  const [loading, setLoading] = useState(true);
  const [tableName, setTableName] = useState("");
  const [restaurantId, setRestaurantId] = useState(0);
  const [tableId, setTableId] = useState(0);
  const [menu, setMenu] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [searchTerm, setSearchTerm] = useState("");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);
  const [orderPhase, setOrderPhase] = useState<OrderPhase>("browsing");
  const [placedOrderId, setPlacedOrderId] = useState<number | null>(null);

  // Customization
  const [customizationItem, setCustomizationItem] = useState<any | null>(null);
  const [activeVariant, setActiveVariant] = useState<any>(null);
  const [activeToppings, setActiveToppings] = useState<any[]>([]);

  // AR modal
  const [arItem, setArItem] = useState<any | null>(null);

  const [focusedCartKey, setFocusedCartKey] = useState<string | null>(null);
  const cartItemRefs = useRef<Record<string, HTMLDivElement | null>>({});
  const lastPhaseRef = useRef<OrderPhase>("browsing");

  const categories = ["All", ...new Set(menu.map((item: any) => item.category))];

  const filteredItems = menu.filter((item: any) => {
    const matchCat = selectedCategory === "All" || item.category === selectedCategory;
    const matchSearch = !searchTerm || item.name.toLowerCase().includes(searchTerm.toLowerCase());
    return matchCat && matchSearch;
  });

  // ─── Load table info + menu ───
  useEffect(() => {
    const tId = parseInt(tableIdParam || "1", 10);
    const fId = parseInt(floorIdParam || "1", 10);
    setTableId(tId);

    (async () => {
      try {
        const tables = await tableApi.listByFloor(fId);
        const table = tables.find((t: any) => t.id === tId);
        const rId = table?.restaurant?.id || 1;
        setRestaurantId(rId);
        setTableName(table?.tableNo || `T${tId}`);

        const products = await productApi.list(rId);
        const items = await Promise.all(products.map(async (p: any) => {
          let variants: any[] = [], toppings: any[] = [];
          try { variants = await productApi.getVariants(p.id); } catch {}
          try { toppings = await productApi.getToppings(p.id); } catch {}
          return {
            id: String(p.id), backendId: p.id, name: p.name, price: p.price,
            category: p.category?.name || "Uncategorized",
            image: p.imageUrl || "", imageUrl: p.imageUrl || "",
            glbUrl: p.glbUrl || "", description: p.description || "",
            available: p.active,
            variants: variants.map((v: any) => ({ id: v.id, name: v.name, priceOption: v.priceAdjustment })),
            toppings: toppings.map((t: any) => ({ id: t.id, name: t.name, price: t.price })),
          };
        }));
        setMenu(items);

        // Restore saved order
        try {
          const saved = JSON.parse(localStorage.getItem(STORAGE_KEY) || "null");
          if (saved && saved.tableId === tId) {
            setPlacedOrderId(saved.orderId);
            const order: any = await orderApi.get(saved.orderId);
            if (order.status === "COMPLETED" && order.paymentStatus === "PAID") {
              localStorage.removeItem(STORAGE_KEY);
            } else if (order.status !== "CANCELLED") {
              const phase = mapBackendStatus(order.status);
              setOrderPhase(phase);
              lastPhaseRef.current = phase;
              setCart(order.items.map((it: any) => ({
                id: String(it.productId), cartKey: `r-${it.id}`, name: it.productName,
                price: it.lineTotal / it.qty, quantity: it.qty, productId: it.productId,
              })));
            }
          }
        } catch {}
      } catch (err) {
        console.error("Load failed", err);
      } finally {
        setLoading(false);
      }
    })();
  }, [tableIdParam, floorIdParam]);

  // ─── Live status tracking via poll + WS ───
  useEffect(() => {
    if (!placedOrderId || !restaurantId) return;
    const orderId = placedOrderId;

    const updatePhase = (p: OrderPhase, msg?: string) => {
      if (lastPhaseRef.current !== p) {
        lastPhaseRef.current = p;
        setOrderPhase(p);
        if (msg) toast.success(msg);
      }
    };

    const poll = setInterval(async () => {
      try {
        const o: any = await orderApi.get(orderId);
        updatePhase(mapBackendStatus(o.status));
        if (o.status === "COMPLETED" && o.paymentStatus === "PAID") {
          localStorage.removeItem(STORAGE_KEY);
          clearInterval(poll);
          toast.success("Payment received. Thank you!");
        }
      } catch {}
    }, 3000);

    let unsubs: (() => void)[] = [];
    connectWebSocket().then(() => {
      unsubs = [
        subscribe(`/topic/orders/${restaurantId}/order-status`, (d: any) => {
          if (d.orderId === orderId) {
            if (d.status === "CONFIRMED") updatePhase("confirmed", "Waiter confirmed your order!");
            else if (d.status === "IN_KITCHEN") updatePhase("preparing", "Your order is in the kitchen!");
            else if (d.status === "PREPARING") updatePhase("preparing", "Chef started cooking!");
            else if (d.status === "READY") updatePhase("ready", "Your order is ready!");
          }
        }),
        subscribe(`/topic/kitchen/${restaurantId}/order-ready`, (d: any) => {
          if (d.orderId === orderId) updatePhase("ready", "Your order is ready for pickup!");
        }),
        subscribe(`/topic/cashier/${restaurantId}/payment-completed`, (d: any) => {
          if (d.orderId === orderId) {
            localStorage.removeItem(STORAGE_KEY);
            toast.success("Payment received. Thank you!");
          }
        }),
      ];
    }).catch(() => {});

    return () => { clearInterval(poll); unsubs.forEach(u => u()); };
  }, [placedOrderId, restaurantId]);

  useEffect(() => {
    if (focusedCartKey && cartItemRefs.current[focusedCartKey])
      cartItemRefs.current[focusedCartKey]!.scrollIntoView({ behavior: "smooth", block: "nearest" });
  }, [focusedCartKey]);

  // ─── Cart logic ───
  const requestAddToCart = (product: any) => {
    if (!product.available) { toast.error("Item is unavailable"); return; }
    setCustomizationItem(product);
    setActiveVariant(null);
    setActiveToppings([]);
  };

  const commitToCart = (productId: string, name: string, price: number, variant?: any, toppings?: any[]) => {
    const vId = variant ? variant.name : "base";
    const tStr = toppings?.length ? toppings.map((t: any) => t.name).sort().join("|") : "none";
    const cartKey = `${productId}-${vId}-${tStr}`;
    setCart(prev => {
      const existing = prev.find(i => i.cartKey === cartKey);
      if (existing) return prev.map(i => i.cartKey === cartKey ? { ...i, quantity: i.quantity + 1 } : i);
      return [...prev, {
        id: productId, cartKey, name, price, quantity: 1, productId: Number(productId),
        selectedVariant: variant ? { id: variant.id, name: variant.name, priceOption: variant.priceOption } : undefined,
        selectedToppings: toppings?.length ? toppings.map((t: any) => ({ id: t.id, name: t.name, price: t.price })) : undefined,
      }];
    });
    setFocusedCartKey(cartKey);
    setCartOpen(true);
    setCustomizationItem(null);
  };

  const updateQuantity = (cartKey: string, delta: number) => {
    setCart(prev => prev.map(i => {
      if (i.cartKey !== cartKey) return i;
      const q = Math.max(0, i.quantity + delta);
      return q === 0 ? null : { ...i, quantity: q };
    }).filter(Boolean) as CartItem[]);
  };

  const setQuantityDirect = useCallback((cartKey: string, val: string) => {
    const n = parseInt(val, 10);
    if (isNaN(n) || n < 0) return;
    if (n === 0) { setCart(prev => prev.filter(i => i.cartKey !== cartKey)); return; }
    setCart(prev => prev.map(i => i.cartKey === cartKey ? { ...i, quantity: n } : i));
  }, []);

  const toggleTopping = (t: any) => {
    setActiveToppings(prev => prev.find((x: any) => x.id === t.id) ? prev.filter((x: any) => x.id !== t.id) : [...prev, t]);
  };

  const customPrice = customizationItem
    ? Number(customizationItem.price) + (activeVariant?.priceOption || 0) + activeToppings.reduce((s: number, t: any) => s + Number(t.price), 0)
    : 0;

  const subtotal = cart.reduce((s, i) => s + i.price * i.quantity, 0);
  const cgst = subtotal * 0.025;
  const sgst = subtotal * 0.025;
  const total = subtotal + cgst + sgst;
  const itemCount = cart.reduce((s, i) => s + i.quantity, 0);
  // ─── Place order ───
  const handlePlaceOrder = async () => {
    if (!cart.length) return;
    try {
      const payload: OrderCreatePayload = {
        restaurantId, tableId,
        items: cart.map(i => ({
          productId: i.productId,
          variantId: i.selectedVariant?.id ? Number(i.selectedVariant.id) : undefined,
          toppingIds: i.selectedToppings?.map(t => Number(t.id)).filter(Boolean),
          qty: i.quantity,
        })),
      };
      const result: any = await orderApi.create(payload);
      setPlacedOrderId(result.id);
      localStorage.setItem(STORAGE_KEY, JSON.stringify({ orderId: result.id, tableId, restaurantId }));
      setOrderPhase("placed");
      lastPhaseRef.current = "placed";
      setCartOpen(false);
      toast.success("Order placed! Waiting for waiter confirmation.");
    } catch (err: any) {
      toast.error(err.message || "Failed to place order");
    }
  };

  // ─── Helpers ───
  function mapBackendStatus(status: string): OrderPhase {
    if (status === "DRAFT") return "placed";
    if (status === "CONFIRMED") return "confirmed";
    if (status === "IN_KITCHEN") return "preparing";
    if (status === "READY") return "ready";
    return "placed";
  }

  if (loading) return (
    <div className="min-h-dvh bg-background flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );

  // ═══════════════════════════════════════════════════
  //  ORDER TRACKING VIEW (after placing)
  // ═══════════════════════════════════════════════════
  if (orderPhase !== "browsing") {
    const steps = [
      { key: "placed", label: "Order Placed", icon: Coffee, color: "text-amber-500" },
      { key: "confirmed", label: "Waiter Confirmed", icon: CircleCheckBig, color: "text-blue-500" },
      { key: "preparing", label: "Chef Preparing", icon: ChefHat, color: "text-orange-500" },
      { key: "ready", label: "Ready!", icon: CircleCheckBig, color: "text-emerald-500" },
    ];
    const phaseOrder = ["placed", "confirmed", "preparing", "ready"];
    const currentIdx = phaseOrder.indexOf(orderPhase);

    return (
      <div className="min-h-dvh bg-background">
        <div className="h-1.5 bg-gradient-to-r from-primary via-orange-400 to-amber-300" />
        <div className="mx-auto max-w-lg px-4 py-8 space-y-6">
          <div className="text-center space-y-1">
            <h1 className="text-2xl font-bold tracking-tight">Order Status</h1>
            <p className="text-sm text-muted-foreground">{tableName}</p>
          </div>

          {/* Progress Steps */}
          <Card className="rounded-2xl border-2 overflow-hidden">
            <CardContent className="p-6 space-y-4">
              {steps.map((step, idx) => {
                const done = idx <= currentIdx;
                const active = idx === currentIdx;
                const Icon = step.icon;
                return (
                  <div key={step.key} className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 transition-all ${
                      done ? `${step.color} bg-current/10` : "bg-muted text-muted-foreground"
                    }`}>
                      <Icon size={20} className={done ? step.color : ""} />
                    </div>
                    <div className="flex-1">
                      <p className={`text-sm font-semibold ${active ? "text-foreground" : done ? "text-muted-foreground" : "text-muted-foreground/50"}`}>
                        {step.label}
                      </p>
                    </div>
                    {done && <CircleCheckBig size={16} className="text-emerald-500" />}
                  </div>
                );
              })}

              {/* Progress bar */}
              <div className="h-2 bg-muted rounded-full overflow-hidden mt-2">
                <div
                  className="h-full bg-gradient-to-r from-primary to-emerald-500 rounded-full transition-all duration-1000"
                  style={{ width: `${((currentIdx + 1) / steps.length) * 100}%` }}
                />
              </div>
            </CardContent>
          </Card>

          {/* Order Summary */}
          <Card className="rounded-2xl">
            <CardContent className="p-5 space-y-3">
              <h3 className="font-bold text-sm">Your Order</h3>
              {cart.map(item => (
                <div key={item.cartKey} className="flex justify-between text-sm">
                  <span className="text-muted-foreground">{item.quantity}× {item.name}</span>
                  <span className="font-medium">₹{(item.price * item.quantity).toFixed(2)}</span>
                </div>
              ))}
              <div className="h-px bg-border" />
              <div className="flex justify-between font-bold">
                <span>Total</span>
                <span className="text-primary">₹{total.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          <Button variant="outline" className="w-full rounded-xl" onClick={() => { setOrderPhase("browsing"); }}>
            Add More Items
          </Button>
        </div>
      </div>
    );
  }

  // ═══════════════════════════════════════════════════
  //  MENU BROWSING VIEW
  // ═══════════════════════════════════════════════════
  const CartPanel = ({ showClose = false }: { showClose?: boolean }) => (
    <>
      <header className="px-5 pb-4 pt-4 border-b border-border shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold flex items-center gap-2"><ShoppingCart className="size-4 text-primary" />Your Cart</h2>
          <div className="flex items-center gap-2">
            <Badge className="bg-muted text-muted-foreground rounded-lg font-semibold text-xs border border-border">{itemCount} items</Badge>
            {showClose && <button className="p-1.5 rounded-lg hover:bg-muted text-muted-foreground" onClick={() => setCartOpen(false)}><X className="size-4" /></button>}
          </div>
        </div>
      </header>
      <ScrollArea className="flex-1 px-5 py-3">
        {cart.length === 0 ? (
          <div className="flex flex-col items-center py-12 opacity-40">
            <UtensilsCrossed className="size-10 mb-3 text-muted-foreground" />
            <p className="text-sm text-muted-foreground">Cart is empty</p>
          </div>
        ) : (
          <div className="space-y-2">
            {cart.map(item => {
              const isFocused = focusedCartKey === item.cartKey;
              return (
                <div key={item.cartKey} ref={el => { cartItemRefs.current[item.cartKey] = el; }}
                  onClick={() => setFocusedCartKey(item.cartKey)}
                  className={`flex gap-3 items-start p-3 rounded-xl transition-all cursor-pointer ${isFocused ? "bg-primary/5 ring-2 ring-primary/30" : "hover:bg-muted/40"}`}>
                  <div className="flex-1 min-w-0 mt-0.5 space-y-1">
                    <p className={`font-semibold text-sm truncate ${isFocused ? "text-primary" : ""}`}>{item.name}</p>
                    {item.selectedVariant && <p className="text-[10px] text-muted-foreground">{item.selectedVariant.name}</p>}
                    {item.selectedToppings?.length ? <p className="text-[10px] text-muted-foreground">+ {item.selectedToppings.map(t => t.name).join(", ")}</p> : null}
                    <p className="text-xs text-primary">₹{item.price.toFixed(2)} × {item.quantity} = <span className="font-bold">₹{(item.price * item.quantity).toFixed(2)}</span></p>
                  </div>
                  <div className="flex items-center gap-0.5 rounded-xl p-1 border shrink-0">
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={(e) => { e.stopPropagation(); updateQuantity(item.cartKey, -1); }}><Minus size={12} /></Button>
                    <input className="w-7 text-center text-xs font-bold bg-transparent outline-none" value={item.quantity}
                      onChange={e => setQuantityDirect(item.cartKey, e.target.value)}
                      onClick={e => e.stopPropagation()} />
                    <Button variant="ghost" size="icon" className="h-7 w-7 rounded-lg" onClick={(e) => { e.stopPropagation(); updateQuantity(item.cartKey, 1); }}><Plus size={12} /></Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </ScrollArea>
      <footer className="p-5 bg-muted/20 border-t space-y-4 shrink-0">
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground"><span>Subtotal</span><span>₹{subtotal.toFixed(2)}</span></div>
          <div className="flex justify-between text-xs text-muted-foreground"><span>CGST (2.5%)</span><span>₹{cgst.toFixed(2)}</span></div>
          <div className="flex justify-between text-xs text-muted-foreground"><span>SGST (2.5%)</span><span>₹{sgst.toFixed(2)}</span></div>
          <div className="h-px bg-border" />
          <div className="flex justify-between font-bold text-xl"><span>Total</span><span>₹{total.toFixed(2)}</span></div>
        </div>
        <Button className="w-full h-14 rounded-xl bg-primary text-white font-bold text-base shadow-lg active:scale-95 transition-all"
          disabled={!cart.length} onClick={handlePlaceOrder}>
          <Coffee className="w-5 h-5 mr-2" /> Place Order
        </Button>
      </footer>
    </>
  );

  return (
    <div className="min-h-dvh bg-background">
      {/* Top bar */}
      <div className="h-1.5 bg-gradient-to-r from-primary via-orange-400 to-amber-300" />
      <div className="flex h-[calc(100dvh-6px)] gap-0 overflow-hidden">

        {/* Menu Area */}
        <div className="flex-1 flex flex-col gap-4 min-w-0 overflow-hidden p-4 sm:p-6 h-full">
          <header className="flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <div className="bg-primary p-2 rounded-xl text-white"><Coffee size={20} /></div>
              <div>
                <h1 className="text-lg font-bold tracking-tight">{tableName} — Menu</h1>
                <p className="text-xs text-muted-foreground">Scan, customize & order</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" className="lg:hidden relative bg-primary text-white rounded-xl h-9 px-3 font-semibold" onClick={() => setCartOpen(true)}>
                <ShoppingCart size={16} className="mr-1.5" /> Cart
                {itemCount > 0 && <span className="ml-1.5 bg-white text-primary rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold">{itemCount}</span>}
              </Button>
              <div className="relative w-48 hidden lg:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input placeholder="Search..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9 h-9 rounded-xl bg-card border-border" />
              </div>
            </div>
          </header>

          {/* Mobile search */}
          <div className="lg:hidden relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input placeholder="Search menu..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} className="pl-9 h-10 rounded-xl bg-card border-border" />
          </div>

          {/* Categories */}
          <ScrollArea className="shrink-0">
            <div className="flex gap-2 pb-1">
              {categories.map(cat => (
                <Button key={cat} variant={selectedCategory === cat ? "default" : "outline"}
                  onClick={() => setSelectedCategory(cat)} className="rounded-xl h-9 px-5 font-semibold text-xs border-border shadow-sm shrink-0">{cat}</Button>
              ))}
            </div>
          </ScrollArea>

          {/* Product Grid */}
          <div className="flex-1 overflow-y-auto -mx-2 px-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 pb-24 lg:pb-6">
              {filteredItems.map((item: any) => {
                const qtyInCart = cart.filter(c => c.id === item.id).reduce((s, c) => s + c.quantity, 0);
                const hasGlb = !!item.glbUrl;
                return (
                  <Card key={item.id}
                    className={`rounded-2xl border-2 transition-all active:scale-95 group relative overflow-hidden ${
                      item.available ? qtyInCart > 0 ? "border-primary/40 shadow-md shadow-primary/10 cursor-pointer" : "border-border hover:border-primary/30 cursor-pointer hover:shadow-md" : "opacity-50 grayscale cursor-not-allowed"
                    }`}
                    onClick={() => requestAddToCart(item)}>
                    <CardContent className="p-0">
                      <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                        {item.imageUrl ? (
                          <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground/30"><UtensilsCrossed size={44} /></div>
                        )}
                        {!item.available && <div className="absolute inset-0 bg-black/55 flex items-center justify-center"><span className="text-white font-semibold text-xs border border-white/40 px-3 py-1 rounded-lg">Sold Out</span></div>}
                        {qtyInCart > 0 && <div className="absolute top-2 right-2 bg-primary text-white w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-md">{qtyInCart}</div>}
                        {hasGlb && (
                          <button onClick={(e) => { e.stopPropagation(); setArItem(item); }}
                            className="absolute bottom-2 left-2 bg-black/70 text-white px-2 py-1 rounded-lg text-[10px] font-bold flex items-center gap-1 hover:bg-black/90 active:scale-95 transition-all">
                            <Box size={10} /> AR
                          </button>
                        )}
                      </div>
                      <div className="p-3.5 space-y-1">
                        <h3 className="font-semibold text-sm text-foreground line-clamp-1">{item.name}</h3>
                        <div className="flex justify-between items-center">
                          <span className="text-primary font-bold">₹{Number(item.price).toFixed(2)}</span>
                          <div className="bg-primary/10 text-primary w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"><Plus size={14} strokeWidth={2.5} /></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>
        </div>

        {/* Desktop Cart Sidebar */}
        <aside className="hidden lg:flex w-[360px] bg-card border-l border-border flex-col shrink-0 shadow-xl z-20">
          <CartPanel />
        </aside>

        {/* Mobile Cart */}
        {cartOpen && <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setCartOpen(false)} />}
        <div className={`fixed inset-x-0 bottom-0 z-50 lg:hidden bg-card rounded-t-2xl shadow-2xl border-t flex flex-col transition-transform duration-300 ${cartOpen ? "translate-y-0" : "translate-y-full"}`} style={{ maxHeight: "85dvh" }}>
          <div className="w-10 h-1 bg-muted-foreground/20 rounded-full mx-auto mt-3 mb-1 shrink-0" />
          <CartPanel showClose />
        </div>
      </div>

      {/* ── Customization Sheet ── */}
      <Sheet open={!!customizationItem} onOpenChange={open => !open && setCustomizationItem(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col bg-background border-l-0 sm:border-l">
          <SheetHeader className="p-6 border-b bg-card shrink-0 text-left">
            <SheetTitle className="text-2xl font-bold tracking-tight">{customizationItem?.name}</SheetTitle>
            <p className="text-muted-foreground text-sm">Customize your order</p>
          </SheetHeader>
          <ScrollArea className="flex-1 p-6">
            <div className="space-y-8 pb-6">
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-2xl font-bold text-primary">₹{Number(customizationItem?.price || 0).toFixed(2)}</span>
                  {customizationItem?.category && <Badge variant="outline" className="text-xs font-semibold">{customizationItem.category}</Badge>}
                </div>
                {customizationItem?.description && <p className="text-sm text-muted-foreground">{customizationItem.description}</p>}
              </div>

              {customizationItem?.variants?.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-base font-bold">Size / Variant</Label>
                  <div className="grid grid-cols-2 gap-3">
                    <div onClick={() => setActiveVariant(null)} className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${activeVariant === null ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
                      <p className={`font-semibold text-sm ${activeVariant === null ? "text-primary" : ""}`}>Standard</p>
                      <p className="text-xs text-muted-foreground mt-0.5">Base price</p>
                    </div>
                    {customizationItem.variants.map((v: any) => (
                      <div key={v.id} onClick={() => setActiveVariant(v)} className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${activeVariant?.id === v.id ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
                        <p className={`font-semibold text-sm ${activeVariant?.id === v.id ? "text-primary" : ""}`}>{v.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{v.priceOption > 0 ? `+₹${v.priceOption.toFixed(2)}` : "No extra cost"}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {customizationItem?.toppings?.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-base font-bold">Add-ons</Label>
                  <div className="space-y-2.5">
                    {customizationItem.toppings.map((t: any) => {
                      const active = !!activeToppings.find((x: any) => x.id === t.id);
                      return (
                        <div key={t.id} onClick={() => toggleTopping(t)} className={`flex items-center justify-between p-3.5 rounded-xl border-2 cursor-pointer transition-all ${active ? "border-primary bg-primary/5" : "border-border hover:border-primary/40"}`}>
                          <div className="flex items-center gap-3">
                            <Checkbox checked={active} className="pointer-events-none data-[state=checked]:bg-primary" />
                            <p className={`font-semibold text-sm ${active ? "text-primary" : ""}`}>{t.name}</p>
                          </div>
                          <span className="text-sm font-bold text-muted-foreground">{t.price > 0 ? `+₹${t.price.toFixed(2)}` : "Free"}</span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {(!customizationItem?.variants?.length && !customizationItem?.toppings?.length) && (
                <div className="text-center py-4 text-sm text-muted-foreground bg-muted/30 rounded-xl border border-dashed">No variants or add-ons available.</div>
              )}
            </div>
          </ScrollArea>
          <SheetFooter className="p-6 bg-card border-t shrink-0">
            <Button className="w-full h-14 text-base font-bold rounded-xl active:scale-95 shadow-md"
              onClick={() => commitToCart(customizationItem.id, customizationItem.name, customPrice, activeVariant, activeToppings)}>
              Add to Order • ₹{customPrice.toFixed(2)}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* ── AR 3D Modal ── */}
      {arItem && arItem.glbUrl && (
        <>
          <div className="fixed inset-0 z-[100] bg-black/60 backdrop-blur-sm" onClick={() => setArItem(null)} />
          <div className="fixed inset-4 sm:inset-auto sm:top-1/2 sm:left-1/2 sm:-translate-x-1/2 sm:-translate-y-1/2 sm:w-full sm:max-w-lg z-[101] bg-card rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[90dvh]">
            <div className="flex items-center justify-between p-4 border-b shrink-0">
              <div>
                <h3 className="font-bold text-lg">{arItem.name}</h3>
                <p className="text-sm text-primary font-semibold">₹{Number(arItem.price).toFixed(2)}</p>
              </div>
              <button onClick={() => setArItem(null)} className="p-2 rounded-xl hover:bg-muted transition-colors"><X size={18} /></button>
            </div>
            <div className="flex-1 min-h-[300px] h-[400px]" style={{ background: "linear-gradient(135deg, #f5f5f5 0%, #e8e8e8 100%)" }}>
              <iframe
                title="3D Model"
                style={{ width: "100%", height: "100%", border: "none" }}
                allow="autoplay; fullscreen"
                srcDoc={`<!DOCTYPE html><html><head>
<script type="module" src="https://ajax.googleapis.com/ajax/libs/model-viewer/4.0.0/model-viewer.min.js"><\/script>
<style>*{margin:0;padding:0}body{background:linear-gradient(135deg,#f5f5f5,#e8e8e8);overflow:hidden}
model-viewer{width:100%;height:100vh;--poster-color:transparent}</style>
</head><body>
<model-viewer src="${arItem.glbUrl}" camera-controls touch-action="pan-y" auto-rotate rotation-per-second="20deg" interaction-prompt="none" shadow-intensity="0.5" exposure="1" camera-orbit="30deg 75deg auto" disable-zoom></model-viewer>
</body></html>`}
              />
            </div>
          </div>
        </>
      )}

      {/* Mobile floating cart button */}
      {itemCount > 0 && !cartOpen && (
        <button onClick={() => setCartOpen(true)}
          className="lg:hidden fixed bottom-6 right-6 z-30 bg-primary text-white rounded-2xl px-5 py-3.5 font-bold shadow-xl shadow-primary/30 flex items-center gap-2 active:scale-95 transition-all">
          <ShoppingCart size={18} />
          {itemCount} items · ₹{total.toFixed(2)}
        </button>
      )}
    </div>
  );
}
