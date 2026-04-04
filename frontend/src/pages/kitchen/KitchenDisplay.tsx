import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut, Clock, ChefHat } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { usePOS } from "@/context/POSContext";
import { Button } from "@/components/ui/button";
import { KitchenBoard } from "./components/KitchenBoard";

export const KitchenDisplay: React.FC = () => {
  const { user, logout } = useAuth();
  const { orders } = usePOS();
  const navigate = useNavigate();
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const activeOrdersCount = orders.filter(
    (o) => o.status === "placed" || o.status === "preparing"
  ).length;

  return (
    <div className="flex flex-col h-screen bg-background text-foreground overflow-hidden font-sans">

      {/* Topbar — same structure as POSLayout */}
      <header className="h-16 shrink-0 flex items-center justify-between px-6 border-b border-border bg-card shadow-sm z-10">

        {/* Brand */}
        <div className="flex items-center gap-4">
          <div className="bg-primary/10 text-primary p-1.5 rounded-lg flex items-center justify-center">
            <ChefHat size={20} />
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-foreground">Kitchen Display</h1>
            <p className="text-xs text-muted-foreground font-medium">
              Active orders:{" "}
              <span className="text-primary font-bold">{activeOrdersCount}</span>
            </p>
          </div>
        </div>

        {/* Right: Clock + User */}
        <div className="flex items-center gap-4">
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

      {/* Board */}
      <main className="flex-1 overflow-x-auto overflow-y-hidden bg-background p-6">
        <KitchenBoard />
      </main>
    </div>
  );
};
