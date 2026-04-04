// src/lib/mockData.ts

export const kpiMetrics = {
  totalOrders: { value: 1248, change: "+12.5%" },
  totalCustomers: { value: 384, change: "+8.2%" },
  totalRevenue: { value: "$42,500",change: "+15.3%" },
};

export const revenueData = [
  { name: "Mar", income: 10000, expense: 5000 },
  { name: "Apr", income: 12000, expense: 6000 },
  { name: "May", income: 9000, expense: 4500 },
  { name: "Jun", income: 15000, expense: 8000 },
  { name: "Jul", income: 16580, expense: 9000 },
  { name: "Aug", income: 13000, expense: 7000 },
  { name: "Sep", income: 18000, expense: 10000 },
  { name: "Oct", income: 21000, expense: 12000 },
];

export const weeklyOrdersData = [
  { name: "Mon", orders: 120 },
  { name: "Tue", orders: 145 },
  { name: "Wed", orders: 130 },
  { name: "Thu", orders: 165 },
  { name: "Fri", orders: 205 },
  { name: "Sat", orders: 280 },
  { name: "Sun", orders: 203 },
];

export const topCategoriesData = [
  { name: "Seafood", value: 30 },
  { name: "Beverages", value: 25 },
  { name: "Dessert", value: 25 },
  { name: "Pasta", value: 20 },
];

export const orderTypesData = [
  { name: "Dine-In", percentage: 45, value: 900, icon: "utensils" },
  { name: "Takeaway", percentage: 30, value: 600, icon: "package" },
  { name: "Online", percentage: 25, value: 500, icon: "smartphone" },
];

export const trendingMenu = [
  { id: 1, name: "Truffle Burger", price: "$18.50", rating: 4.8, image: "https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=300&h=300&fit=crop" },
  { id: 2, name: "Margherita Pizza", price: "$16.00", rating: 4.6, image: "https://images.unsplash.com/photo-1604068549290-dea0e4a30536?w=300&h=300&fit=crop" },
  { id: 3, name: "Avocado Toast", price: "$12.00", rating: 4.9, image: "https://images.unsplash.com/photo-1541519227354-08fa5d50c44d?w=300&h=300&fit=crop" },
  { id: 4, name: "Matcha Latte", price: "$5.50", rating: 4.7, image: "https://images.unsplash.com/photo-1536514072410-5019a3c69182?w=300&h=300&fit=crop" },
];

export const recentOrders = [
  { id: "ORD-001", item: "Truffle Burger", quantity: 2, amount: "$37.00", customer: "Alice Smith", status: "Completed" },
  { id: "ORD-002", item: "Margherita Pizza", quantity: 1, amount: "$16.00", customer: "Bob Johnson", status: "Pending" },
  { id: "ORD-003", item: "Avocado Toast", quantity: 3, amount: "$36.00", customer: "Carol Williams", status: "Completed" },
  { id: "ORD-004", item: "Matcha Latte", quantity: 1, amount: "$5.50", customer: "David Brown", status: "Cancelled" },
  { id: "ORD-005", item: "Steak Frites", quantity: 2, amount: "$54.00", customer: "Eve Davis", status: "Completed" },
  { id: "ORD-006", item: "Iced Caramel Macchiato", quantity: 1, amount: "$6.50", customer: "Frank Miller", status: "Pending" },
  { id: "ORD-007", item: "Caesar Salad", quantity: 1, amount: "$14.00", customer: "Grace Wilson", status: "Completed" },
  { id: "ORD-008", item: "Spicy Tuna Roll", quantity: 3, amount: "$45.00", customer: "Harry Moore", status: "Completed" },
  { id: "ORD-009", item: "Vegan Buddha Bowl", quantity: 2, amount: "$32.00", customer: "Isabella Taylor", status: "Pending" },
  { id: "ORD-010", item: "Grilled Salmon", quantity: 1, amount: "$24.00", customer: "Jack Anderson", status: "Cancelled" },
];

export const recentActivity = [
  { id: 1, action: "Order #ORD-001 completed", time: "2 minutes ago" },
  { id: 2, action: "New customer Bob Johnson registered", time: "15 minutes ago" },
  { id: 3, action: "Order #ORD-002 placed online", time: "28 minutes ago" },
  { id: 4, action: "Menu item 'Matcha Latte' updated", time: "1 hour ago" },
  { id: 5, action: "Order #ORD-004 cancelled by admin", time: "2 hours ago" },
];
