import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import { toast } from "sonner";
import { useAuth } from "./AuthContext";
import { floorApi, tableApi, orderApi } from "@/lib/api";
import type { OrderCreatePayload } from "@/lib/api";
import { connectWebSocket, subscribe } from "@/lib/websocket";

export type SelectedTopping = { name: string; price: number };

export type OrderItem = {
  id: string;
  cartKey: string;
  name: string;
  price: number;
  quantity: number;
  selectedVariant?: { id?: number; name: string; priceOption: number };
  selectedToppings?: (SelectedTopping & { id?: number })[];
  productId: number;
};

export type OrderStatus = "placed" | "preparing" | "ready" | "served";
export type TableStatus = "available" | "occupied" | "waiting" | "ready" | "payment_pending" | "inactive";

export type BackendOrder = {
  id: number;
  orderNo: string;
  restaurantId: number;
  tableId: number | null;
  tableNo: string | null;
  floorName: string | null;
  posSessionId: number | null;
  sourceType: string;
  status: string;           // DRAFT, CONFIRMED, IN_KITCHEN, READY, COMPLETED, CANCELLED
  confirmationStatus: string;
  customerName: string | null;
  customerPhone: string | null;
  waiterName: string | null;
  cashierName: string | null;
  subtotal: number;
  taxAmount: number;
  totalAmount: number;
  paidAmount: number;
  remainingAmount: number;
  paymentStatus: string;    // UNPAID, PARTIAL, PAID
  createdAt: string;
  items: BackendOrderItem[];
};

export type BackendOrderItem = {
  id: number;
  productId: number;
  productName: string;
  variantName: string | null;
  selectedToppings: string | null;
  qty: number;
  unitPrice: number;
  toppingsPrice: number;
  taxAmount: number;
  lineTotal: number;
  itemStatus: string;
  notes: string | null;
};

export type Order = {
  id: string;
  backendId: number;
  restaurantId: number;
  orderNo: string;
  tableId: string;
  items: OrderItem[];
  status: OrderStatus;
  backendStatus: string;
  confirmationStatus: string;
  total: number;
  paymentStatus: "pending" | "paid";
  createdAt: number;
  tableNo?: string;
  floorName?: string;
};

export type Table = {
  id: string;
  backendId: number;
  number: string;
  seats: number;
  floorId: string;
  backendStatus: string;
  active: boolean;
};

export type Floor = {
  id: string;
  backendId: number;
  name: string;
  tables: Table[];
};

interface POSContextType {
  tables: Table[];
  floors: Floor[];
  orders: Order[];
  loading: boolean;
  refreshOrders: () => Promise<void>;
  refreshTables: () => Promise<void>;
  getPendingOrders: () => Order[];
  getReadyOrders: () => Order[];
  getTableOrder: (tableId: string) => Order | undefined;
  getTableStatus: (tableId: string) => TableStatus;
  placeOrder: (tableId: string, items: OrderItem[]) => Promise<void>;
  confirmOrder: (orderId: string) => Promise<void>;
  sendToKitchen: (orderId: string) => Promise<void>;
  updateOrderStatus: (orderId: string, status: OrderStatus) => void;
  markAsServed: (orderId: string) => Promise<void>;
  processPayment: (orderId: string) => void;
}

const POSContext = createContext<POSContextType | undefined>(undefined);

/** Map backend order status to frontend OrderStatus */
function mapStatus(backendStatus: string): OrderStatus {
  switch (backendStatus) {
    case "DRAFT": return "placed";
    case "CONFIRMED": return "placed";
    case "IN_KITCHEN": return "preparing";
    case "READY": return "ready";
    case "COMPLETED": return "served";
    default: return "placed";
  }
}

function mapOrder(o: BackendOrder): Order {
  return {
    id: `ord-${o.id}`,
    backendId: o.id,
    restaurantId: o.restaurantId,
    orderNo: o.orderNo,
    tableId: `table-${o.tableId}`,
    tableNo: o.tableNo ?? undefined,
    floorName: o.floorName ?? undefined,
    items: o.items.map((item) => ({
      id: `item-${item.id}`,
      cartKey: `${item.productId}-${item.variantName || "base"}-${item.selectedToppings || "none"}`,
      name: item.productName,
      price: item.lineTotal / item.qty,
      quantity: item.qty,
      productId: item.productId,
      selectedVariant: item.variantName ? { name: item.variantName, priceOption: 0 } : undefined,
      selectedToppings: item.selectedToppings
        ? item.selectedToppings.split(", ").map((n) => ({ name: n, price: 0 }))
        : undefined,
    })),
    status: mapStatus(o.status),
    backendStatus: o.status,
    confirmationStatus: o.confirmationStatus,
    total: o.totalAmount,
    paymentStatus: o.paymentStatus === "PAID" ? "paid" : "pending",
    createdAt: new Date(o.createdAt).getTime(),
  };
}

