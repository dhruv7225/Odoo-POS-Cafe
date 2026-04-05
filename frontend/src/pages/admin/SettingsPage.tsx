import React, { useState, useEffect } from "react";
import { AdminLayout } from "@/layouts/AdminLayout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Sun, Moon, Monitor, Bell, Globe, Shield, Palette,
} from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/context/AuthContext";

type Theme = "light" | "dark" | "system";

export const SettingsPage: React.FC = () => {
  const { user } = useAuth();

  // Theme
  const [theme, setTheme] = useState<Theme>(() => (localStorage.getItem("poscafe_theme") as Theme) || "system");

  // Notification preferences
  const [soundEnabled, setSoundEnabled] = useState(() => localStorage.getItem("poscafe_sound") !== "false");
  const [desktopNotif, setDesktopNotif] = useState(() => localStorage.getItem("poscafe_desktop_notif") !== "false");

  // Restaurant settings (local)
  const [restaurantName, setRestaurantName] = useState("POSCafe");
  const [currency, setCurrency] = useState("₹");
  const [taxRate, setTaxRate] = useState("5");
  const [autoPrint, setAutoPrint] = useState(() => localStorage.getItem("poscafe_autoprint") === "true");

  // Apply theme
  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
    } else if (theme === "light") {
      root.classList.remove("dark");
    } else {
      // System preference
      if (window.matchMedia("(prefers-color-scheme: dark)").matches) {
        root.classList.add("dark");
      } else {
        root.classList.remove("dark");
      }
    }
    localStorage.setItem("poscafe_theme", theme);
  }, [theme]);

  const handleSaveNotifications = () => {
    localStorage.setItem("poscafe_sound", String(soundEnabled));
    localStorage.setItem("poscafe_desktop_notif", String(desktopNotif));
    localStorage.setItem("poscafe_autoprint", String(autoPrint));
    toast.success("Settings saved!");
  };

  const themeOptions: { value: Theme; label: string; icon: React.ReactNode }[] = [
    { value: "light", label: "Light", icon: <Sun size={18} /> },
    { value: "dark", label: "Dark", icon: <Moon size={18} /> },
    { value: "system", label: "System", icon: <Monitor size={18} /> },
  ];

  return (
    <AdminLayout>
      <div className="w-full max-w-3xl mx-auto space-y-6">
        <div>
          <h2 className="text-2xl font-bold tracking-tight text-foreground">Settings</h2>
          <p className="text-sm text-muted-foreground mt-1">Configure your POS system preferences</p>
        </div>

        {/* Profile */}
        <Card className="rounded-xl shadow-sm border-border/60">
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center text-primary font-bold text-lg">
                {user?.name?.charAt(0) || "A"}
              </div>
              <div>
                <CardTitle className="text-base">{user?.name || "Admin"}</CardTitle>
                <CardDescription>{user?.email}</CardDescription>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Appearance */}
        <Card className="rounded-xl shadow-sm border-border/60">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Palette size={18} className="text-primary" />
              <CardTitle className="text-base">Appearance</CardTitle>
            </div>
            <CardDescription>Choose your preferred theme</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-3 gap-3">
              {themeOptions.map(opt => (
                <button
                  key={opt.value}
                  onClick={() => setTheme(opt.value)}
                  className={`flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all ${
                    theme === opt.value
                      ? "border-primary bg-primary/5 shadow-sm"
                      : "border-border hover:border-primary/40"
                  }`}
                >
                  <div className={`p-2 rounded-lg ${theme === opt.value ? "bg-primary text-white" : "bg-muted text-muted-foreground"}`}>
                    {opt.icon}
                  </div>
                  <span className={`text-sm font-semibold ${theme === opt.value ? "text-primary" : "text-foreground"}`}>
                    {opt.label}
                  </span>
                </button>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card className="rounded-xl shadow-sm border-border/60">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Bell size={18} className="text-primary" />
              <CardTitle className="text-base">Notifications</CardTitle>
            </div>
            <CardDescription>Manage notification preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Sound Notifications</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Play sound when new orders arrive</p>
              </div>
              <Switch checked={soundEnabled} onCheckedChange={setSoundEnabled} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Desktop Notifications</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Show browser notifications for order updates</p>
              </div>
              <Switch checked={desktopNotif} onCheckedChange={setDesktopNotif} />
            </div>
            <Separator />
            <div className="flex items-center justify-between">
              <div>
                <Label className="text-sm font-medium">Auto-Print Receipts</Label>
                <p className="text-xs text-muted-foreground mt-0.5">Automatically print receipt on payment</p>
              </div>
              <Switch checked={autoPrint} onCheckedChange={setAutoPrint} />
            </div>
          </CardContent>
        </Card>

        {/* Restaurant Config */}
        <Card className="rounded-xl shadow-sm border-border/60">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Globe size={18} className="text-primary" />
              <CardTitle className="text-base">Restaurant</CardTitle>
            </div>
            <CardDescription>General restaurant configuration</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Restaurant Name</Label>
                <Input value={restaurantName} onChange={e => setRestaurantName(e.target.value)} className="h-9 rounded-xl" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Currency Symbol</Label>
                <Input value={currency} onChange={e => setCurrency(e.target.value)} className="h-9 rounded-xl w-20" />
              </div>
              <div className="space-y-2">
                <Label className="text-xs text-muted-foreground uppercase tracking-wider">Default Tax Rate (%)</Label>
                <Input type="number" value={taxRate} onChange={e => setTaxRate(e.target.value)} className="h-9 rounded-xl w-24" />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="rounded-xl shadow-sm border-border/60">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Shield size={18} className="text-primary" />
              <CardTitle className="text-base">Security</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/20">
              <div>
                <p className="text-sm font-medium">Change Password</p>
                <p className="text-xs text-muted-foreground mt-0.5">Update your account password</p>
              </div>
              <Button variant="outline" size="sm" className="rounded-xl" onClick={() => toast.info("Password change — coming soon")}>
                Change
              </Button>
            </div>
            <div className="flex items-center justify-between p-4 rounded-xl border bg-muted/20">
              <div>
                <p className="text-sm font-medium">Session Timeout</p>
                <p className="text-xs text-muted-foreground mt-0.5">Auto-logout after inactivity (24 hours)</p>
              </div>
              <Badge variant="outline" className="text-xs">24h</Badge>
            </div>
          </CardContent>
        </Card>

        {/* Save */}
        <div className="flex justify-end pb-8">
          <Button className="rounded-xl font-semibold px-8 shadow-md" onClick={handleSaveNotifications}>
            Save Settings
          </Button>
        </div>
      </div>
    </AdminLayout>
  );
};
