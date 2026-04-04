import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePOS } from "@/context/POSContext";
import type { OrderItem } from "@/context/POSContext";
import { POSLayout } from "@/layouts/POSLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import {
  ChevronLeft,
  Plus,
  Minus,
  UtensilsCrossed,
  CookingPot,
  CreditCard,
  Search,
  ShoppingCart,
  X,
} from "lucide-react";
import { toast } from "sonner";

export const OrderScreen: React.FC = () => {
  const { tableId } = useParams<{ tableId: string }>();
  const navigate = useNavigate();
  const { tables, getTableOrder, placeOrder, processPayment } = usePOS();

  const [menu, setMenu] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false); // mobile cart drawer state

  const table = tables.find(t => t.id === tableId);
  const existingOrder = getTableOrder(tableId || "");
  const categories = ["All", ...new Set(menu.map(item => item.category))];

  useEffect(() => {
    const savedMenu = localStorage.getItem("poscafe_menu");
    if (savedMenu) {
      try {
        setMenu(JSON.parse(savedMenu));
      } catch (e) {
        console.error("Failed to parse menu items in POS", e);
      }
    }

    if (existingOrder) {
      setCart(existingOrder.items);
    }
  }, [existingOrder]);

  const filteredItems = selectedCategory === "All"
    ? menu
    : menu.filter(item => item.category === selectedCategory);

  const addToCart = (product: any) => {
    if (!product.available) {
      toast.error("Item is out of stock!");
      return;
    }
    setCart(prev => {
      const existing = prev.find(item => item.id === product.id);
      if (existing) {
        return prev.map(item => item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item);
      }
      return [...prev, { id: product.id, name: product.name, price: Number(product.price), quantity: 1 }];
    });
  };

  const updateQuantity = (id: string, delta: number) => {
    setCart(prev => prev.map(item => {
      if (item.id === id) {
        const newQty = Math.max(0, item.quantity + delta);
        return newQty === 0 ? null : { ...item, quantity: newQty };
      }
      return item;
    }).filter(Boolean) as OrderItem[]);
  };

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleSendToKitchen = () => {
    if (cart.length === 0) return;
    placeOrder(tableId!, cart);
    navigate("/pos");
  };

  const handlePayment = () => {
    if (!existingOrder) return;
    processPayment(existingOrder.id);
    navigate("/pos");
  };

  if (!table) return (
    <POSLayout>
      <div className="flex items-center justify-center h-full">
        <p className="text-lg font-semibold text-muted-foreground">Table Not Found</p>
      </div>
    </POSLayout>
  );

  /* ── Shared Cart Panel content ── */
  const CartPanel = () => (
    <>
      <header className="p-5 border-b border-border shrink-0">
        <div className="flex items-center justify-between">
          <h2 className="text-base font-bold text-foreground tracking-tight flex items-center gap-2">
            <ShoppingCart size={18} className="text-primary" />
            Current Order
          </h2>
          <div className="flex items-center gap-2">
            <Badge className="bg-muted text-muted-foreground rounded-lg font-semibold text-xs border border-border">
              {cart.length} items
            </Badge>
            {/* Close button — only shown inside mobile sheet */}
            <button
              className="lg:hidden p-1 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
              onClick={() => setCartOpen(false)}
              aria-label="Close cart"
            >
              <X size={18} />
            </button>
          </div>
        </div>
      </header>

      <ScrollArea className="flex-1 p-5">
        <div className="space-y-3">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center opacity-40">
              <UtensilsCrossed size={48} className="mb-3 text-muted-foreground" />
              <p className="text-sm font-medium text-muted-foreground">Cart is empty</p>
            </div>
          ) : (
            cart.map(item => (
              <div key={item.id} className="flex gap-3 items-center p-2 rounded-xl hover:bg-muted/40 transition-colors animate-in slide-in-from-right-4 fade-in">
                <div className="flex-1 space-y-0.5 min-w-0">
                  <p className="font-semibold text-sm text-foreground leading-tight truncate">{item.name}</p>
                  <p className="text-xs font-medium text-primary">${item.price.toFixed(2)} × {item.quantity}</p>
                </div>
                <div className="flex items-center gap-0.5 bg-muted/50 rounded-xl p-1 border border-border shrink-0">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-lg hover:bg-background hover:text-destructive"
                    onClick={() => updateQuantity(item.id, -1)}
                  >
                    <Minus size={12} strokeWidth={2.5} />
                  </Button>
                  <span className="w-7 text-center font-bold text-sm">{item.quantity}</span>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 rounded-lg hover:bg-background hover:text-primary"
                    onClick={() => updateQuantity(item.id, 1)}
                  >
                    <Plus size={12} strokeWidth={2.5} />
                  </Button>
                </div>
              </div>
            ))
          )}
        </div>
      </ScrollArea>

      <footer className="p-5 bg-muted/20 border-t border-border space-y-4 shrink-0">
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground font-medium">
            <span>Subtotal</span>
            <span>${total.toFixed(2)}</span>
          </div>
          <div className="h-px bg-border w-full" />
          <div className="flex justify-between text-foreground font-bold text-xl tracking-tight">
            <span>Total</span>
            <span>${total.toFixed(2)}</span>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-2.5">
          {!existingOrder || existingOrder.paymentStatus === "paid" ? (
            <Button
              className="col-span-2 h-14 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base shadow-lg shadow-primary/20 active:scale-95 transition-all"
              disabled={cart.length === 0}
              onClick={handleSendToKitchen}
            >
              <CookingPot className="w-5 h-5 mr-2" />
              Send to Kitchen
            </Button>
          ) : (
            <>
              <Button
                variant="outline"
                className="h-14 rounded-xl bg-card border-border font-semibold text-sm text-primary hover:bg-primary/5 active:scale-95 transition-all"
                onClick={handleSendToKitchen}
              >
                Update Order
              </Button>
              <Button
                className="h-14 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-lg shadow-emerald-100 active:scale-95 transition-all"
                onClick={handlePayment}
              >
                <CreditCard className="w-4 h-4 mr-2" />
                Payment
              </Button>
            </>
          )}
        </div>
      </footer>
    </>
  );

  return (
    <POSLayout>
      {/* Full-bleed layout — overflow-hidden to prevent double scrollbars */}
      <div className="flex h-full gap-0 overflow-hidden -m-4 sm:-m-6 lg:-m-8">

        {/* ── Left: Product Selection ── */}
        <div className="flex-1 flex flex-col gap-5 min-w-0 overflow-hidden p-4 sm:p-6 lg:p-8">

          {/* Header */}
          <header className="flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigate("/pos")}
                className="rounded-xl border-border shadow-sm"
              >
                <ChevronLeft size={20} />
              </Button>
              <div className="flex flex-col">
                <h1 className="text-xl font-bold text-foreground tracking-tight">{table.number} — Order</h1>
                <Badge className="mt-0.5 w-fit bg-primary/10 text-primary border-none font-semibold text-[10px] tracking-wider uppercase rounded-md">
                  {existingOrder ? existingOrder.status : "New Session"}
                </Badge>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {/* Mobile cart toggle */}
              <Button
                size="sm"
                className="lg:hidden relative bg-primary text-white rounded-xl h-9 px-3 font-semibold"
                onClick={() => setCartOpen(true)}
              >
                <ShoppingCart size={16} className="mr-1.5" />
                Cart
                {cart.length > 0 && (
                  <span className="ml-1.5 bg-white text-primary rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold">
                    {cart.length}
                  </span>
                )}
              </Button>

              <div className="relative w-52 hidden lg:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input placeholder="Search menu..." className="pl-9 h-9 rounded-xl bg-card border-border" />
              </div>
            </div>
          </header>

          {/* Category Tabs */}
          <ScrollArea className="shrink-0">
            <div className="flex gap-2 pb-3">
              {categories.map(cat => (
                <Button
                  key={cat}
                  variant={selectedCategory === cat ? "default" : "outline"}
                  onClick={() => setSelectedCategory(cat)}
                  className="rounded-xl h-9 px-5 font-semibold text-xs border-border shadow-sm shrink-0"
                >
                  {cat}
                </Button>
              ))}
            </div>
          </ScrollArea>

          {/* Product Grid */}
          <ScrollArea className="flex-1 -mx-2 px-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-24 lg:pb-10">
              {filteredItems.map(item => (
                <Card
                  key={item.id}
                  className={`rounded-2xl border-2 transition-all active:scale-95 group relative overflow-hidden ${
                    item.available
                      ? "border-border hover:border-primary/30 cursor-pointer hover:shadow-md"
                      : "opacity-50 grayscale cursor-not-allowed"
                  }`}
                  onClick={() => addToCart(item)}
                >
                  <CardContent className="p-0">
                    <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                      {item.image ? (
                        <img src={item.image} alt={item.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                          <UtensilsCrossed size={44} />
                        </div>
                      )}
                      {!item.available && (
                        <div className="absolute inset-0 bg-black/55 flex items-center justify-center">
                          <span className="text-white font-semibold text-xs tracking-widest border border-white/40 px-3 py-1 rounded-lg">Sold Out</span>
                        </div>
                      )}
                    </div>
                    <div className="p-3.5 space-y-1">
                      <h3 className="font-semibold text-sm text-foreground line-clamp-1">{item.name}</h3>
                      <div className="flex justify-between items-center">
                        <span className="text-primary font-bold">${Number(item.price).toFixed(2)}</span>
                        <div className="bg-primary/10 text-primary w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all">
                          <Plus size={14} strokeWidth={2.5} />
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* ── Right: Desktop Cart Sidebar ── */}
        <aside className="hidden lg:flex w-[360px] bg-card border-l border-border flex-col shrink-0 shadow-xl z-20">
          <CartPanel />
        </aside>

        {/* ── Mobile: Cart Bottom Sheet ── */}
        {/* Backdrop */}
        {cartOpen && (
          <div
            className="fixed inset-0 bg-black/40 z-40 lg:hidden"
            onClick={() => setCartOpen(false)}
          />
        )}
        {/* Drawer panel */}
        <div
          className={`fixed inset-x-0 bottom-0 z-50 lg:hidden bg-card rounded-t-2xl shadow-2xl border-t border-border flex flex-col transition-transform duration-300 ease-in-out ${
            cartOpen ? "translate-y-0" : "translate-y-full"
          }`}
          style={{ maxHeight: "85vh" }}
        >
          <div className="w-10 h-1 bg-muted-foreground/20 rounded-full mx-auto mt-3 mb-1 shrink-0" />
          <CartPanel />
        </div>
      </div>
    </POSLayout>
  );
};
