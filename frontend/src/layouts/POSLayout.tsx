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
    <div className="flex h-screen bg-[#FDFBF9] overflow-hidden font-sans">
      <div className="flex-1 flex flex-col min-h-screen">
        
        {/* Topbar */}
        <header className="h-16 flex items-center justify-between px-6 bg-white border-b border-orange-100 shadow-sm z-30 shrink-0">
          <div className="flex items-center gap-6">
            <Link to="/pos" className="flex items-center gap-3">
              <div className="bg-primary p-2 rounded-xl text-primary-foreground shadow-md animate-pulse">
                <Coffee size={24} />
              </div>
              <span className="font-black text-2xl tracking-tighter text-foreground uppercase hidden sm:inline">POSCafe</span>
            </Link>

            <nav className="hidden md:flex items-center gap-1 bg-muted/30 p-1 rounded-xl border border-muted/50">
              <Button 
                variant={location.pathname === "/pos" ? "default" : "ghost"}
                asChild
                className="rounded-lg h-10 font-bold"
              >
                <Link to="/pos">
                  <LayoutGrid className="w-4 h-4 mr-2" />
                  Table View
                </Link>
              </Button>
              <Button 
                variant={location.pathname === "/pos/ready-orders" ? "default" : "ghost"}
                asChild
                className="relative rounded-lg h-10 font-bold"
              >
                <Link to="/pos/ready-orders">
                  <Clock className="w-4 h-4 mr-2" />
                  Ready Orders
                  {readyCount > 0 && (
                    <Badge className="ml-2 bg-emerald-500 text-white rounded-full px-1.5 h-5 flex items-center justify-center animate-bounce">
                      {readyCount}
                    </Badge>
                  )}
                </Link>
              </Button>
            </nav>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex flex-col items-end mr-2 hidden sm:flex">
              <span className="text-xs font-black text-primary/70 uppercase tracking-widest">Waiter Station</span>
              <span className="text-sm font-bold text-foreground flex items-center gap-1">
                <User size={14} className="text-primary" />
                {user?.name}
              </span>
            </div>
            
            <Button 
              variant="outline" 
              size="icon" 
              onClick={handleLogout}
              className="rounded-xl border-orange-100 hover:bg-red-50 hover:text-red-600 transition-all hover:border-red-200"
              title="Logout"
            >
              <LogOut size={20} />
            </Button>
          </div>
        </header>

        {/* Floating Actions on Mobile */}
        <div className="md:hidden fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-white shadow-2xl rounded-2xl border border-orange-100 p-2 flex items-center gap-2">
          <Button 
            variant={location.pathname === "/pos" ? "default" : "ghost"}
            size="icon"
            asChild
            className="rounded-xl h-12 w-12"
          >
            <Link to="/pos"><LayoutGrid size={24} /></Link>
          </Button>
          <Button 
            variant={location.pathname === "/pos/ready-orders" ? "default" : "ghost"}
            size="icon"
            asChild
            className="relative rounded-xl h-12 w-12"
          >
            <Link to="/pos/ready-orders">
              <Clock size={24} />
              {readyCount > 0 && (
                <span className="absolute -top-1 -right-1 flex h-6 w-6">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-6 w-6 bg-emerald-500 text-white items-center justify-center text-[10px] font-black">
                    {readyCount}
                  </span>
                </span>
              )}
            </Link>
          </Button>
        </div>

        {/* Dynamic POS Content */}
        <main className="flex-1 overflow-auto p-4 sm:p-6 lg:p-10">
          {children}
        </main>
      </div>
    </div>
  );
};
