import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingBag,
  Settings,
  LogOut,
  Bell,
  Search,
  Menu,
  Coffee,
  PieChart,
  Utensils,
  Layers,
  X
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
  { name: "Analytics", href: "/admin/analytics", icon: PieChart },
  { name: "Settings", href: "/admin/settings", icon: Settings },
];

export const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on route change
  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location.pathname]);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 768) setMobileMenuOpen(false);
    };
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const SidebarContent = ({ collapsed, onNavClick }: { collapsed: boolean; onNavClick?: () => void }) => (
    <>
      <nav className="flex-1 py-6 px-3 space-y-1.5 overflow-y-auto">
        {navItems.map((item) => {
          const isActive = location.pathname.startsWith(item.href);
          return (
            <Link
              key={item.name}
              to={item.href}
              onClick={onNavClick}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-colors group ${
                isActive
                  ? "bg-primary text-primary-foreground font-semibold shadow-sm"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground font-medium"
              }`}
              title={collapsed ? item.name : undefined}
            >
              <item.icon size={20} className={`shrink-0 ${isActive ? "text-primary-foreground" : "group-hover:text-foreground"}`} />
              {!collapsed && <span className="truncate">{item.name}</span>}
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-border">
        {!collapsed ? (
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
    </>
  );

  return (
    <div className="flex h-screen bg-background overflow-hidden font-sans">

      {/* Desktop Sidebar */}
      <aside
        className={`${sidebarOpen ? "w-64" : "w-20"} transition-all duration-300 ease-in-out border-r border-border bg-card hidden md:flex flex-col z-20`}
      >
        <div className={`h-16 flex items-center ${sidebarOpen ? "justify-between" : "justify-center"} px-4 border-b border-border`}>
          {sidebarOpen && (
            <div className="flex items-center gap-3 overflow-hidden">
              <div className="bg-primary p-1.5 rounded-lg text-primary-foreground shrink-0">
                <Coffee size={20} />
              </div>
              <span className="font-bold text-lg whitespace-nowrap text-foreground">POSCafe</span>
            </div>
          )}
          <button onClick={() => setSidebarOpen(!sidebarOpen)} className="text-muted-foreground hover:text-foreground shrink-0">
            <Menu size={20} />
          </button>
        </div>

        <SidebarContent collapsed={!sidebarOpen} />
      </aside>

      {/* Mobile Sidebar Overlay */}
      {mobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setMobileMenuOpen(false)}
          />
          {/* Drawer */}
          <aside className="absolute top-0 left-0 h-full w-72 bg-card border-r border-border flex flex-col animate-in slide-in-from-left duration-200">
            <div className="h-16 flex items-center justify-between px-4 border-b border-border">
              <div className="flex items-center gap-3">
                <div className="bg-primary p-1.5 rounded-lg text-primary-foreground shrink-0">
                  <Coffee size={20} />
                </div>
                <span className="font-bold text-lg text-foreground">POSCafe</span>
              </div>
              <button
                onClick={() => setMobileMenuOpen(false)}
                className="text-muted-foreground hover:text-foreground p-1"
              >
                <X size={20} />
              </button>
            </div>
            <SidebarContent collapsed={false} onNavClick={() => setMobileMenuOpen(false)} />
          </aside>
        </div>
      )}

      {/* Main Content Pane */}
      <main className="flex-1 flex flex-col bg-background h-screen overflow-hidden">

        {/* Topbar */}
        <header className="h-16 flex items-center justify-between px-4 md:px-6 border-b border-border bg-card/50 backdrop-blur-sm z-10 shrink-0 gap-3">
          {/* Mobile hamburger */}
          <button
            className="md:hidden text-muted-foreground hover:text-foreground p-2 -ml-1 shrink-0"
            onClick={() => setMobileMenuOpen(true)}
          >
            <Menu size={22} />
          </button>

          {/* Mobile logo */}
          <div className="md:hidden flex items-center gap-2 shrink-0">
            <div className="bg-primary p-1 rounded-md text-primary-foreground">
              <Coffee size={16} />
            </div>
            <span className="font-bold text-sm text-foreground">POSCafe</span>
          </div>

          <div className="hidden md:flex items-center flex-1 max-w-md">
            <div className="relative w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground h-4 w-4" />
              <Input
                placeholder="Search orders, customers..."
                className="pl-9 bg-muted/40 border-border/50 focus-visible:ring-primary/20 h-9 rounded-full"
              />
            </div>
          </div>

          <div className="flex items-center gap-3 ml-auto shrink-0">
            <div className="hidden md:flex items-center gap-2 border-l border-border pl-3">
              <span className="text-sm font-medium text-muted-foreground mr-1">Admin</span>
              <div className="w-8 h-8 rounded-full bg-primary/20 text-primary flex items-center justify-center border border-primary/30">
                <span className="font-semibold text-sm">{user?.name?.charAt(0) || "U"}</span>
              </div>
            </div>
          </div>
        </header>

        {/* Dashboard Content */}
        <div className="flex-1 overflow-x-hidden overflow-y-auto bg-background p-4 md:p-6 lg:p-8 animate-in fade-in duration-300">
          {children}
        </div>

      </main>
    </div>
  );
};
