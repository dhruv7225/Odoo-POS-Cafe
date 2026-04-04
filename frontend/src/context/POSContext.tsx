import React, { createContext, useContext, useState, useEffect } from "react";
import type { ReactNode } from "react";
import { toast } from "sonner";

export type OrderItem = {
  id: string;
  name: string;
  price: number;
  quantity: number;
};

export type OrderStatus = "placed" | "preparing" | "ready" | "served";
export type TableStatus = "available" | "occupied" | "waiting" | "ready" | "payment_pending";

export type Order = {
  id: string;
  tableId: string;
  items: OrderItem[];
  status: OrderStatus;
  total: number;
  paymentStatus: "pending" | "paid";
  createdAt: number;
};

export type Table = {
  id: string;
  number: string;
  seats: number;
  floorId: string;
};

interface POSContextType {
  tables: Table[];
  orders: Order[];
  getPendingOrders: () => Order[];
  getReadyOrders: () => Order[];
  getTableOrder: (tableId: string) => Order | undefined;
  getTableStatus: (tableId: string) => TableStatus;
  placeOrder: (tableId: string, items: OrderItem[]) => void;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  markAsServed: (orderId: string) => void;
  processPayment: (orderId: string) => void;
}

const POSContext = createContext<POSContextType | undefined>(undefined);

export const POSProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [tables, setTables] = useState<Table[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);

  // Load tables from admin localStorage
  useEffect(() => {
    const savedFloors = localStorage.getItem("poscafe_floors");
    if (savedFloors) {
      try {
        const floors = JSON.parse(savedFloors);
        const allTables = floors.flatMap((f: any) => 
          f.tables.map((t: any) => ({ ...t, floorId: f.id }))
        );
        setTables(allTables);
      } catch (e) {
        console.error("Failed to parse tables in POS", e);
      }
    }

    const savedOrders = localStorage.getItem("poscafe_pos_orders");
    if (savedOrders) {
      try {
        setOrders(JSON.parse(savedOrders));
      } catch (e) {
        console.error("Failed to parse orders in POS", e);
      }
    }
  }, []);

  // Save orders to localStorage
  useEffect(() => {
    if (orders.length > 0) {
      localStorage.setItem("poscafe_pos_orders", JSON.stringify(orders));
    }
  }, [orders]);

  // Kitchen Simulation logic
  useEffect(() => {
    const interval = setInterval(() => {
      setOrders(currentOrders => {
        let changed = false;
        const mapped = currentOrders.map(order => {
          // If placed -> preparing (simulated after 10s)
          if (order.status === "placed" && Date.now() - order.createdAt > 10000) {
            changed = true;
            toast.info(`Table ${getTableNumber(order.tableId)}: Food is being prepared.`);
            return { ...order, status: "preparing" as OrderStatus };
          }
          // If preparing -> ready (simulated after 30s)
          if (order.status === "preparing" && Date.now() - order.createdAt > 30000) {
            changed = true;
            toast.success(`Table ${getTableNumber(order.tableId)}: Order is READY!`, {
              description: "Proceed to pick up from kitchen.",
              duration: 5000,
            });
            return { ...order, status: "ready" as OrderStatus };
          }
          return order;
        });
        return changed ? mapped : currentOrders;
      });
    }, 5000);

    return () => clearInterval(interval);
  }, [tables]);

  const getTableNumber = (tableId: string) => {
    return tables.find(t => t.id === tableId)?.number || "??";
  };

  const getTableOrder = (tableId: string) => {
    return orders.find(o => o.tableId === tableId && o.paymentStatus === "pending");
  };

  const getTableStatus = (tableId: string): TableStatus => {
    const order = getTableOrder(tableId);
    if (!order) return "available";
    if (order.status === "placed" || order.status === "preparing") return "waiting";
    if (order.status === "ready") return "ready";
    if (order.status === "served" && order.paymentStatus === "pending") return "payment_pending";
    return "occupied";
  };

  const placeOrder = (tableId: string, items: OrderItem[]) => {
    const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
    const newOrder: Order = {
      id: `ord-${Date.now()}`,
      tableId,
      items,
      status: "placed",
      total,
      paymentStatus: "pending",
      createdAt: Date.now(),
    };
    setOrders([...orders, newOrder]);
    toast.success("Order sent to kitchen!");
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders(orders.map(o => o.id === orderId ? { ...o, status } : o));
  };

  const markAsServed = (orderId: string) => {
    setOrders(orders.map(o => o.id === orderId ? { ...o, status: "served" as OrderStatus } : o));
    toast.success("Order served to table.");
  };

  const processPayment = (orderId: string) => {
    setOrders(orders.map(o => o.id === orderId ? { ...o, paymentStatus: "paid" as const } : o));
    toast.success("Payment successful. Table is now available.");
  };

  const getReadyOrders = () => orders.filter(o => o.status === "ready");
  const getPendingOrders = () => orders.filter(o => o.paymentStatus === "pending");

  return (
    <POSContext.Provider value={{ 
      tables, 
      orders, 
      getPendingOrders, 
      getReadyOrders, 
      getTableOrder, 
      getTableStatus,
      placeOrder,
      updateOrderStatus,
      markAsServed,
      processPayment
    }}>
      {children}
    </POSContext.Provider>
  );
};

export const usePOS = () => {
  const context = useContext(POSContext);
  if (context === undefined) {
    throw new Error("usePOS must be used within a POSProvider");
  }
  return context;
};
