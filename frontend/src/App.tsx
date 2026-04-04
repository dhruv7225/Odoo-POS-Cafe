import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Unauthorized } from "./components/Unauthorized";
import { LoginPage } from "./pages/Login";
import { SignupPage } from "./pages/Signup";
import { Dashboard } from "./pages/admin/Dashboard";
import { MenuManagement } from "./pages/admin/MenuManagement";
import { FloorTableManagement } from "./pages/admin/FloorTableManagement";
import { TableView } from "./pages/pos/TableView";
import { OrderScreen } from "./pages/pos/OrderScreen";
import { ReadyOrders } from "./pages/pos/ReadyOrders";
import { KitchenDisplay } from "./pages/kitchen/KitchenDisplay";
import { POSProvider } from "./context/POSContext";
import { Toaster } from "sonner";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          
          <Route path="/admin" element={<ProtectedRoute allowedRoles={["admin"]} />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="menu" element={<MenuManagement />} />
            <Route path="floors" element={<FloorTableManagement />} />
            <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
          </Route>

          <Route path="/pos" element={<ProtectedRoute allowedRoles={["waiter", "admin"]} />}>
            <Route index element={<POSProvider><TableView /></POSProvider>} />
            <Route path="order/:tableId" element={<POSProvider><OrderScreen /></POSProvider>} />
            <Route path="ready-orders" element={<POSProvider><ReadyOrders /></POSProvider>} />
          </Route>

          <Route path="/kitchen" element={<ProtectedRoute allowedRoles={["kitchen", "admin"]} />}>
             <Route index element={<POSProvider><KitchenDisplay /></POSProvider>} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
      <Toaster richColors position="top-right" />
    </AuthProvider>
  );
}

export default App;
