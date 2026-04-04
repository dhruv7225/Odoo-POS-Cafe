import React, { useState, useEffect, useRef, useCallback } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePOS } from "@/context/POSContext";
import type { OrderItem } from "@/context/POSContext";
import { POSLayout } from "@/layouts/POSLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import {
  ChevronLeft, Plus, Minus, UtensilsCrossed, CookingPot, CreditCard, Search, ShoppingCart, X
} from "lucide-react";
import { toast } from "sonner";
import {
  Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter
} from "@/components/ui/sheet";

export const OrderScreen: React.FC = () => {
  const { tableId } = useParams<{ tableId: string }>();
  const navigate = useNavigate();
  const { tables, getTableOrder, placeOrder, processPayment } = usePOS();

  const [menu, setMenu] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [cart, setCart] = useState<OrderItem[]>([]);
  const [cartOpen, setCartOpen] = useState(false);

  // Customization state
  const [customizationItem, setCustomizationItem] = useState<any | null>(null);
  const [activeVariant, setActiveVariant] = useState<any>(null); // defaults to base item if null
  const [activeToppings, setActiveToppings] = useState<any[]>([]);

  const [focusedCartKey, setFocusedCartKey] = useState<string | null>(null);
  const cartItemRefs = useRef<Record<string, HTMLDivElement | null>>({});

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
      // Safety backwards compat
      setCart(existingOrder.items.map(i => ({ ...i, cartKey: i.cartKey || i.id })));
    }
  }, [existingOrder]);

  useEffect(() => {
    if (focusedCartKey && cartItemRefs.current[focusedCartKey]) {
      cartItemRefs.current[focusedCartKey]!.scrollIntoView({ behavior: "smooth", block: "nearest" });
    }
  }, [focusedCartKey]);

  const filteredItems = selectedCategory === "All"
    ? menu
    : menu.filter(item => item.category === selectedCategory);

  // Clicking a card either adds instantly or opens customization
  const requestAddToCart = (product: any) => {
    if (!product.available) {
      toast.error("Item is out of stock!");
      return;
    }
    // If it has variants or toppings, open sheet
    if ((product.variants && product.variants.length > 0) || (product.toppings && product.toppings.length > 0)) {
      setCustomizationItem(product);
      setActiveVariant(null);
      setActiveToppings([]);
      return;
    }
    
    // Otherwise add directly
    commitToCart(product.id, product.name, Number(product.price));
  };

  const commitToCart = (
    productId: string, 
    name: string, 
    price: number, 
    variant?: any, 
    toppings?: any[]
  ) => {
    // Generate a unique cart key based on the exact configuration
    const variantId = variant ? variant.name : "base";
    const toppingsStr = toppings && toppings.length > 0 
      ? toppings.map(t => t.name).sort().join("|") 
      : "none";
    
    const cartKey = `${productId}-${variantId}-${toppingsStr}`;
    
    setCart(prev => {
      const existing = prev.find(item => item.cartKey === cartKey);
      if (existing) {
        return prev.map(item =>
          item.cartKey === cartKey ? { ...item, quantity: item.quantity + 1 } : item
        );
      }

      return [...prev, { 
        id: productId, 
        cartKey,
        name, 
        price, 
        quantity: 1,
        selectedVariant: variant ? { name: variant.name, priceOption: variant.priceOption } : undefined,
        selectedToppings: toppings && toppings.length > 0 ? toppings.map(t => ({ name: t.name, price: t.price })) : undefined
      }];
    });

    setFocusedCartKey(cartKey);
    setCartOpen(true);
    setCustomizationItem(null);
  };

  const updateQuantity = (cartKey: string, delta: number) => {
    setCart(prev =>
      prev.map(item => {
        if (item.cartKey === cartKey) {
          const newQty = Math.max(0, item.quantity + delta);
          return newQty === 0 ? null : { ...item, quantity: newQty };
        }
        return item;
      }).filter(Boolean) as OrderItem[]
    );
    if (delta < 0) {
      setCart(prev => {
        if (!prev.find(i => i.cartKey === cartKey)) setFocusedCartKey(null);
        return prev;
      });
    }
  };

  const setQuantityDirect = useCallback((cartKey: string, rawValue: string) => {
    const parsed = parseInt(rawValue, 10);
    if (isNaN(parsed) || parsed < 0) return;
    if (parsed === 0) {
      setCart(prev => prev.filter(item => item.cartKey !== cartKey));
      setFocusedCartKey(null);
      return;
    }
    setCart(prev => prev.map(item => (item.cartKey === cartKey ? { ...item, quantity: parsed } : item)));
  }, []);

  const toggleTopping = (topping: any) => {
    setActiveToppings(prev => {
      if (prev.find(t => t.id === topping.id)) return prev.filter(t => t.id !== topping.id);
      return [...prev, topping];
    });
  };

  // Compute live price in custom modal
  const customModalPrice = customizationItem 
    ? Number(customizationItem.price) 
      + (activeVariant ? Number(activeVariant.priceOption) : 0)
      + activeToppings.reduce((sum, t) => sum + Number(t.price), 0)
    : 0;

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
              {cart.reduce((sum, item) => sum + item.quantity, 0)} items
            </Badge>
            <button
              className="lg:hidden p-1 rounded-lg hover:bg-muted text-muted-foreground transition-colors"
              onClick={() => setCartOpen(false)}
            >
              <X size={18} />
            </button>
          </div>
        </div>
      </header>

      <ScrollArea className="flex-1 p-5">
        <div className="space-y-2">
          {cart.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center opacity-40">
              <UtensilsCrossed size={48} className="mb-3 text-muted-foreground" />
              <p className="text-sm font-medium text-muted-foreground">Cart is empty</p>
            </div>
          ) : (
            cart.map(item => {
              const isFocused = focusedCartKey === item.cartKey;
              return (
                <div
                  key={item.cartKey}
                  ref={el => { cartItemRefs.current[item.cartKey] = el; }}
                  onClick={() => setFocusedCartKey(item.cartKey)}
                  className={`flex gap-3 items-start p-3 rounded-xl transition-all cursor-pointer animate-in slide-in-from-right-4 fade-in ${
                    isFocused ? "bg-primary/5 ring-2 ring-primary/30 shadow-sm" : "hover:bg-muted/40"
                  }`}
                >
                  <div className="flex-1 space-y-1 min-w-0 mt-0.5">
                    <p className={`font-semibold text-sm leading-tight truncate transition-colors ${isFocused ? "text-primary" : "text-foreground"}`}>
                      {item.name}
                    </p>
                    
                    {/* Render customization details */}
                    {(item.selectedVariant || (item.selectedToppings && item.selectedToppings.length > 0)) && (
                      <div className="text-xs text-muted-foreground font-medium leading-tight space-y-0.5 mb-1.5">
                        {item.selectedVariant && <p>• Size/Var: {item.selectedVariant.name}</p>}
                        {item.selectedToppings?.map((t, idx) => (
                          <p key={idx}>+ {t.name}</p>
                        ))}
                      </div>
                    )}

                    <p className="text-xs font-medium text-primary">
                      ${item.price.toFixed(2)} × {item.quantity} = <span className="font-bold">${(item.price * item.quantity).toFixed(2)}</span>
                    </p>
                  </div>

                  <div className={`flex items-center gap-0.5 rounded-xl p-1 border shrink-0 transition-colors ${isFocused ? "bg-primary/5 border-primary/30" : "bg-muted/50 border-border"}`}>
                    <Button
                      variant="ghost" size="icon"
                      className={`h-7 w-7 rounded-lg transition-colors ${isFocused ? "hover:bg-destructive/10 hover:text-destructive" : "hover:bg-background hover:text-destructive"}`}
                      onClick={e => { e.stopPropagation(); updateQuantity(item.cartKey, -1); }}
                    >
                      <Minus size={12} strokeWidth={2.5} />
                    </Button>

                    {isFocused ? (
                      <input
                        type="number" min={1} autoFocus value={item.quantity}
                        onChange={e => setQuantityDirect(item.cartKey, e.target.value)}
                        onKeyDown={e => {
                          if (e.key === "Enter" || e.key === "Escape") setFocusedCartKey(null);
                          if (e.key === "ArrowUp") { e.preventDefault(); updateQuantity(item.cartKey, 1); }
                          if (e.key === "ArrowDown") { e.preventDefault(); updateQuantity(item.cartKey, -1); }
                        }}
                        onBlur={() => setFocusedCartKey(null)}
                        onClick={e => e.stopPropagation()}
                        className="w-10 text-center font-bold text-sm bg-transparent outline-none border-none text-primary [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                      />
                    ) : (
                      <span className="w-7 text-center font-bold text-sm">{item.quantity}</span>
                    )}

                    <Button
                      variant="ghost" size="icon"
                      className={`h-7 w-7 rounded-lg transition-colors ${isFocused ? "hover:bg-primary/10 hover:text-primary" : "hover:bg-background hover:text-primary"}`}
                      onClick={e => { e.stopPropagation(); updateQuantity(item.cartKey, 1); }}
                    >
                      <Plus size={12} strokeWidth={2.5} />
                    </Button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </ScrollArea>

      <footer className="p-5 bg-muted/20 border-t border-border space-y-4 shrink-0">
        <div className="space-y-2">
          <div className="flex justify-between text-sm text-muted-foreground font-medium"><span>Subtotal</span><span>${total.toFixed(2)}</span></div>
          <div className="h-px bg-border w-full" />
          <div className="flex justify-between text-foreground font-bold text-xl tracking-tight"><span>Total</span><span>${total.toFixed(2)}</span></div>
        </div>
        <div className="grid grid-cols-2 gap-2.5">
          {!existingOrder || existingOrder.paymentStatus === "paid" ? (
            <Button className="col-span-2 h-14 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-base shadow-lg shadow-primary/20 active:scale-95 transition-all" disabled={cart.length === 0} onClick={handleSendToKitchen}>
              <CookingPot className="w-5 h-5 mr-2" /> Send to Kitchen
            </Button>
          ) : (
            <>
              <Button variant="outline" className="h-14 rounded-xl bg-card border-border font-semibold text-sm text-primary hover:bg-primary/5 active:scale-95 transition-all" onClick={handleSendToKitchen}>Update Order</Button>
              <Button className="h-14 rounded-xl bg-emerald-500 hover:bg-emerald-600 text-white font-bold text-sm shadow-lg shadow-emerald-100 active:scale-95 transition-all" onClick={handlePayment}>
                <CreditCard className="w-4 h-4 mr-2" /> Payment
              </Button>
            </>
          )}
        </div>
      </footer>
    </>
  );

  return (
    <POSLayout>
      <div className="flex h-full gap-0 overflow-hidden -m-4 sm:-m-6 lg:-m-8">
        
        {/* Left: Product Grid */}
        <div className="flex-1 flex flex-col gap-5 min-w-0 overflow-hidden p-4 sm:p-6 lg:p-8">
          <header className="flex items-center justify-between shrink-0">
            <div className="flex items-center gap-3">
              <Button variant="outline" size="icon" onClick={() => navigate("/pos")} className="rounded-xl border-border shadow-sm"><ChevronLeft size={20} /></Button>
              <div className="flex flex-col">
                <h1 className="text-xl font-bold text-foreground tracking-tight">{table.number} — Order</h1>
                <Badge className="mt-0.5 w-fit bg-primary/10 text-primary border-none font-semibold text-[10px] tracking-wider uppercase rounded-md">{existingOrder ? existingOrder.status : "New Session"}</Badge>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button size="sm" className="lg:hidden relative bg-primary text-white rounded-xl h-9 px-3 font-semibold" onClick={() => setCartOpen(true)}>
                <ShoppingCart size={16} className="mr-1.5" /> Cart
                {cart.length > 0 && <span className="ml-1.5 bg-white text-primary rounded-full w-5 h-5 flex items-center justify-center text-[10px] font-bold">{cart.reduce((s,i) => s + i.quantity, 0)}</span>}
              </Button>
              <div className="relative w-52 hidden lg:block">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input placeholder="Search menu..." className="pl-9 h-9 rounded-xl bg-card border-border" />
              </div>
            </div>
          </header>

          <ScrollArea className="shrink-0">
            <div className="flex gap-2 pb-3">
              {categories.map(cat => (
                <Button key={cat} variant={selectedCategory === cat ? "default" : "outline"} onClick={() => setSelectedCategory(cat)} className="rounded-xl h-9 px-5 font-semibold text-xs border-border shadow-sm shrink-0">{cat}</Button>
              ))}
            </div>
          </ScrollArea>

          <ScrollArea className="flex-1 -mx-2 px-2">
            <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-4 pb-24 lg:pb-10">
              {filteredItems.map(item => {
                const qtyInCart = cart.filter(c => c.id === item.id).reduce((sum, c) => sum + c.quantity, 0);
                return (
                  <Card
                    key={item.id}
                    className={`rounded-2xl border-2 transition-all active:scale-95 group relative overflow-hidden ${
                      item.available ? qtyInCart > 0 ? "border-primary/40 shadow-md shadow-primary/10 cursor-pointer" : "border-border hover:border-primary/30 cursor-pointer hover:shadow-md" : "opacity-50 grayscale cursor-not-allowed"
                    }`}
                    onClick={() => requestAddToCart(item)}
                  >
                    <CardContent className="p-0">
                      <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                        {item.image ? (
                          <img src={item.image} alt={item.name} className="w-full h-full object-cover transition-transform group-hover:scale-105" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-muted-foreground/30"><UtensilsCrossed size={44} /></div>
                        )}
                        {!item.available && <div className="absolute inset-0 bg-black/55 flex items-center justify-center"><span className="text-white font-semibold text-xs tracking-widest border border-white/40 px-3 py-1 rounded-lg">Sold Out</span></div>}
                        {qtyInCart > 0 && <div className="absolute top-2 right-2 bg-primary text-primary-foreground w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold shadow-md">{qtyInCart}</div>}
                      </div>
                      <div className="p-3.5 space-y-1">
                        <h3 className="font-semibold text-sm text-foreground line-clamp-1">{item.name}</h3>
                        <div className="flex justify-between items-center">
                          <span className="text-primary font-bold">${Number(item.price).toFixed(2)}</span>
                          <div className="bg-primary/10 text-primary w-7 h-7 rounded-lg flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all"><Plus size={14} strokeWidth={2.5} /></div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </ScrollArea>
        </div>

        {/* Desktop Cart Sidebar */}
        <aside className="hidden lg:flex w-[360px] bg-card border-l border-border flex-col shrink-0 shadow-xl z-20">
          <CartPanel />
        </aside>

        {/* Mobile Cart Sheet */}
        {cartOpen && <div className="fixed inset-0 bg-black/40 z-40 lg:hidden" onClick={() => setCartOpen(false)} />}
        <div className={`fixed inset-x-0 bottom-0 z-50 lg:hidden bg-card rounded-t-2xl shadow-2xl border-t border-border flex flex-col transition-transform duration-300 ease-in-out ${cartOpen ? "translate-y-0" : "translate-y-full"}`} style={{ maxHeight: "85vh" }}>
          <div className="w-10 h-1 bg-muted-foreground/20 rounded-full mx-auto mt-3 mb-1 shrink-0" />
          <CartPanel />
        </div>
      </div>

      {/* ── Customization Dialog ── */}
      <Sheet open={!!customizationItem} onOpenChange={(open) => !open && setCustomizationItem(null)}>
        <SheetContent side="right" className="w-full sm:max-w-md p-0 flex flex-col bg-background border-l-0 sm:border-l">
          <SheetHeader className="p-6 border-b bg-card shrink-0 text-left">
            <SheetTitle className="text-2xl font-bold tracking-tight">{customizationItem?.name}</SheetTitle>
            <p className="text-muted-foreground text-sm font-medium">Customize your order</p>
          </SheetHeader>

          <ScrollArea className="flex-1 p-6">
            <div className="space-y-8 pb-6">
              
              {/* Variants Section */}
              {customizationItem?.variants?.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-base font-bold flex justify-between">
                    <span>Size / Variant <span className="text-red-500">*</span></span>
                  </Label>
                  <div className="grid grid-cols-2 gap-3">
                    {/* Default Base Item */}
                    <div 
                      onClick={() => setActiveVariant(null)}
                      className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                        activeVariant === null ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/40 bg-card"
                      }`}
                    >
                      <p className={`font-semibold text-sm ${activeVariant === null ? "text-primary" : "text-foreground"}`}>Standard</p>
                      <p className="text-xs font-medium text-muted-foreground mt-0.5">Base price</p>
                    </div>
                    {/* Options */}
                    {customizationItem.variants.map((variant: any) => (
                      <div 
                        key={variant.id}
                        onClick={() => setActiveVariant(variant)}
                        className={`p-3 rounded-xl border-2 cursor-pointer transition-all ${
                          activeVariant?.id === variant.id ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/40 bg-card"
                        }`}
                      >
                        <p className={`font-semibold text-sm ${activeVariant?.id === variant.id ? "text-primary" : "text-foreground"}`}>{variant.name}</p>
                        <p className="text-xs font-medium text-muted-foreground mt-0.5">
                          {variant.priceOption > 0 ? `+$${variant.priceOption.toFixed(2)}` : "No extra cost"}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Toppings Section */}
              {customizationItem?.toppings?.length > 0 && (
                <div className="space-y-3">
                  <Label className="text-base font-bold">Add-ons</Label>
                  <div className="space-y-2.5">
                    {customizationItem.toppings.map((topping: any) => {
                      const isActive = !!activeToppings.find(t => t.id === topping.id);
                      return (
                        <div 
                          key={topping.id}
                          onClick={() => toggleTopping(topping)}
                          className={`flex items-center justify-between p-3.5 rounded-xl border-2 cursor-pointer transition-all ${
                            isActive ? "border-primary bg-primary/5 shadow-sm" : "border-border hover:border-primary/40 bg-card"
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <Checkbox checked={isActive} className="pointer-events-none data-[state=checked]:bg-primary" />
                            <div>
                              <p className={`font-semibold text-sm ${isActive ? "text-primary" : "text-foreground"}`}>{topping.name}</p>
                            </div>
                          </div>
                          <span className="text-sm font-bold text-muted-foreground">
                            {topping.price > 0 ? `+$${topping.price.toFixed(2)}` : "Free"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

            </div>
          </ScrollArea>

          <SheetFooter className="p-6 bg-card border-t shrink-0">
            <Button 
              className="w-full h-14 text-base font-bold rounded-xl active:scale-95 transition-all shadow-md"
              onClick={() => commitToCart(customizationItem.id, customizationItem.name, customModalPrice, activeVariant, activeToppings)}
            >
              Add to Order • ${customModalPrice.toFixed(2)}
            </Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>

    </POSLayout>
  );
};
