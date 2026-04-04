import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ProtectedRoute } from "./components/ProtectedRoute";
import { Unauthorized } from "./components/Unauthorized";
import { LoginPage } from "./pages/Login";
import { SignupPage } from "./pages/Signup";
import { Dashboard } from "./pages/admin/Dashboard";
import { MenuManagement } from "./pages/admin/MenuManagement";
import { Toaster } from "sonner";

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route path="/signup" element={<SignupPage />} />
          <Route path="/unauthorized" element={<Unauthorized />} />
          
          <Route path="/admin" element={<ProtectedRoute />}>
            <Route path="dashboard" element={<Dashboard />} />
            <Route path="menu" element={<MenuManagement />} />
            <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
          </Route>

          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
      <Toaster richColors position="top-right" />
    </AuthProvider>
  );
}

export default App;