export const POSProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const { restaurantId } = useAuth();
  const [tables, setTables] = useState<Table[]>([]);
  const [floors, setFloors] = useState<Floor[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const refreshTables = useCallback(async () => {
    if (!restaurantId) return;
    try {
      const floorData = await floorApi.list(restaurantId);
      const allFloors: Floor[] = [];
      const allTables: Table[] = [];

      for (const f of floorData) {
        const tblData = await tableApi.listByFloor(f.id);
        const mappedTables: Table[] = tblData.map((t: any) => ({
          id: `table-${t.id}`,
          backendId: t.id,
          number: t.tableNo,
          seats: t.seats,
          floorId: `floor-${f.id}`,
          backendStatus: t.status,
          active: t.active,
        }));
        allFloors.push({
          id: `floor-${f.id}`,
          backendId: f.id,
          name: f.name,
          tables: mappedTables,
        });
        allTables.push(...mappedTables);
      }
      setFloors(allFloors);
      setTables(allTables);
    } catch (err) {
      console.error("Failed to load tables:", err);
    }
  }, [restaurantId]);

  const refreshOrders = useCallback(async () => {
    if (!restaurantId) return;
    try {
      const data = await orderApi.listByRestaurant(restaurantId);
      setOrders(data.filter((o: any) => o.status !== "CANCELLED").map(mapOrder));
    } catch (err) {
      console.error("Failed to load orders:", err);
    }
  }, [restaurantId]);

  // Initial load
  useEffect(() => {
    if (!restaurantId) { setLoading(false); return; }
    setLoading(true);
    Promise.all([refreshTables(), refreshOrders()]).finally(() => setLoading(false));
  }, [restaurantId, refreshTables, refreshOrders]);

  // Poll orders every 10 seconds as fallback
  useEffect(() => {
    if (!restaurantId) return;
    const interval = setInterval(refreshOrders, 10000);
    return () => clearInterval(interval);
  }, [restaurantId, refreshOrders]);

  // WebSocket subscriptions
  useEffect(() => {
    if (!restaurantId) return;
    connectWebSocket().catch(() => console.warn("WebSocket connection failed, using polling"));

    const unsubs = [
      subscribe(`/topic/orders/${restaurantId}/new-order`, (order: any) => {
        toast.info(`New order from Table ${order.tableNo || "?"}`);
        refreshOrders();
      }),
      subscribe(`/topic/kitchen/${restaurantId}/order-ready`, (data: any) => {
        toast.success(`Order ${data.orderNo} is READY!`, { description: "Pick up from kitchen.", duration: 5000 });
        refreshOrders();
      }),
      subscribe(`/topic/kitchen/${restaurantId}/ticket-update`, () => {
        refreshOrders();
      }),
      subscribe(`/topic/kitchen/${restaurantId}/new-ticket`, () => {
        refreshOrders();
      }),
    ];

    return () => {
      unsubs.forEach((unsub) => unsub());
    };
  }, [restaurantId, refreshOrders]);

  const getTableOrder = (tableId: string) => {
    return orders.find((o) => o.tableId === tableId && o.paymentStatus === "pending" && o.backendStatus !== "CANCELLED");
  };

  const getTableStatus = (tableId: string): TableStatus => {
    const table = tables.find((t) => t.id === tableId);
    if (table && !table.active) return "inactive";

    const order = getTableOrder(tableId);
    if (!order) return "available";
    if (order.backendStatus === "DRAFT") return "waiting";
    if (order.backendStatus === "CONFIRMED") return "waiting";
    if (order.backendStatus === "IN_KITCHEN") return "waiting";
    if (order.backendStatus === "READY") return "ready";
    if (order.backendStatus === "COMPLETED" && order.paymentStatus === "pending") return "payment_pending";
    return "occupied";
  };

  const placeOrder = async (tableId: string, items: OrderItem[]) => {
    if (!restaurantId) throw new Error("No restaurant selected");
    const table = tables.find((t) => t.id === tableId);
    if (!table) throw new Error("Table not found");

    const payload: OrderCreatePayload = {
      restaurantId,
      tableId: table.backendId,
      items: items.map((item) => ({
        productId: item.productId,
        variantId: item.selectedVariant?.id,
        toppingIds: item.selectedToppings?.filter((t) => t.id).map((t) => t.id!) as number[] | undefined,
        qty: item.quantity,
        notes: undefined,
      })),
    };

    // Step 1: Create order (DRAFT/PENDING)
    const created: any = await orderApi.create(payload);
    const newOrderId = created.id;

    // Step 2: Waiter confirms the order
    await orderApi.confirm(newOrderId);

    // Step 3: Send to kitchen (creates kitchen ticket + WebSocket notification to chef)
    await orderApi.sendToKitchen(newOrderId);

    toast.success("Order sent to kitchen!");
    await refreshOrders();
  };

  const confirmOrder = async (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    await orderApi.confirm(order.backendId);
    toast.success("Order confirmed");
    await refreshOrders();
  };

  const sendToKitchen = async (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    await orderApi.sendToKitchen(order.backendId);
    toast.success("Order sent to kitchen!");
    await refreshOrders();
  };

  const updateOrderStatus = (orderId: string, status: OrderStatus) => {
    setOrders((prev) => prev.map((o) => (o.id === orderId ? { ...o, status } : o)));
  };

  const markAsServed = async (orderId: string) => {
    const order = orders.find((o) => o.id === orderId);
    if (!order) return;
    try {
      await orderApi.requestPayment(order.backendId);
      toast.success("Payment requested — cashier notified. Table released.");
      await refreshOrders();
    } catch (err: any) {
      toast.error(err.message || "Failed to request payment");
    }
  };

  const processPayment = (_orderId: string) => {
    // Payment happens through cashier dashboard, not here
    toast.info("Please proceed to cashier for payment.");
  };

  const getReadyOrders = () => orders.filter((o) => o.backendStatus === "READY");
  const getPendingOrders = () => orders.filter((o) => o.paymentStatus === "pending");

  return (
    <POSContext.Provider
      value={{
        tables,
        floors,
        orders,
        loading,
        refreshOrders,
        refreshTables,
        getPendingOrders,
        getReadyOrders,
        getTableOrder,
        getTableStatus,
        placeOrder,
        confirmOrder,
        sendToKitchen,
        updateOrderStatus,
        markAsServed,
        processPayment,
      }}
    >
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
