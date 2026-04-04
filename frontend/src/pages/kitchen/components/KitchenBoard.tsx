import React, { useMemo } from "react";
import { usePOS } from "@/context/POSContext";
import { OrderCard } from "./OrderCard";

const STATUS_COLUMNS = [
  {
    id: "placed",
    title: "To Cook",
    badge: "bg-amber-50 text-amber-600 border border-amber-200",
    header: "border-amber-200 bg-amber-50/50",
    dot: "bg-amber-400",
  },
  {
    id: "preparing",
    title: "Preparing",
    badge: "bg-blue-50 text-blue-600 border border-blue-200",
    header: "border-blue-200 bg-blue-50/50",
    dot: "bg-blue-400",
  },
  {
    id: "ready",
    title: "Ready for Pickup",
    badge: "bg-emerald-50 text-emerald-600 border border-emerald-200",
    header: "border-emerald-200 bg-emerald-50/50",
    dot: "bg-emerald-400",
  },
];

export const KitchenBoard: React.FC = () => {
  const { orders } = usePOS();

  const activeOrders = useMemo(() => {
    return orders
      .filter((o) => ["placed", "preparing", "ready"].includes(o.status))
      .sort((a, b) => a.createdAt - b.createdAt);
  }, [orders]);

  return (
    <div className="flex h-full gap-5 min-w-max pb-4">
      {STATUS_COLUMNS.map((column) => {
        const columnOrders = activeOrders.filter((o) => o.status === column.id);

        return (
          <div key={column.id} className="flex flex-col w-[360px] shrink-0 h-full max-h-full">

            {/* Column Header */}
            <header className={`flex items-center justify-between px-4 py-3 mb-4 rounded-2xl border-2 ${column.header} shadow-sm`}>
              <h2 className="font-bold text-base tracking-tight text-foreground flex items-center gap-2">
                <span className={`w-2.5 h-2.5 rounded-full ${column.dot}`} />
                {column.title}
              </h2>
              <span className={`font-bold text-xs px-2.5 py-1 rounded-lg ${column.badge}`}>
                {columnOrders.length}
              </span>
            </header>

            {/* Column Body */}
            <div className="flex-1 overflow-y-auto pb-6 bg-muted/10 rounded-2xl border border-border p-3 space-y-3">
              {columnOrders.length === 0 ? (
                <div className="h-28 flex items-center justify-center rounded-xl border border-dashed border-border">
                  <p className="text-sm font-medium text-muted-foreground">No orders</p>
                </div>
              ) : (
                columnOrders.map((order) => (
                  <OrderCard key={order.id} order={order} />
                ))
              )}
            </div>

          </div>
        );
      })}
    </div>
  );
};
