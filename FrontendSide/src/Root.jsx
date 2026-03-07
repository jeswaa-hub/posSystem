import { createBrowserRouter, RouterProvider, Navigate } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { NotificationProvider } from "./contexts/NotificationContext";
import { SettingsProvider } from "./contexts/SettingsContext";
import Layout from "./components/Layout";
import ProtectedRoute from "./components/ProtectedRoute";
import Home from "./pages/Home";
import Login from "./pages/Login";
import Settings from "./pages/Settings";
import POS from "./pages/POS";
import Products from "./pages/Products";
import AddProduct from "./pages/AddProduct";
import Inventory from "./pages/Inventory";
import SalesReport from "./pages/SalesReport";
import InventoryReport from "./pages/InventoryReport";
import CashierReport from "./pages/CashierReport";
import ProfitLossReport from "./pages/ProfitLossReport";
import Users from "./pages/Users";
import Transactions from "./pages/Transactions";
import { SocketProvider } from "./contexts/SocketContext";

const router = createBrowserRouter([
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/",
    element: (
      <ProtectedRoute>
        <Layout />
      </ProtectedRoute>
    ),
    children: [
      { index: true, element: <Home /> },
      { path: "pos", element: <POS /> },
      { path: "transactions", element: <Transactions /> },
      { 
        path: "products", 
        children: [
          { path: "all", element: <Products /> },
          { path: "add", element: <AddProduct /> },
        ]
      },
      { path: "inventory", element: <Inventory /> },
      { path: "users", element: <Users /> },
      { 
        path: "reports", 
        children: [
          { path: "sales", element: <SalesReport /> },
          { path: "inventory", element: <InventoryReport /> },
          { path: "cashiers", element: <CashierReport /> },
          { path: "profit-loss", element: <ProfitLossReport /> },
        ]
      },
      { path: "settings", element: <Settings /> },
    ],
  },
  {
    path: "*",
    element: <Navigate to="/" replace />,
  }
]);

export default function Root() {
  return (
    <SocketProvider>
      <NotificationProvider>
        <SettingsProvider>
          <AuthProvider>
            <RouterProvider router={router} />
          </AuthProvider>
        </SettingsProvider>
      </NotificationProvider>
    </SocketProvider>
  );
}