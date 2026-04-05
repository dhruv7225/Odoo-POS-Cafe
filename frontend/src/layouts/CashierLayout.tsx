import React from "react";
import { Link, useNavigate } from "react-router-dom";
import { Coffee, LogOut, User, Wallet } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

export const CashierLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans">
      <div className="flex-1 flex flex-col min-h-screen">
        <header className="h-16 flex items-center justify-between px-6 bg-card border-b border-border backdrop-blur-sm z-30 shrink-0 shadow-sm">
          <div className="flex items-center gap-6">
            <Link to="/cashier" className="flex items-center gap-3">
              <div className="bg-primary p-1.5 rounded-lg text-primary-foreground shadow-md shrink-0">
                <Coffee size={20} />
              </div>
              <span className="font-bold text-lg tracking-tight text-foreground hidden sm:inline">POSCafe</span>
            </Link>
            <nav className="hidden md:flex items-center gap-1 bg-muted/40 p-1 rounded-xl border border-border/50">
              <Button variant="default" className="rounded-lg h-9 font-semibold text-sm">
                <Wallet className="w-4 h-4 mr-2" />
                Cashier Dashboard
              </Button>
            </nav>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end mr-1">
              <span className="text-[10px] font-semibold text-primary/70 uppercase tracking-widest">Cashier Station</span>
              <span className="text-sm font-medium text-foreground flex items-center gap-1">
                <User size={13} className="text-primary" />
                {user?.name}
              </span>
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
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 animate-in fade-in duration-300">
          {children}
        </main>
      </div>
    </div>
  );
};
