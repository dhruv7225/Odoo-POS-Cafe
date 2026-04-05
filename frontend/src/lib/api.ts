import axios from "axios";

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:8082/api";

const api = axios.create({ baseURL: API_BASE });

// Attach JWT token to every request
api.interceptors.request.use((config) => {
  const raw = localStorage.getItem("auth");
  if (raw) {
    try {
      const { token } = JSON.parse(raw);
      if (token) config.headers.Authorization = `Bearer ${token}`;
    } catch { /* ignore */ }
  }
  return config;
});

// Unwrap ApiResponse<T> → T  (backend wraps everything in { success, message, data })
api.interceptors.response.use(
  (res) => res,
  (err) => {
    const msg = err.response?.data?.message || err.message || "Request failed";
    return Promise.reject(new Error(msg));
  }
);

/** Helper to unwrap { success, data } */
function unwrap<T>(res: { data: { success: boolean; data: T } }): T {
  return res.data.data;
}

// ─── AUTH ─────────────────────────────────────────────
export const authApi = {
  login: (email: string, password: string) =>
    api.post("/auth/login", { email, password }).then(unwrap<{
      userId: number; fullName: string; email: string; token: string; roles: string[];
    }>),
  signup: (data: { fullName: string; email: string; password: string; phone?: string; roleName?: string }) =>
    api.post("/auth/signup", data).then(unwrap),
};

// ─── RESTAURANTS ──────────────────────────────────────
export const restaurantApi = {
  list: () => api.get("/restaurants").then(unwrap<any[]>),
  get: (id: number) => api.get(`/restaurants/${id}`).then(unwrap),
  create: (data: any) => api.post("/restaurants", data).then(unwrap),
  update: (id: number, data: any) => api.put(`/restaurants/${id}`, data).then(unwrap),
  remove: (id: number) => api.delete(`/restaurants/${id}`).then(unwrap),
};

// ─── CATEGORIES ───────────────────────────────────────
export const categoryApi = {
  list: (restaurantId: number) => api.get(`/categories/restaurant/${restaurantId}`).then(unwrap<any[]>),
  create: (data: { restaurantId: number; name: string }) => api.post("/categories", data).then(unwrap),
  update: (id: number, data: { restaurantId: number; name: string }) => api.put(`/categories/${id}`, data).then(unwrap),
  remove: (id: number) => api.delete(`/categories/${id}`).then(unwrap),
};

// ─── UPLOAD (Cloudinary) ──────────────────────────────
export const uploadApi = {
  image: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return api.post("/upload/image", fd, { headers: { "Content-Type": "multipart/form-data" } })
      .then(unwrap<{ url: string }>);
  },
  glb: (file: File) => {
    const fd = new FormData();
    fd.append("file", file);
    return api.post("/upload/glb", fd, { headers: { "Content-Type": "multipart/form-data" } })
      .then(unwrap<{ url: string }>);
  },
};

// ─── PRODUCTS ─────────────────────────────────────────
export const productApi = {
  list: (restaurantId: number) => api.get(`/products/restaurant/${restaurantId}`).then(unwrap<any[]>),
  listByCategory: (categoryId: number) => api.get(`/products/category/${categoryId}`).then(unwrap<any[]>),
  create: (data: any) => api.post("/products", data).then(unwrap),
  update: (id: number, data: any) => api.put(`/products/${id}`, data).then(unwrap),
  remove: (id: number) => api.delete(`/products/${id}`).then(unwrap),
  // Variants
  getVariants: (productId: number) => api.get(`/products/${productId}/variants`).then(unwrap<any[]>),
  addVariant: (productId: number, data: { name: string; priceAdjustment: number }) =>
    api.post(`/products/${productId}/variants`, data).then(unwrap),
  updateVariant: (id: number, data: { name: string; priceAdjustment: number }) =>
    api.put(`/variants/${id}`, data).then(unwrap),
  removeVariant: (id: number) => api.delete(`/variants/${id}`).then(unwrap),
  // Toppings
  getToppings: (productId: number) => api.get(`/products/${productId}/toppings`).then(unwrap<any[]>),
  addTopping: (productId: number, data: { name: string; price: number }) =>
    api.post(`/products/${productId}/toppings`, data).then(unwrap),
  updateTopping: (id: number, data: { name: string; price: number }) =>
    api.put(`/toppings/${id}`, data).then(unwrap),
  removeTopping: (id: number) => api.delete(`/toppings/${id}`).then(unwrap),
};

