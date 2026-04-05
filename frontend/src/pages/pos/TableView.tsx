import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { usePOS } from "@/context/POSContext";
import { POSLayout } from "@/layouts/POSLayout";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users, Utensils, CreditCard, Clock, CheckCircle2,
  LayoutTemplate, PowerOff, Power,
} from "lucide-react";
import { toast } from "sonner";
import { tableApi } from "@/lib/api";

export const TableView: React.FC = () => {
  const { floors, getTableStatus, getTableOrder, refreshTables } = usePOS();
  const [activeFloorId, setActiveFloorId] = useState<string>("");

  useEffect(() => {
    if (floors.length > 0 && !activeFloorId) setActiveFloorId(floors[0].id);
  }, [floors]);

  const toggleTableStatus = async (
    e: React.MouseEvent,
    _floorId: string,
    tableId: string,
    currentActive: boolean
  ) => {
    e.preventDefault();
    e.stopPropagation();
    const table = floors.flatMap((f) => f.tables).find((t) => t.id === tableId);
    if (!table) return;
    try {
      await tableApi.toggle(table.backendId);
      toast.success(currentActive ? "Table marked as inactive" : "Table marked as active");
      refreshTables();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "available":
        return { label: "Available", color: "bg-emerald-50 text-emerald-600 border-emerald-200", dot: "bg-emerald-500", icon: CheckCircle2 };
      case "occupied":
        return { label: "Occupied", color: "bg-red-50 text-red-600 border-red-200", dot: "bg-red-500", icon: Users };
      case "waiting":
        return { label: "Waiting", color: "bg-amber-50 text-amber-600 border-amber-200", dot: "bg-amber-500", icon: Clock };
      case "ready":
        return { label: "Ready", color: "bg-indigo-50 text-indigo-600 border-indigo-200", dot: "bg-indigo-500", icon: Utensils };
      case "payment_pending":
        return { label: "Payment", color: "bg-blue-50 text-blue-600 border-blue-200", dot: "bg-blue-500", icon: CreditCard };
      default:
        return { label: "Unknown", color: "bg-muted text-muted-foreground border-border", dot: "bg-muted-foreground", icon: Users };
    }
  };

  return (
    <POSLayout>
      <div className="max-w-7xl mx-auto space-y-6">

        {/* Page Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">Table Management</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              Select a table to manage orders. Long-press the power icon to toggle active status.
            </p>
          </div>

          {/* Status Legend */}
          <div className="flex flex-wrap items-center gap-1 bg-card p-1.5 rounded-xl border border-border shadow-sm">
            {["available", "waiting", "ready", "payment_pending"].map((status) => {
              const config = getStatusConfig(status);
              return (
                <div key={status} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg">
                  <div className={`w-2 h-2 rounded-full ${config.dot}`} />
                  <span className="text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">{config.label}</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Empty state */}
        {floors.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-20 bg-card rounded-2xl border border-dashed border-border text-center">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mb-5 text-primary">
              <LayoutTemplate size={30} />
            </div>
            <h2 className="text-xl font-semibold text-foreground mb-2">No Tables Found</h2>
            <p className="text-sm text-muted-foreground max-w-sm mx-auto">
              Please setup floors and tables in the Admin Dashboard before using the POS.
            </p>
          </div>
        ) : (
          <Tabs value={activeFloorId} onValueChange={setActiveFloorId} className="w-full">
            {/* Tab strip */}
            <div className="bg-card rounded-t-xl border border-border px-4 pt-4 pb-0 shadow-sm">
              <TabsList className="bg-muted/50 p-1 w-full sm:w-max border border-border overflow-x-auto">
                {floors.map(floor => (
                  <TabsTrigger
                    key={floor.id}
                    value={floor.id}
                    className="data-[state=active]:bg-background data-[state=active]:text-primary data-[state=active]:shadow-sm px-6 font-semibold whitespace-nowrap"
                  >
                    {floor.name}
                    <span className="ml-2 text-[10px] font-bold opacity-50">
                      {floor.tables.filter(t => t.active).length}
                    </span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </div>

            {/* Tab content */}
            {floors.map(floor => (
              <TabsContent
                key={floor.id}
                value={floor.id}
                className="border border-t-0 border-border rounded-b-xl bg-muted/10 p-5 sm:p-6 mt-0 outline-none min-h-[300px]"
              >
                {floor.tables.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-16 text-center">
                    <div className="w-12 h-12 rounded-full bg-card border flex items-center justify-center mb-3">
                      <LayoutTemplate className="w-5 h-5 text-muted-foreground/60" />
                    </div>
                    <p className="font-medium text-muted-foreground text-sm">No tables on this floor.</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
                    {floor.tables.map(table => {
                      const status = table.active ? getTableStatus(table.id) : "inactive";
                      const config = table.active
                        ? getStatusConfig(status)
                        : { label: "Inactive", color: "bg-muted text-muted-foreground border-border", dot: "bg-muted-foreground", icon: Users };
                      const order = table.active ? getTableOrder(table.id) : undefined;
                      const Icon = config.icon;

                      return (
                        <div key={table.id} className="relative group/card">
                          <Link
                            to={table.active ? `/pos/order/${table.id}` : "#"}
                            onClick={e => { if (!table.active) e.preventDefault(); }}
                            className={`block transition-all active:scale-95 ${!table.active ? "pointer-events-none" : ""}`}
                          >
                            <Card className={`h-full rounded-2xl border-2 transition-all ${
                              !table.active
                                ? "border-border opacity-50 grayscale"
                                : status === "available" ? "border-emerald-100 hover:border-emerald-300 group-hover/card:shadow-lg"
                                : status === "ready" ? "border-indigo-200 hover:border-indigo-400 animate-pulse bg-indigo-50/10"
                                : status === "waiting" ? "border-amber-200 hover:border-amber-400 group-hover/card:shadow-lg"
                                : status === "payment_pending" ? "border-blue-200 hover:border-blue-400 group-hover/card:shadow-lg"
                                : "border-red-100 hover:border-red-300 group-hover/card:shadow-lg"
                            }`}>
                              <CardContent className="p-5 flex flex-col items-center justify-center text-center">
                                <div className={`w-14 h-14 rounded-xl flex items-center justify-center mb-3 transition-all ${config.color}`}>
                                  <Icon size={26} strokeWidth={2} />
                                </div>
                                <h3 className="text-xl font-bold tracking-tight text-foreground mb-0.5">{table.number}</h3>
                                <div className="flex items-center gap-1 text-xs font-medium text-muted-foreground">
                                  <Users size={11} /> {table.seats} seats
                                </div>
                              </CardContent>

                              <CardFooter className="p-3 pt-0">
                                <Badge variant="outline" className={`w-full py-1.5 flex items-center justify-center gap-1.5 rounded-lg text-[10px] font-semibold uppercase tracking-wide border ${config.color}`}>
                                  <div className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
                                  {config.label}
                                </Badge>
                              </CardFooter>

                              {order && (
                                <div className="px-4 pb-4 pt-0">
                                  <div className="h-px w-full bg-border mb-3" />
                                  <div className="flex justify-between items-center bg-muted/30 px-3 py-2 rounded-lg">
                                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">Total</span>
                                    <span className="text-sm font-bold text-foreground">₹{order.total.toFixed(2)}</span>
                                  </div>
                                </div>
                              )}
                            </Card>
                          </Link>

                          {/* Toggle button — appears on hover in top-right corner */}
                          <button
                            onClick={e => toggleTableStatus(e, floor.id, table.id, table.active)}
                            title={table.active ? "Mark table as inactive" : "Mark table as active"}
                            className={`absolute top-2 right-2 z-10 w-7 h-7 rounded-lg flex items-center justify-center transition-all opacity-0 group-hover/card:opacity-100 shadow-sm border ${
                              table.active
                                ? "bg-red-50 text-red-500 border-red-200 hover:bg-red-100"
                                : "bg-emerald-50 text-emerald-600 border-emerald-200 hover:bg-emerald-100"
                            }`}
                          >
                            {table.active ? <PowerOff size={13} strokeWidth={2.5} /> : <Power size={13} strokeWidth={2.5} />}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </POSLayout>
  );
};
