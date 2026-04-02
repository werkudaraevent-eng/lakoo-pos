import { Navigate, Route, Routes } from "react-router-dom";

import { ProtectedRoute } from "./ProtectedRoute";
import { LoginPage } from "../pages/LoginPage";
import { DashboardPage } from "../pages/DashboardPage";
import { CheckoutPage } from "../pages/CheckoutPage";
import { CatalogPage } from "../pages/CatalogPage";
import { EventClosingPage } from "../pages/EventClosingPage";
import { EventDetailPage } from "../pages/EventDetailPage";
import { EventsPage } from "../pages/EventsPage";
import { InventoryPage } from "../pages/InventoryPage";
import { PromotionsPage } from "../pages/PromotionsPage";
import { ReportsPage } from "../pages/ReportsPage";
import { ReceiptPage } from "../pages/ReceiptPage";
import { SalesPage } from "../pages/SalesPage";
import { SettingsPage } from "../pages/SettingsPage";
import { UsersPage } from "../pages/UsersPage";
import { WorkspacePickerPage } from "../pages/WorkspacePickerPage";

export function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route element={<ProtectedRoute requireWorkspace={false} renderShell={false} />}>
        <Route path="/workspace/select" element={<WorkspacePickerPage />} />
      </Route>

      <Route element={<ProtectedRoute />}>
        <Route path="/" element={<Navigate to="/dashboard" replace />} />
        <Route path="/dashboard" element={<DashboardPage />} />
        <Route path="/checkout" element={<CheckoutPage />} />
        <Route path="/sales" element={<SalesPage />} />
        <Route path="/sales/:saleId/receipt" element={<ReceiptPage />} />
      </Route>

      <Route element={<ProtectedRoute allow={["admin", "manager"]} />}>
        <Route path="/events" element={<EventsPage />} />
        <Route path="/events/:eventId" element={<EventDetailPage />} />
        <Route path="/events/:eventId/close" element={<EventClosingPage />} />
        <Route path="/catalog" element={<CatalogPage />} />
        <Route path="/inventory" element={<InventoryPage />} />
        <Route path="/promotions" element={<PromotionsPage />} />
        <Route path="/reports" element={<ReportsPage />} />
      </Route>

      <Route element={<ProtectedRoute allow={["admin"]} />}>
        <Route path="/settings" element={<SettingsPage />} />
        <Route path="/users" element={<UsersPage />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