// ─── FLOORS & TABLES ──────────────────────────────────
export const floorApi = {
  list: (restaurantId: number) => api.get(`/floors/restaurant/${restaurantId}`).then(unwrap<any[]>),
  create: (data: { restaurantId: number; name: string; sortOrder?: number }) =>
    api.post("/floors", data).then(unwrap),
  update: (id: number, data: { restaurantId: number; name: string; sortOrder?: number }) =>
    api.put(`/floors/${id}`, data).then(unwrap),
  remove: (id: number) => api.delete(`/floors/${id}`).then(unwrap),
};

export const tableApi = {
  listByFloor: (floorId: number) => api.get(`/tables/floor/${floorId}`).then(unwrap<any[]>),
  listByRestaurant: (restaurantId: number) => api.get(`/tables/restaurant/${restaurantId}`).then(unwrap<any[]>),
  create: (data: { restaurantId: number; floorId: number; tableNo: string; seats?: number }) =>
    api.post("/tables", data).then(unwrap),
  update: (id: number, data: { restaurantId: number; floorId: number; tableNo: string; seats?: number }) =>
    api.put(`/tables/${id}`, data).then(unwrap),
  toggle: (id: number) => api.patch(`/tables/${id}/toggle`).then(unwrap),
  updateStatus: (id: number, status: string) =>
    api.patch(`/tables/${id}/status?status=${status}`).then(unwrap),
};

// ─── ORDERS ───────────────────────────────────────────
export interface OrderCreatePayload {
  restaurantId: number;
  tableId: number;
  posSessionId?: number;
  customerName?: string;
  customerPhone?: string;
  items: { productId: number; variantId?: number; toppingIds?: number[]; qty: number; notes?: string }[];
}

export const orderApi = {
  create: (data: OrderCreatePayload) => api.post("/orders", data).then(unwrap),
  get: (id: number) => api.get(`/orders/${id}`).then(unwrap),
  listByRestaurant: (restaurantId: number, opts?: { status?: string; from?: string; to?: string }) => {
    const params = new URLSearchParams();
    if (opts?.status) params.set("status", opts.status);
    if (opts?.from) params.set("from", opts.from);
    if (opts?.to) params.set("to", opts.to);
    const qs = params.toString() ? `?${params.toString()}` : "";
    return api.get(`/orders/restaurant/${restaurantId}${qs}`).then(unwrap<any[]>);
  },
  listBySession: (sessionId: number) => api.get(`/orders/session/${sessionId}`).then(unwrap<any[]>),
  listByTable: (tableId: number) => api.get(`/orders/table/${tableId}`).then(unwrap<any[]>),
  confirm: (id: number) => api.patch(`/orders/${id}/confirm`).then(unwrap),
  reject: (id: number) => api.patch(`/orders/${id}/reject`).then(unwrap),
  sendToKitchen: (id: number) => api.patch(`/orders/${id}/send-to-kitchen`).then(unwrap),
  markReady: (id: number) => api.patch(`/orders/${id}/ready`).then(unwrap),
  requestPayment: (id: number) => api.patch(`/orders/${id}/request-payment`).then(unwrap),
  complete: (id: number) => api.patch(`/orders/${id}/complete`).then(unwrap),
  cancel: (id: number) => api.patch(`/orders/${id}/cancel`).then(unwrap),
};

