import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Clock, ChefHat, RefreshCw } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { KitchenBoard } from "./components/KitchenBoard";
import { kitchenApi } from "@/lib/api";
import { connectWebSocket, subscribe } from "@/lib/websocket";
import { toast } from "sonner";

export type KitchenTicket = {
  id: number;
  orderId: number;
  orderNo: string;
  tableNo: string | null;
  chefName: string | null;
  ticketStatus: "TO_COOK" | "PREPARING" | "COMPLETED";
  sentAt: string;
  startedAt: string | null;
  completedAt: string | null;
  items: { id: number; productName: string; qty: number; prepStatus: string; preparedAt: string | null }[];
};

export const KitchenDisplay: React.FC = () => {
  const { user, logout, restaurantId } = useAuth();
  const navigate = useNavigate();
  const [time, setTime] = useState(new Date());
  const [tickets, setTickets] = useState<KitchenTicket[]>([]);
  const [wsConnected, setWsConnected] = useState(false);

  const loadTickets = useCallback(async () => {
    if (!restaurantId) return;
    try {
      const data = await kitchenApi.getActiveTickets(restaurantId);
      setTickets(data as KitchenTicket[]);
    } catch (err) {
      console.error("Failed to load kitchen tickets", err);
    }
  }, [restaurantId]);

  // Clock
  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  // Initial load from DB
  useEffect(() => { loadTickets(); }, [loadTickets]);

  // Poll every 8s as fallback (in case WebSocket fails)
  useEffect(() => {
    if (!restaurantId) return;
    const interval = setInterval(loadTickets, 8000);
    return () => clearInterval(interval);
  }, [restaurantId, loadTickets]);

  // WebSocket for live updates
  useEffect(() => {
    if (!restaurantId) return;

    connectWebSocket()
      .then(() => {
        setWsConnected(true);
      })
      .catch(() => {
        console.warn("WebSocket failed — using polling only");
        setWsConnected(false);
      });

    const unsubs = [
      // New ticket from waiter → refresh to show in "To Cook"
      subscribe(`/topic/kitchen/${restaurantId}/new-ticket`, (ticket: any) => {
        toast.info(`New order: ${ticket.orderNo || "Order"} — Table ${ticket.tableNo || "?"}`, {
          description: "New order in kitchen!",
          duration: 5000,
        });
        loadTickets();
      }),
      // Ticket status update (start cooking, complete) → refresh
      subscribe(`/topic/kitchen/${restaurantId}/ticket-update`, () => {
        loadTickets();
      }),
      // Order ready notification
      subscribe(`/topic/kitchen/${restaurantId}/order-ready`, () => {
        loadTickets();
      }),
      // New order placed (before it hits kitchen) — just refresh
      subscribe(`/topic/orders/${restaurantId}/new-order`, () => {
        // Order placed but not yet sent to kitchen — no action needed for chef
      }),
    ];

    return () => unsubs.forEach((u) => u());
  }, [restaurantId, loadTickets]);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const activeCount = tickets.filter(
    (t) => t.ticketStatus === "TO_COOK" || t.ticketStatus === "PREPARING"
  ).length;

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden font-sans">
      <header className="h-16 shrink-0 flex items-center justify-between px-6 border-b border-border bg-card shadow-sm z-10">
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 text-primary p-1.5 rounded-lg flex items-center justify-center">
            <ChefHat size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-foreground">Kitchen Display</h1>
            <p className="text-xs text-muted-foreground font-medium">
              Active:{" "}
              <span className="text-primary font-bold">{activeCount}</span>
              {" · "}
              <span className={wsConnected ? "text-emerald-500" : "text-amber-500"}>
                {wsConnected ? "Live" : "Polling"}
              </span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <Button
            variant="outline"
            size="icon"
            onClick={loadTickets}
            className="rounded-xl h-9 w-9"
            title="Refresh"
          >
            <RefreshCw size={14} />
          </Button>

          <div className="hidden sm:flex items-center gap-2 text-base font-bold tracking-tight text-foreground bg-muted/40 px-3 py-1.5 rounded-xl border border-border">
            <Clock size={16} className="text-primary" />
            {time.toLocaleTimeString([], {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </div>

          <div className="hidden sm:flex flex-col items-end mr-1">
            <span className="text-[10px] font-semibold text-primary/70 uppercase tracking-widest">
              Kitchen Station
            </span>
            <span className="text-sm font-medium text-foreground">{user?.name}</span>
          </div>

          <Button
            variant="outline"
            size="icon"
            onClick={handleLogout}
            className="rounded-xl border-border hover:bg-destructive/10 hover:text-destructive hover:border-destructive/30 transition-all"
            title="Logout"
          >
            <LogOut size={18} />
          </Button>
        </div>
      </header>

      <main className="flex-1 overflow-x-auto overflow-y-hidden bg-background p-6 flex items-start justify-center">
        <KitchenBoard tickets={tickets} onRefresh={loadTickets} />
      </main>
    </div>
  );
};
