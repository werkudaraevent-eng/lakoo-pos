import { lazy, Suspense } from "react";
import { Navigate, Route, Routes, useLocation } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { LoadingScreen } from "../components/LoadingScreen";
import { ProtectedRoute } from "./ProtectedRoute";

// Eager-loaded pages — needed for the most common workflows (login, dashboard, kasir)
import { LoginPage } from "../pages/LoginPage";
import { DashboardPage } from "../pages/DashboardPage";
import { CheckoutPage } from "../pages/CheckoutPage";
import { CatalogPage } from "../pages/CatalogPage";
import { SalesPage } from "../pages/SalesPage";
import { WorkspacePickerPage } from "../pages/WorkspacePickerPage";
import { AccountBlockedPage } from "../pages/AccountBlockedPage";

// Lazy-loaded pages — less common, reduces initial bundle
const RegisterPage = lazy(() => import("../pages/RegisterPage").then(m => ({ default: m.RegisterPage })));
const CatalogManagePage = lazy(() => import("../pages/CatalogManagePage").then(m => ({ default: m.CatalogManagePage })));
const EventClosingPage = lazy(() => import("../pages/EventClosingPage").then(m => ({ default: m.EventClosingPage })));
const EventCreatePage = lazy(() => import("../pages/EventCreatePage").then(m => ({ default: m.EventCreatePage })));
const EventDetailPage = lazy(() => import("../pages/EventDetailPage").then(m => ({ default: m.EventDetailPage })));
const EventsPage = lazy(() => import("../pages/EventsPage").then(m => ({ default: m.EventsPage })));
const InventoryPage = lazy(() => import("../pages/InventoryPage").then(m => ({ default: m.InventoryPage })));
const InventoryReceivePage = lazy(() => import("../pages/InventoryReceivePage").then(m => ({ default: m.InventoryReceivePage })));
const PromotionCreatePage = lazy(() => import("../pages/PromotionCreatePage").then(m => ({ default: m.PromotionCreatePage })));
const PromotionsPage = lazy(() => import("../pages/PromotionsPage").then(m => ({ default: m.PromotionsPage })));
const ReportsPage = lazy(() => import("../pages/ReportsPage").then(m => ({ default: m.ReportsPage })));
const ReceiptPage = lazy(() => import("../pages/ReceiptPage").then(m => ({ default: m.ReceiptPage })));
const SettingsPage = lazy(() => import("../pages/SettingsPage").then(m => ({ default: m.SettingsPage })));
const UsersPage = lazy(() => import("../pages/UsersPage").then(m => ({ default: m.UsersPage })));
const DataManagementPage = lazy(() => import("../pages/DataManagementPage").then(m => ({ default: m.DataManagementPage })));
const ChangelogPage = lazy(() => import("../pages/ChangelogPage").then(m => ({ default: m.ChangelogPage })));

// Platform admin — completely separate, lazy load all
const PlatformLoginPage = lazy(() => import("../pages/platform/PlatformLoginPage").then(m => ({ default: m.PlatformLoginPage })));
const PlatformDashboardPage = lazy(() => import("../pages/platform/PlatformDashboardPage").then(m => ({ default: m.PlatformDashboardPage })));
const PlatformTenantsPage = lazy(() => import("../pages/platform/PlatformTenantsPage").then(m => ({ default: m.PlatformTenantsPage })));
const PlatformTenantDetailPage = lazy(() => import("../pages/platform/PlatformTenantDetailPage").then(m => ({ default: m.PlatformTenantDetailPage })));
const PlatformConfigPage = lazy(() => import("../pages/platform/PlatformConfigPage").then(m => ({ default: m.PlatformConfigPage })));

export function App() {
  const { authLoading, user } = useAuth();
  const location = useLocation();

  // Only show loading screen if there's NO cached user at all (true cold start)
  // If user exists in localStorage, render immediately — auth/me refreshes in background
  const isPlatformRoute = location.pathname.startsWith("/platform");
  const isPublicRoute = ["/login", "/register", "/account-blocked"].includes(location.pathname);
  if (authLoading && !user && !isPlatformRoute && !isPublicRoute) {
    return <LoadingScreen message="Memulihkan sesi..." />;
  }

  return (
    <Suspense fallback={<LoadingScreen message="Memuat halaman..." />}>
      <Routes>
        {/* Platform Admin Routes */}
        <Route path="/platform/login" element={<PlatformLoginPage />} />
        <Route path="/platform" element={<PlatformDashboardPage />} />
        <Route path="/platform/tenants" element={<PlatformTenantsPage />} />
        <Route path="/platform/tenants/:tenantId" element={<PlatformTenantDetailPage />} />
        <Route path="/platform/config" element={<PlatformConfigPage />} />

        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/account-blocked" element={<AccountBlockedPage />} />
        <Route element={<ProtectedRoute requireWorkspace={false} renderShell={false} />}>
          <Route path="/workspace/select" element={<WorkspacePickerPage />} />
        </Route>

        <Route element={<ProtectedRoute />}>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/checkout" element={<CheckoutPage />} />
          <Route path="/sales" element={<SalesPage />} />
          <Route path="/sales/:saleId/receipt" element={<ReceiptPage />} />
          <Route path="/changelog" element={<ChangelogPage />} />
        </Route>

        <Route element={<ProtectedRoute allow={["admin", "manager"]} />}>
          <Route path="/events" element={<EventsPage />} />
          <Route path="/events/new" element={<EventCreatePage />} />
          <Route path="/events/:eventId" element={<EventDetailPage />} />
          <Route path="/events/:eventId/close" element={<EventClosingPage />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/catalog/new" element={<CatalogManagePage />} />
          <Route path="/catalog/:productId" element={<CatalogManagePage />} />
          <Route path="/inventory" element={<InventoryPage />} />
          <Route path="/inventory/receive" element={<InventoryReceivePage />} />
          <Route path="/promotions" element={<PromotionsPage />} />
          <Route path="/promotions/new" element={<PromotionCreatePage />} />
          <Route path="/reports" element={<ReportsPage />} />
        </Route>

        <Route element={<ProtectedRoute allow={["admin"]} />}>
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/data" element={<DataManagementPage />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}