// ─── KITCHEN ──────────────────────────────────────────
export const kitchenApi = {
  getActiveTickets: (restaurantId: number) =>
    api.get(`/kitchen/tickets/active/${restaurantId}`).then(unwrap<any[]>),
  getAllTickets: (restaurantId: number) =>
    api.get(`/kitchen/tickets/all/${restaurantId}`).then(unwrap<any[]>),
  getTicket: (ticketId: number) => api.get(`/kitchen/tickets/${ticketId}`).then(unwrap),
  startPreparing: (ticketId: number) => api.patch(`/kitchen/tickets/${ticketId}/start`).then(unwrap),
  markItemPrepared: (itemId: number) => api.patch(`/kitchen/items/${itemId}/prepared`).then(unwrap),
  completeTicket: (ticketId: number) => api.patch(`/kitchen/tickets/${ticketId}/complete`).then(unwrap),
};

// ─── PAYMENTS ─────────────────────────────────────────
export type PaymentPayload = {
  restaurantId: number;
  orderId: number;
  posSessionId: number;
  paymentMethodId: number;
  amount: number;
  referenceNo?: string;
};

export const paymentApi = {
  collectCash: (data: PaymentPayload) => api.post("/payments/cash", data).then(unwrap),
  createOnline: (data: PaymentPayload) => api.post("/payments/online", data).then(unwrap),
  confirm: (id: number, referenceNo?: string) =>
    api.patch(`/payments/${id}/confirm${referenceNo ? `?referenceNo=${encodeURIComponent(referenceNo)}` : ""}`).then(unwrap),
  fail: (id: number) => api.patch(`/payments/${id}/fail`).then(unwrap),
  getByOrder: (orderId: number) => api.get(`/payments/order/${orderId}`).then(unwrap<any[]>),
  getBySession: (sessionId: number) => api.get(`/payments/session/${sessionId}`).then(unwrap<any[]>),
};

// ─── RAZORPAY ─────────────────────────────────────────
export const razorpayApi = {
  createOrder: (data: { restaurantId: number; orderId?: number; amount: number; paymentType: string }) =>
    api.post("/razorpay/create-order", data).then(unwrap<{
      razorpayOrderId: string; amount: number; currency: string; status: string;
    }>),
  verify: (paymentId: number, data: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }) =>
    api.post(`/razorpay/verify/${paymentId}`, data).then(unwrap),
};

// ─── PAYMENT METHODS ──────────────────────────────────
export const paymentMethodApi = {
  list: (restaurantId: number) => api.get(`/payment-methods/restaurant/${restaurantId}`).then(unwrap<any[]>),
  create: (data: any) => api.post("/payment-methods", data).then(unwrap),
  update: (id: number, data: any) => api.put(`/payment-methods/${id}`, data).then(unwrap),
  toggle: (id: number) => api.patch(`/payment-methods/${id}/toggle`).then(unwrap),
};

// ─── SESSIONS ─────────────────────────────────────────
export const sessionApi = {
  open: (data: { restaurantId: number; openingCash?: number }) =>
    api.post("/sessions/open", data).then(unwrap),
  close: (data: { sessionId: number; closingCash?: number }) =>
    api.post("/sessions/close", data).then(unwrap),
  get: (id: number) => api.get(`/sessions/${id}`).then(unwrap),
  listByRestaurant: (restaurantId: number) =>
    api.get(`/sessions/restaurant/${restaurantId}`).then(unwrap<any[]>),
};

// ─── DASHBOARD ────────────────────────────────────────
export const dashboardApi = {
  restaurant: (restaurantId: number, from?: string, to?: string) => {
    const params = new URLSearchParams();
    if (from) params.set("from", from);
    if (to) params.set("to", to);
    const qs = params.toString() ? `?${params.toString()}` : "";
    return api.get(`/dashboard/restaurant/${restaurantId}${qs}`).then(unwrap);
  },
  session: (sessionId: number) => api.get(`/dashboard/session/${sessionId}`).then(unwrap),
};

// ─── STAFF ────────────────────────────────────────────
export const staffApi = {
  assign: (data: { restaurantId: number; userId: number; roleId: number }) =>
    api.post("/staff", data).then(unwrap),
  remove: (staffId: number) => api.delete(`/staff/${staffId}`).then(unwrap),
  listByRestaurant: (restaurantId: number) => api.get(`/staff/restaurant/${restaurantId}`).then(unwrap<any[]>),
};

export default api;
