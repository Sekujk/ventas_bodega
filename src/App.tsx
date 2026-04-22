import React from "react";
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import LoginPage from "@/pages/LoginPage";
import DashboardPage from "@/pages/DashboardPage";
import QuickSalePage from "@/pages/QuickSalePage";
import ClientsPage from "@/pages/ClientsPage";
import ClientDetailPage from "@/pages/ClientDetailPage";
import NewSalePage from "@/pages/NewSalePage";
import PaymentPage from "@/pages/PaymentPage";
import PublicDebtPage from "@/pages/PublicDebtPage";
import { LoadingSpinner } from "@/components/LoadingSpinner";

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) return <LoadingSpinner />;
  if (!user) return <Navigate to="/login" replace />;

  return <>{children}</>;
};

function AppRoutes() {
  const { user } = useAuth();

  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/deuda/:token" element={<PublicDebtPage />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <DashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/ventas-rapidas"
        element={
          <ProtectedRoute>
            <QuickSalePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/clientes"
        element={
          <ProtectedRoute>
            <ClientsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cliente/:id"
        element={
          <ProtectedRoute>
            <ClientDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cliente/:id/nueva-venta"
        element={
          <ProtectedRoute>
            <NewSalePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/cliente/:id/pago"
        element={
          <ProtectedRoute>
            <PaymentPage />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to={user ? "/" : "/login"} replace />} />
    </Routes>
  );
}

function App() {
  return (
    <Router>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </Router>
  );
}

export default App;
