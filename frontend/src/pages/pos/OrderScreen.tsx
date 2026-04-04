import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { usePOS } from "@/context/POSContext";
import type { OrderItem } from "@/context/POSContext";
import { POSLayout } from "@/layouts/POSLayout";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
  ShoppingCart
} from "lucide-react";
import { toast } from "sonner";

export const OrderScreen: React.FC = () => {
  const { tableId } = useParams<{ tableId: string }>();
  const navigate = useNavigate();
  const { tables, getTableOrder, placeOrder, processPayment } = usePOS();
  
  const [menu, setMenu] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("All");
  const [cart, setCart] = useState<OrderItem[]>([]);
  
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

  if (!table) return <div className="p-10 text-center font-black">Table Not Found</div>;

  return (
    <POSLayout>
      <div className="flex h-full gap-6 overflow-hidden">
        
        {/* Left: Product Selection */}
        <div className="flex-1 flex flex-col gap-6 min-w-0">
          <header className="flex items-center justify-between shrink-0">
            <div className="flex items-center gap-4">
              <Button variant="outline" size="icon" onClick={() => navigate("/pos")} className="rounded-xl bg-white border-orange-100 shadow-sm">
                <ChevronLeft size={20} />
              </Button>
              <div className="flex flex-col">
                <h1 className="text-2xl font-black text-foreground tracking-tighter uppercase">{table.number} Order</h1>
                <div className="flex items-center gap-2">
                   <Badge className="bg-orange-100 text-primary border-none font-black text-[10px] tracking-widest uppercase rounded-lg">
                      {existingOrder ? existingOrder.status : 'New Session'}
                   </Badge>
                </div>
              </div>
            </div>

            <div className="relative w-64 hidden lg:block">
               <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
               <input placeholder="Search Menu..." className="w-full bg-white border border-orange-100 rounded-xl pl-9 h-10 text-sm font-medium focus:ring-1 focus:ring-primary outline-none" />
            </div>
          </header>

          <div className="flex-1 flex flex-col gap-6 overflow-hidden">
            {/* Category Nav */}
            <ScrollArea className="shrink-0">
              <div className="flex gap-2 pb-4">
                {categories.map(cat => (
                  <Button
                    key={cat}
                    variant={selectedCategory === cat ? "default" : "outline"}
                    onClick={() => setSelectedCategory(cat)}
                    className="rounded-2xl h-12 px-8 font-black uppercase text-xs tracking-widest border-orange-100 shadow-sm"
                  >
                    {cat}
                  </Button>
                ))}
              </div>
            </ScrollArea>

            {/* Product Grid */}
            <ScrollArea className="flex-1 -mx-2 px-2">
              <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 pb-10">
                {filteredItems.map(item => (
                  <Card 
                    key={item.id} 
                    className={`rounded-3xl border-2 transition-all active:scale-95 group relative overflow-hidden ${
                      item.available ? "border-orange-50 hover:border-primary/30 cursor-pointer" : "opacity-50 grayscale cursor-not-allowed"
                    }`}
                    onClick={() => addToCart(item)}
                  >
                    <CardContent className="p-0">
                        <div className="aspect-[4/3] bg-muted relative overflow-hidden">
                           {item.image ? (
                             <img src={item.image} alt={item.name} className="w-full h-full object-cover transition-transform group-hover:scale-110" />
                           ) : (
                             <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                                <UtensilsCrossed size={48} />
                             </div>
                           )}
                           {!item.available && (
                             <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                                <span className="text-white font-black uppercase text-xs tracking-[0.2em] border-2 border-white/50 px-3 py-1 rounded-lg">Sold Out</span>
                             </div>
                           )}
                        </div>
                        <div className="p-4 space-y-1">
                           <h3 className="font-black text-foreground tracking-tight line-clamp-1">{item.name}</h3>
                           <div className="flex justify-between items-center">
                              <span className="text-primary font-black text-lg">${Number(item.price).toFixed(2)}</span>
                              <div className="bg-primary/10 text-primary w-8 h-8 rounded-xl flex items-center justify-center translate-y-2 group-hover:translate-y-0 opacity-0 group-hover:opacity-100 transition-all">
                                 <Plus size={16} strokeWidth={3} />
                              </div>
                           </div>
                        </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </ScrollArea>
          </div>
        </div>

        {/* Right: Cart Panel */}
        <aside className="w-[380px] bg-white border-l border-orange-100 flex flex-col shrink-0 shadow-2xl z-20">
          <header className="p-6 border-b border-orange-50 space-y-4">
            <div className="flex items-center justify-between">
               <h2 className="text-xl font-black text-foreground tracking-tighter uppercase flex items-center gap-2">
                 <ShoppingCart className="text-primary" />
                 Current Order
               </h2>
               <Badge className="bg-slate-100 text-slate-600 rounded-lg">{cart.length} ITEMS</Badge>
            </div>
          </header>

          <ScrollArea className="flex-1 p-6">
            <div className="space-y-4">
               {cart.length === 0 ? (
                 <div className="flex flex-col items-center justify-center py-20 text-center opacity-30 grayscale grayscale-0">
                    <UtensilsCrossed size={64} className="mb-4 text-muted-foreground/20" />
                    <p className="font-black text-sm text-muted-foreground uppercase tracking-widest">Cart is Empty</p>
                 </div>
               ) : (
                 cart.map(item => (
                   <div key={item.id} className="flex gap-4 group p-1 animate-in slide-in-from-right-4 fade-in">
                      <div className="flex-1 space-y-1">
                        <p className="font-black text-foreground leading-none tracking-tight">{item.name}</p>
                        <p className="text-xs font-bold text-primary">${item.price.toFixed(2)} x {item.quantity}</p>
                      </div>
                      <div className="flex items-center gap-1 bg-muted/30 rounded-xl p-1 border">
                         <Button 
                           variant="ghost" 
                           size="icon" 
                           className="h-8 w-8 rounded-lg hover:bg-white hover:text-red-500" 
                           onClick={() => updateQuantity(item.id, -1)}
                         >
                            <Minus size={14} strokeWidth={3} />
                         </Button>
                         <span className="w-8 text-center font-black text-sm">{item.quantity}</span>
                         <Button 
                           variant="ghost" 
                           size="icon" 
                           className="h-8 w-8 rounded-lg hover:bg-white hover:text-primary" 
                           onClick={() => updateQuantity(item.id, 1)}
                         >
                            <Plus size={14} strokeWidth={3} />
                         </Button>
                      </div>
                   </div>
                 ))
               )}
            </div>
          </ScrollArea>

          <footer className="p-6 bg-orange-50/30 border-t border-orange-100 space-y-6">
             <div className="space-y-2">
                <div className="flex justify-between text-muted-foreground font-bold text-sm tracking-widest uppercase">
                   <span>Subtotal</span>
                   <span>${total.toFixed(2)}</span>
                </div>
                <div className="h-[1px] bg-orange-100 w-full" />
                <div className="flex justify-between text-foreground font-black text-2xl tracking-tighter">
                   <span className="uppercase">Total Amount</span>
                   <span>${total.toFixed(2)}</span>
                </div>
             </div>

             <div className="grid grid-cols-2 gap-3">
               {!existingOrder || existingOrder.paymentStatus === "paid" ? (
                 <Button 
                   className="col-span-2 h-16 rounded-2xl bg-primary hover:bg-primary/90 text-white font-black text-lg shadow-xl shadow-orange-200 active:scale-95 transition-all"
                   disabled={cart.length === 0}
                   onClick={handleSendToKitchen}
                 >
                   <CookingPot className="w-5 h-5 mr-3" />
                   SEND TO KITCHEN
                 </Button>
               ) : (
                 <>
                   <Button 
                      variant="outline"
                      className="h-16 rounded-2xl bg-white border-orange-100 font-black text-xs text-primary shadow-sm hover:bg-orange-50 active:scale-95 transition-all"
                      onClick={handleSendToKitchen}
                   >
                     UPDATE ORDER
                   </Button>
                   <Button 
                      className="h-16 rounded-2xl bg-emerald-500 hover:bg-emerald-600 text-white font-black text-xs shadow-xl shadow-emerald-100 animate-in zoom-in active:scale-95 transition-all"
                      onClick={handlePayment}
                   >
                     <CreditCard className="w-5 h-5 mr-2" />
                     PAYMENT
                   </Button>
                 </>
               )}
             </div>
          </footer>
        </aside>
      </div>
    </POSLayout>
  );
};
