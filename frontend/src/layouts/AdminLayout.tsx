import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { 
  LayoutDashboard, 
  ShoppingBag, 
  Users, 
  Settings, 
  LogOut, 
  Bell, 
  Search, 
  Menu, 
  Coffee,
  PieChart,
  Utensils,
  Layers
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { Input } from "@/components/ui/input";

interface AdminLayoutProps {
  children: React.ReactNode;
}

const navItems = [
  { name: "Dashboard", href: "/admin/dashboard", icon: LayoutDashboard },
  { name: "Menu", href: "/admin/menu", icon: Utensils },
  { name: "Floors", href: "/admin/floors", icon: Layers },
  { name: "Orders", href: "/admin/orders", icon: ShoppingBag },
  { name: "Customers", href: "/admin/customers", icon: Users },
  { name: "Analytics", href: "/admin/analytics", icon: PieChart },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans">
      
      {/* Sidebar */}
      <aside 
        className={`${sidebarOpen ? "w-64" : "w-20"} transition-all duration-300 ease-in-out border-r border-border bg-card hidden md:flex flex-col z-20`}
      >
        <div className="h-16 flex items-center justify-between px-4 border-b border-border">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="bg-primary p-1.5 rounded-lg text-primary-foreground shrink-0">
              <Coffee size={20} />
            </div>
            {sidebarOpen && <span className="font-bold text-lg whitespace-nowrap text-foreground">POSCafe</span>}
          </div>
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-muted-foreground hover:text-foreground">
            <Menu size={20} />
          </button>
        </div>

        <nav className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto">
          {navItems.map((item) => {
            const isActive = location.pathname.startsWith(item.href);
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group ${
                  isActive 
                    ? "bg-primary text-primary-foreground font-semibold shadow-sm" 
                    : "text-muted-foreground hover:bg-muted hover:text-foreground font-medium"
                }`}
                title={!sidebarOpen ? item.name : undefined}
              >
                <item.icon size={20} className={isActive ? "text-primary-foreground" : "group-hover:text-foreground"} />
                {sidebarOpen && <span className="truncate">{item.name}</span>}
              </Link>
            )
          })}
        </nav>

        <div className="p-4 border-t border-border">
          {sidebarOpen ? (
            <div className="flex items-center gap-3 w-full bg-muted/50 p-2 rounded-lg border border-border/50">
              <div className="w-10 h-10 rounded-full bg-primary/20 text-primary flex items-center justify-center shrink-0 border border-primary/30">
                <span className="font-bold">{user?.name?.charAt(0) || "U"}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground truncate">{user?.name}</p>
                <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
              </div>
              <button 
                onClick={logout} 
                className="text-muted-foreground hover:text-destructive transition-colors shrink-0 p-1"
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <button 
              onClick={logout}
              className="w-full flex justify-center p-2 text-muted-foreground hover:text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
              title="Logout"
            >
              <LogOut size={20} />
            </button>
          )}
        </div>
      </aside>

      {/* Main Content Pane */}
      <main className="flex-1 flex flex-col bg-background h-screen overflow-hidden">
        
        {/* Topbar */}
        <header className="h-16 flex items-center justify-between px-6 border-b border-border bg-card/50 backdrop-blur-sm z-10 shrink-0">
          <div className="flex items-center flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input 
                placeholder="Search orders, customers..." 
                className="pl-9 bg-muted/40 border-border/50 focus-visible:ring-primary/20 h-9 rounded-full"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-4 pl-4 shrink-0">
            <button className="relative text-muted-foreground hover:text-foreground transition-colors p-2 rounded-full hover:bg-muted">
              <Bell size={20} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-destructive rounded-full border-2 border-card"></span>
            </button>
            <div className="hidden md:flex items-center gap-2 border-l border-border pl-4">
              <span className="text-sm font-medium text-muted-foreground mr-1">Admin</span>
              <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center border border-primary/30">
                <span className="font-semibold text-sm">{user?.name?.charAt(0) || "U"}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-x-hidden overflow-y-auto bg-background p-6 lg:p-8 animate-in fade-in duration-300">
          {children}
        </div>
        
      </main>
    </div>
  );
};
