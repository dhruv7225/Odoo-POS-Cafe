import React from "react";
import { usePOS } from "@/context/POSContext";
import { POSLayout } from "@/layouts/POSLayout";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Utensils, CheckCircle2, Clock } from "lucide-react";
import { toast } from "sonner";

export const ReadyOrders: React.FC = () => {
  const { getReadyOrders, markAsServed, tables } = usePOS();

  const readyOrders = getReadyOrders();

  const getTableNumber = (tableId: string) => {
    return tables.find(t => t.id === tableId)?.number || "??";
  };

  const handlePickup = async (orderId: string) => {
    try {
      await markAsServed(orderId);
      // markAsServed calls orderApi.complete → backend sets order COMPLETED
      // This removes it from:
      //   - Waiter's ready orders (this list)
      //   - Chef's "Ready for Pickup" column (ticket excluded when order is COMPLETED)
    } catch (err: any) {
      toast.error(err.message || "Failed to mark as served");
    }
  };

  return (
    <POSLayout>
      <div className="max-w-5xl mx-auto space-y-6">

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Ready for Pickup</h1>
            <p className="text-sm text-muted-foreground mt-0.5">Orders that are ready to be served to tables.</p>
          </div>
          <Badge className="bg-emerald-500 text-white rounded-xl px-3.5 py-1.5 font-semibold text-xs tracking-wide animate-in slide-in-from-right-4">
            {readyOrders.length} orders ready
          </Badge>
        </div>

        {/* Empty State */}
        {readyOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-20 bg-card rounded-2xl border border-dashed border-border text-center animate-in fade-in zoom-in duration-300">
            <div className="w-16 h-16 bg-emerald-50 rounded-2xl flex items-center justify-center mb-5 text-emerald-500">
              <Utensils size={30} />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">Kitchen is Preparing...</h2>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              There are currently no orders ready for pickup. You'll be notified when the chef finishes.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {readyOrders.map(order => (
              <Card key={order.id} className="rounded-2xl border-2 border-emerald-100 shadow-md shadow-emerald-500/5 animate-in slide-in-from-bottom-4 duration-300">
                <CardHeader className="bg-emerald-50/60 pb-4 rounded-t-2xl">
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2.5">
                      <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center text-lg font-bold shadow-md shadow-emerald-200">
                        {order.tableNo || getTableNumber(order.tableId)}
                      </div>
                      <CardTitle className="text-base font-bold tracking-tight text-foreground">
                        Table {order.tableNo || getTableNumber(order.tableId)}
                      </CardTitle>
                    </div>
                    <Badge variant="outline" className="bg-white border-emerald-200 text-emerald-600 font-semibold text-[10px] tracking-wide rounded-lg">
                      Ready Now
                    </Badge>
                  </div>
                </CardHeader>

                <CardContent className="pt-5 pb-2">
                  <div className="space-y-3">
                    <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                      <Clock size={12} className="text-emerald-500" />
                      {order.orderNo} · Placed {Math.floor((Date.now() - order.createdAt) / 60000)}m ago
                    </div>

                    <div className="space-y-1.5 bg-muted/20 p-3.5 rounded-xl border border-border/50">
                      {order.items.map((item, idx) => (
                        <div key={idx} className="flex justify-between items-center">
                          <span className="text-sm text-foreground font-medium flex items-center gap-2">
                            <span className="text-emerald-500 font-bold text-xs">{item.quantity}×</span>
                            {item.name}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </CardContent>

                <CardFooter className="p-4">
                  <Button
                    className="w-full h-12 bg-emerald-500 hover:bg-emerald-600 text-white font-semibold text-sm rounded-xl shadow-md shadow-emerald-100 active:scale-95 transition-all flex items-center gap-2"
                    onClick={() => handlePickup(order.id)}
                  >
                    <CheckCircle2 size={18} strokeWidth={2.5} />
                    Confirm Pickup & Serve
                  </Button>
                </CardFooter>
              </Card>
            ))}
          </div>
        )}
      </div>
    </POSLayout>
  );
};
