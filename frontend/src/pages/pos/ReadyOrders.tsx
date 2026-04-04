import React from "react";
import { usePOS } from "@/context/POSContext";
import { POSLayout } from "@/layouts/POSLayout";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Utensils, CheckCircle2, Clock } from "lucide-react";

export const ReadyOrders: React.FC = () => {
  const { getReadyOrders, markAsServed, tables } = usePOS();
  
  const readyOrders = getReadyOrders();

  const getTableNumber = (tableId: string) => {
    return tables.find(t => t.id === tableId)?.number || "??";
  };

  return (
    <POSLayout>
      <div className="max-w-5xl mx-auto space-y-8">
        
        <header className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="space-y-1">
            <h1 className="text-3xl font-black tracking-tight text-foreground uppercase">Ready For Pickup</h1>
            <p className="text-muted-foreground font-medium">Orders that are ready to be served to tables.</p>
          </div>
          <Badge className="bg-emerald-500 text-white rounded-2xl px-4 py-1.5 font-black text-xs tracking-widest animate-in slide-in-from-right-4">
            {readyOrders.length} ORDERS READY
          </Badge>
        </header>

        {readyOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-20 bg-white rounded-3xl border-2 border-dashed border-emerald-100 text-center animate-in fade-in zoom-in duration-500">
            <div className="w-20 h-20 bg-emerald-50 rounded-full flex items-center justify-center mb-6 text-emerald-500">
              <Utensils size={40} />
            </div>
            <h2 className="text-2xl font-black text-foreground mb-2 whitespace-nowrap">Kitchen is Preparing...</h2>
            <p className="text-muted-foreground font-medium max-w-sm mx-auto">
              There are currently no orders ready for pickup. Notifications will play once the chef finishes.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {readyOrders.map(order => (
              <Card key={order.id} className="rounded-3xl border-2 border-emerald-100 shadow-xl shadow-emerald-500/5 animate-in slide-in-from-bottom-6 duration-300">
                <CardHeader className="bg-emerald-50/50 pb-4">
                  <div className="flex justify-between items-start">
                     <div className="flex items-center gap-2">
                        <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center text-xl font-black shadow-lg shadow-emerald-200">
                           {getTableNumber(order.tableId)}
                        </div>
                        <CardTitle className="text-lg font-black tracking-tight uppercase">Table {getTableNumber(order.tableId)}</CardTitle>
                     </div>
                     <Badge variant="outline" className="bg-white border-emerald-200 text-emerald-600 font-black text-[10px] tracking-tighter">
                        READY NOW
                     </Badge>
                  </div>
                </CardHeader>
                
                <CardContent className="pt-6 pb-2">
                   <div className="space-y-3">
                      <div className="flex items-center gap-2 text-xs font-black text-muted-foreground tracking-widest uppercase">
                         <Clock size={12} className="text-emerald-500" />
                         Placed {Math.floor((Date.now() - order.createdAt) / 60000)}m ago
                      </div>
                      
                      <div className="space-y-1.5 bg-muted/20 p-4 rounded-2xl border border-muted/50">
                        {order.items.map((item, idx) => (
                          <div key={idx} className="flex justify-between items-center">
                             <span className="font-bold text-sm text-foreground flex items-center gap-2">
                                <span className="text-emerald-500 font-black text-xs">{item.quantity}x</span>
                                {item.name}
                             </span>
                          </div>
                        ))}
                      </div>
                   </div>
                </CardContent>

                <CardFooter className="p-6">
                   <Button 
                     className="w-full h-14 bg-emerald-500 hover:bg-emerald-600 text-white font-black text-sm rounded-2xl shadow-lg shadow-emerald-100 active:scale-95 transition-all flex items-center gap-2"
                     onClick={() => markAsServed(order.id)}
                   >
                     <CheckCircle2 size={20} strokeWidth={3} />
                     MARK AS SERVED
                   </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}

        {/* Legend */}
        <div className="flex items-center justify-center gap-8 py-10 opacity-30">
           <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-black tracking-widest uppercase">Ready to serve</span>
           </div>
           <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-orange-500" />
              <span className="text-[10px] font-black tracking-widest uppercase">In Preparation</span>
           </div>
        </div>
      </div>
    </POSLayout>
  );
};
