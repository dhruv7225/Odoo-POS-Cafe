import React, { useState, useEffect } from "react";
import { usePOS } from "@/context/POSContext";
import type { Order } from "@/context/POSContext";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Timer, ArrowRight, CheckCircle2 } from "lucide-react";

interface OrderCardProps {
  order: Order;
}

export const OrderCard: React.FC<OrderCardProps> = ({ order }) => {
  const { tables, updateOrderStatus } = usePOS();

  const [preparedItems, setPreparedItems] = useState<Set<string>>(new Set());
  const [timeElapsed, setTimeElapsed] = useState<number>(
    Date.now() - order.createdAt
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeElapsed(Date.now() - order.createdAt);
    }, 10000);
    return () => clearInterval(timer);
  }, [order.createdAt]);

  const toggleItem = (itemId: string, index: number) => {
    const key = `${itemId}-${index}`;
    setPreparedItems((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const handleNextStatus = () => {
    if (order.status === "placed") {
      updateOrderStatus(order.id, "preparing");
    } else if (order.status === "preparing") {
      const allKeys = new Set<string>(
        order.items.map((item, idx) => `${item.id}-${idx}`)
      );
      setPreparedItems(allKeys);
      updateOrderStatus(order.id, "ready");
    }
  };

  const minutes = Math.floor(timeElapsed / 60000);
  const isUrgent = minutes > 10 && order.status !== "ready";
  const allPrepared =
    order.items.length > 0 && preparedItems.size >= order.items.length;
  const tableNumber =
    tables.find((t) => t.id === order.tableId)?.number || "??";

  return (
    <Card
      className={`rounded-2xl border-2 bg-card shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md animate-in slide-in-from-bottom-2 ${
        isUrgent
          ? "border-red-300 shadow-red-100 animate-pulse"
          : order.status === "ready"
          ? "border-emerald-200"
          : order.status === "preparing"
          ? "border-blue-200"
          : "border-amber-200"
      }`}
    >
      {/* Header */}
      <CardHeader className="p-4 pb-3 border-b border-border">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-2xl font-black text-foreground tracking-tight leading-none">
              {tableNumber}
            </p>
            <p className="text-xs font-medium text-muted-foreground mt-0.5 tracking-wide">
              #{order.id.substring(order.id.length - 6).toUpperCase()}
            </p>
          </div>

          <div className="flex flex-col items-end gap-1.5">
            <Badge
              className={`text-xs font-semibold rounded-lg px-2.5 py-0.5 ${
                isUrgent
                  ? "bg-red-500 text-white"
                  : "bg-muted text-muted-foreground border border-border"
              }`}
            >
              <Timer size={11} className="mr-1" />
              {minutes}m ago
            </Badge>
            {order.status === "placed" && (
              <Badge className="bg-amber-50 text-amber-600 border border-amber-200 text-[10px] font-semibold rounded-md px-2">
                TO COOK
              </Badge>
            )}
            {order.status === "preparing" && (
              <Badge className="bg-blue-50 text-blue-600 border border-blue-200 text-[10px] font-semibold rounded-md px-2">
                COOKING
              </Badge>
            )}
            {order.status === "ready" && (
              <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-200 text-[10px] font-semibold rounded-md px-2">
                READY
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>

      {/* Items List */}
      <CardContent className="p-0 flex-1">
        <div className="divide-y divide-border/60">
          {order.items.map((item, idx) => {
            const key = `${item.id}-${idx}`;
            const isPrepared =
              preparedItems.has(key) || order.status === "ready";

            return (
              <div
                key={key}
                onClick={() =>
                  order.status !== "ready" && toggleItem(item.id, idx)
                }
                className={`flex items-center gap-3 px-4 py-3 transition-colors select-none ${
                  order.status !== "ready"
                    ? "cursor-pointer hover:bg-muted/40 active:bg-muted/60"
                    : "cursor-default opacity-60"
                }`}
              >
                {/* Quantity pill */}
                <span
                  className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                    isPrepared
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-primary/10 text-primary"
                  }`}
                >
                  {item.quantity}×
                </span>

                {/* Name */}
                <span
                  className={`flex-1 text-sm font-medium leading-tight ${
                    isPrepared
                      ? "line-through text-muted-foreground"
                      : "text-foreground"
                  }`}
                >
                  {item.name}
                </span>

                {isPrepared && (
                  <CheckCircle2
                    size={15}
                    className="shrink-0 text-emerald-500"
                  />
                )}
              </div>
            );
          })}
        </div>
      </CardContent>

      {/* Footer Action */}
      <CardFooter className="p-3 bg-muted/20 border-t border-border">
        {order.status === "placed" && (
          <Button
            className="w-full h-11 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl active:scale-[0.98] text-sm"
            onClick={handleNextStatus}
          >
            Start Cooking
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}

        {order.status === "preparing" && (
          <Button
            className={`w-full h-11 font-semibold rounded-xl active:scale-[0.98] text-sm transition-colors ${
              allPrepared
                ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-100"
                : "bg-card border-2 border-emerald-300 text-emerald-600 hover:bg-emerald-50"
            }`}
            onClick={handleNextStatus}
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            Mark as Ready
          </Button>
        )}

        {order.status === "ready" && (
          <div className="w-full h-11 flex items-center justify-center text-sm font-semibold text-emerald-600 bg-emerald-50 rounded-xl border border-emerald-200">
            Waiting for Pickup
          </div>
        )}
      </CardFooter>
    </Card>
  );
};
