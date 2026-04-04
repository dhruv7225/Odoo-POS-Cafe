import React from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { Coffee, LogOut, LayoutGrid, Clock, User } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { usePOS } from "@/context/POSContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const POSLayout: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, logout } = useAuth();
  const { getReadyOrders } = usePOS();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const readyCount = getReadyOrders().length;

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans">
      <div className="flex-1 flex flex-col min-h-screen">

        {/* Topbar */}
        <header className="h-16 flex items-center justify-between px-6 bg-card border-b border-border backdrop-blur-sm z-30 shrink-0 shadow-sm">
          <div className="flex items-center gap-6">
            <Link to="/pos" className="flex items-center gap-3">
              <div className="bg-primary p-1.5 rounded-lg text-primary-foreground shadow-md shrink-0">
                <Coffee size={20} />
              </div>
              <span className="font-bold text-lg tracking-tight text-foreground hidden sm:inline">POSCafe</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1 bg-muted/40 p-1 rounded-xl border border-border/50">
              <Button
                variant={location.pathname === "/pos" ? "default" : "ghost"}
                asChild
                className="rounded-lg h-9 font-semibold text-sm"
              >
                <Link to="/pos">
                  <LayoutGrid className="w-4 h-4 mr-2" />
                  Table View
                </Link>
              </Button>
              <Button
                variant={location.pathname === "/pos/ready-orders" ? "default" : "ghost"}
                asChild
                className="relative rounded-lg h-9 font-semibold text-sm"
              >
                <Link to="/pos/ready-orders">
                  <Clock className="w-4 h-4 mr-2" />
                  Ready Orders
                  {readyCount > 0 && (
                    <Badge className="ml-2 bg-emerald-500 text-white rounded-full px-1.5 h-5 flex items-center justify-center text-[10px] font-bold animate-bounce">
                      {readyCount}
                    </Badge>
                  )}
                </Link>
              </Button>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex flex-col items-end mr-1">
              <span className="text-[10px] font-semibold text-primary/70 uppercase tracking-widest">Waiter Station</span>
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

        {/* Floating Mobile Nav */}
        <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-card shadow-2xl rounded-2xl border border-border p-1.5 flex items-center gap-1">
          <Button
            variant={location.pathname === "/pos" ? "default" : "ghost"}
            size="icon"
            asChild
            className="rounded-xl h-11 w-11"
          >
            <Link to="/pos"><LayoutGrid size={20} /></Link>
          </Button>
          <Button
            variant={location.pathname === "/pos/ready-orders" ? "default" : "ghost"}
            size="icon"
            asChild
            className="relative rounded-xl h-11 w-11"
          >
            <Link to="/pos/ready-orders">
              <Clock size={20} />
              {readyCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-5 w-5">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-5 w-5 bg-emerald-500 text-white items-center justify-center text-[9px] font-bold">
                    {readyCount}
                  </span>
                </span>
              )}
            </Link>
          </Button>
        </div>

        {/* Page Content */}
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-8 animate-in fade-in duration-300">
          {children}
        </main>
      </div>
    </div>
  );
};
