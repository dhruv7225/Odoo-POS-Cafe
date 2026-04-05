import React, { useState, useEffect } from "react";
import { Card, CardHeader, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Timer, ArrowRight, CheckCircle2 } from "lucide-react";
import { kitchenApi } from "@/lib/api";
import { toast } from "sonner";
import type { KitchenTicket } from "../KitchenDisplay";

interface OrderCardProps {
  ticket: KitchenTicket;
  onRefresh: () => void;
}

export const KitchenOrderCard: React.FC<OrderCardProps> = ({ ticket, onRefresh }) => {
  const [preparedItems, setPreparedItems] = useState<Set<number>>(new Set());
  const [loading, setLoading] = useState(false);
  const [timeElapsed, setTimeElapsed] = useState<number>(
    Date.now() - new Date(ticket.sentAt).getTime()
  );

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeElapsed(Date.now() - new Date(ticket.sentAt).getTime());
    }, 10000);
    return () => clearInterval(timer);
  }, [ticket.sentAt]);

  const toggleItem = (itemId: number) => {
    if (ticket.ticketStatus === "COMPLETED") return;
    setPreparedItems((prev) => {
      const next = new Set(prev);
      if (next.has(itemId)) next.delete(itemId);
      else next.add(itemId);
      return next;
    });
  };

  const handleStartCooking = async () => {
    setLoading(true);
    try {
      await kitchenApi.startPreparing(ticket.id);
      toast.success("Started cooking!");
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to start");
    } finally {
      setLoading(false);
    }
  };

  const handleMarkReady = async () => {
    setLoading(true);
    try {
      await kitchenApi.completeTicket(ticket.id);
      toast.success("Order marked as ready!");
      onRefresh();
    } catch (err: any) {
      toast.error(err.message || "Failed to complete");
    } finally {
      setLoading(false);
    }
  };

  const minutes = Math.floor(timeElapsed / 60000);
  const isUrgent = minutes > 10 && ticket.ticketStatus !== "COMPLETED";
  const allPrepared =
    ticket.items.length > 0 && preparedItems.size >= ticket.items.length;

  return (
    <Card
      className={`rounded-2xl border-2 bg-card shadow-sm overflow-hidden flex flex-col transition-all hover:shadow-md animate-in slide-in-from-bottom-2 ${
        isUrgent
          ? "border-red-300 shadow-red-100 animate-pulse"
          : ticket.ticketStatus === "COMPLETED"
          ? "border-emerald-200"
          : ticket.ticketStatus === "PREPARING"
          ? "border-blue-200"
          : "border-amber-200"
      }`}
    >
      {/* Header */}
      <CardHeader className="p-4 pb-3 border-b border-border">
        <div className="flex items-start justify-between gap-2">
          <div>
            <p className="text-2xl font-black text-foreground tracking-tight leading-none">
              {ticket.tableNo || "—"}
            </p>
            <p className="text-xs font-medium text-muted-foreground mt-0.5 tracking-wide">
              {ticket.orderNo}
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
            {ticket.ticketStatus === "TO_COOK" && (
              <Badge className="bg-amber-50 text-amber-600 border border-amber-200 text-[10px] font-semibold rounded-md px-2">
                TO COOK
              </Badge>
            )}
            {ticket.ticketStatus === "PREPARING" && (
              <Badge className="bg-blue-50 text-blue-600 border border-blue-200 text-[10px] font-semibold rounded-md px-2">
                COOKING
              </Badge>
            )}
            {ticket.ticketStatus === "COMPLETED" && (
              <Badge className="bg-emerald-50 text-emerald-600 border border-emerald-200 text-[10px] font-semibold rounded-md px-2">
                READY
              </Badge>
            )}
            {ticket.chefName && (
              <span className="text-[10px] text-muted-foreground">
                Chef: {ticket.chefName}
              </span>
            )}
          </div>
        </div>
      </CardHeader>

      {/* Items List */}
      <CardContent className="p-0 flex-1">
        <div className="divide-y divide-border/60">
          {ticket.items.map((item) => {
            const isPrepared =
              preparedItems.has(item.id) ||
              item.prepStatus === "COMPLETED" ||
              ticket.ticketStatus === "COMPLETED";

            return (
              <div
                key={item.id}
                onClick={() => toggleItem(item.id)}
                className={`flex items-center gap-3 px-4 py-3 transition-colors select-none ${
                  ticket.ticketStatus !== "COMPLETED"
                    ? "cursor-pointer hover:bg-muted/40 active:bg-muted/60"
                    : "cursor-default opacity-60"
                }`}
              >
                <span
                  className={`shrink-0 w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                    isPrepared
                      ? "bg-emerald-50 text-emerald-600"
                      : "bg-primary/10 text-primary"
                  }`}
                >
                  {item.qty}×
                </span>

                <span
                  className={`flex-1 text-sm font-medium leading-tight ${
                    isPrepared
                      ? "line-through text-muted-foreground"
                      : "text-foreground"
                  }`}
                >
                  {item.productName}
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
        {ticket.ticketStatus === "TO_COOK" && (
          <Button
            className="w-full h-11 bg-blue-500 hover:bg-blue-600 text-white font-semibold rounded-xl active:scale-[0.98] text-sm"
            onClick={handleStartCooking}
            disabled={loading}
          >
            {loading ? "Starting..." : "Start Cooking"}
            <ArrowRight className="w-4 h-4 ml-2" />
          </Button>
        )}

        {ticket.ticketStatus === "PREPARING" && (
          <Button
            className={`w-full h-11 font-semibold rounded-xl active:scale-[0.98] text-sm transition-colors ${
              allPrepared
                ? "bg-emerald-500 hover:bg-emerald-600 text-white shadow-md shadow-emerald-100"
                : "bg-card border-2 border-emerald-300 text-emerald-600 hover:bg-emerald-50"
            }`}
            onClick={handleMarkReady}
            disabled={loading}
          >
            <CheckCircle2 className="w-4 h-4 mr-2" />
            {loading ? "Completing..." : "Mark as Ready"}
          </Button>
        )}

        {ticket.ticketStatus === "COMPLETED" && (
          <div className="w-full h-11 flex items-center justify-center text-sm font-semibold text-emerald-600 bg-emerald-50 rounded-xl border border-emerald-200">
            Waiting for Pickup
          </div>
        )}
      </CardFooter>
    </Card>
  );
};
