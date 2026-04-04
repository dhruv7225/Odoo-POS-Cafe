import React from "react";
import { Link } from "react-router-dom";
import { usePOS } from "@/context/POSContext";
import { POSLayout } from "@/layouts/POSLayout";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Users, Utensils, CreditCard, Clock, CheckCircle2 } from "lucide-react";

export const TableView: React.FC = () => {
  const { tables, getTableStatus, getTableOrder } = usePOS();

  const getStatusConfig = (status: string) => {
    switch (status) {
      case "available":
        return { label: "Available", color: "bg-emerald-50 text-emerald-600 border-emerald-200", icon: CheckCircle2 };
      case "occupied":
        return { label: "Occupied", color: "bg-red-50 text-red-600 border-red-200", icon: Users };
      case "waiting":
        return { label: "Waiting", color: "bg-amber-50 text-amber-600 border-amber-200", icon: Clock };
      case "ready":
        return { label: "Ready", color: "bg-indigo-50 text-indigo-600 border-indigo-200", icon: Utensils };
      case "payment_pending":
        return { label: "Payment", color: "bg-blue-50 text-blue-600 border-blue-200", icon: CreditCard };
      default:
        return { label: "Unknown", color: "bg-gray-50 text-gray-600 border-gray-200", icon: Users };
    }
  };

  return (
    <POSLayout>
      <div className="max-w-7xl mx-auto space-y-8">
        
        <header className="flex items-center justify-between">
          <div className="space-y-1">
            <h1 className="text-3xl font-black tracking-tight text-foreground uppercase">Table Management</h1>
            <p className="text-muted-foreground font-medium">Select a table to manage orders or payments.</p>
          </div>
          
          <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-orange-100 shadow-sm">
             {["available", "waiting", "ready", "payment_pending"].map((status) => {
               const config = getStatusConfig(status);
               return (
                 <div key={status} className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all">
                   <div className={`w-2 h-2 rounded-full ${config.color.split(" ")[0].replace("-50", "-500")}`} />
                   <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">{config.label}</span>
                 </div>
               );
             })}
          </div>
        </header>

        {tables.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-20 bg-white rounded-3xl border-2 border-dashed border-orange-100 text-center">
            <div className="w-20 h-20 bg-orange-50 rounded-full flex items-center justify-center mb-6 text-primary">
              <Users size={40} />
            </div>
            <h2 className="text-2xl font-black text-foreground mb-2">No Tables Found</h2>
            <p className="text-muted-foreground font-medium max-w-sm mx-auto">
              Please setup floors and tables in the Admin Dashboard before using the POS.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-6">
            {tables.map(table => {
              const status = getTableStatus(table.id);
              const config = getStatusConfig(status);
              const order = getTableOrder(table.id);
              const Icon = config.icon;

              return (
                <Link key={table.id} to={`/pos/order/${table.id}`} className="group transition-all active:scale-95">
                  <Card className={`h-full rounded-3xl border-2 transition-all group-hover:shadow-xl group-hover:shadow-orange-100/50 ${
                    status === "available" ? "border-emerald-100 hover:border-emerald-300" :
                    status === "ready" ? "border-indigo-200 hover:border-indigo-400 animate-pulse bg-indigo-50/10" :
                    status === "waiting" ? "border-amber-200 hover:border-amber-400" :
                    status === "payment_pending" ? "border-blue-200 hover:border-blue-400" :
                    "border-red-100 hover:border-red-300"
                  }`}>
                    <CardContent className="p-6 flex flex-col items-center justify-center text-center">
                      <div className={`w-16 h-16 rounded-2xl flex items-center justify-center mb-4 transition-all group-hover:scale-110 ${config.color}`}>
                        <Icon size={32} strokeWidth={2.5} />
                      </div>
                      
                      <h3 className="text-2xl font-black tracking-tighter text-foreground mb-1">{table.number}</h3>
                      <div className="flex items-center gap-1.5 text-xs font-black text-muted-foreground uppercase tracking-widest">
                        <Users size={12} strokeWidth={3} /> {table.seats} SEATS
                      </div>
                    </CardContent>
                    
                    <CardFooter className="p-4 pt-0">
                      <Badge variant="outline" className={`w-full py-2 flex items-center justify-center gap-2 rounded-xl text-[10px] font-black uppercase tracking-widest border ${config.color}`}>
                        <div className={`w-1.5 h-1.5 rounded-full ${config.color.split(" ")[0].replace("-50", "-500")}`} />
                        {config.label}
                      </Badge>
                    </CardFooter>

                    {order && (
                      <div className="px-6 pb-6 pt-0">
                        <div className="h-[2px] w-full bg-slate-100 mb-4" />
                        <div className="flex justify-between items-center bg-muted/30 p-2.5 rounded-xl">
                          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">Total Bill</span>
                          <span className="text-sm font-black text-foreground">${order.total.toFixed(2)}</span>
                        </div>
                      </div>
                    )}
                  </Card>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </POSLayout>
  );
};
