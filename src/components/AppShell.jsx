import { NavLink, useLocation } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { useWorkspace } from "../context/WorkspaceContext";
import { usePosData } from "../context/PosDataContext";
import { AppIcon } from "../features/ui/AppIcon";
import { getNavigationIconName } from "../features/ui/iconMaps";
import "./shell.css";

const NAV_ITEMS = [
  { section: "Utama" },
  { id: "dashboard", label: "Dashboard", to: "/dashboard", icon: "Dashboard", roles: ["admin", "manager", "cashier"] },
  { id: "kasir", label: "Kasir / POS", to: "/checkout", icon: "Checkout", roles: ["admin", "manager", "cashier"] },
  { section: "Inventori" },
  { id: "katalog", label: "Katalog Produk", to: "/catalog", icon: "Catalog", roles: ["admin", "manager"] },
  { id: "inventori", label: "Manajemen Stok", to: "/inventory", icon: "Inventory", roles: ["admin", "manager"] },
  { section: "Penjualan" },
  { id: "penjualan", label: "Riwayat Transaksi", to: "/sales", icon: "Sales", roles: ["admin", "manager", "cashier"] },
  { id: "laporan", label: "Laporan & Analitik", to: "/reports", icon: "Reports", roles: ["admin", "manager"] },
  { id: "event", label: "Event & Bazar", to: "/events", icon: "Events", roles: ["admin", "manager"] },
  { id: "promosi", label: "Promosi", to: "/promotions", icon: "Promotions", roles: ["admin", "manager"] },
  { section: "Sistem" },
  { id: "pengguna", label: "Pengguna", to: "/users", icon: "Users", roles: ["admin"] },
  { id: "pengaturan", label: "Pengaturan", to: "/settings", icon: "Settings", roles: ["admin"] },
];

const PAGE_TITLES = {
  "/dashboard": "Dashboard",
  "/checkout": "Kasir / Point of Sale",
  "/sales": "Riwayat Transaksi",
  "/catalog": "Katalog Produk",
  "/inventory": "Manajemen Stok",
  "/events": "Event & Bazar",
  "/promotions": "Promosi",
  "/reports": "Laporan & Analitik",
  "/settings": "Pengaturan",
  "/users": "Pengguna",
};

function getUserInitial(user) {
  return (user?.name || user?.username || "U").charAt(0).toUpperCase();
}

function getPageTitle(pathname) {
  for (const [path, title] of Object.entries(PAGE_TITLES)) {
    if (pathname === path || pathname.startsWith(path + "/")) return title;
  }
  return "Lakoo POS";
}

function formatDate() {
  return new Date().toLocaleDateString("id-ID", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function AppShell({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const { workspaces } = usePosData();
  const { activeWorkspaceId } = useWorkspace();
  const isCheckoutRoute = location.pathname.startsWith("/checkout");

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);
  const allowedItems = NAV_ITEMS.filter((item) => item.section || item.roles.includes(user.role));
  const pageTitle = getPageTitle(location.pathname);

  return (
    <div className={`shell${isCheckoutRoute ? " shell-checkout" : ""}`}>
      {/* ── Sidebar ── */}
      <aside className="shell-sidebar">
        <div className="shell-sidebar-top">
          {/* Brand */}
          <div className="shell-brand">
            <div className="shell-brand-name">Lakoo</div>
            <div className="shell-brand-sub">Point of Sale</div>
          </div>

          {/* Session badge */}
          <NavLink to="/workspace/select" className="shell-session">
            <div className="shell-session-label">Sesi Aktif</div>
            <div className="shell-session-name">{activeWorkspace?.name || "Pilih workspace"}</div>
            <div className="shell-session-action">Ganti sesi ↗</div>
          </NavLink>

          {/* Nav */}
          <nav className="shell-nav">
            {allowedItems.map((item, i) =>
              item.section ? (
                <div key={`section-${i}`} className="shell-nav-section">{item.section}</div>
              ) : (
                <NavLink
                  className={({ isActive }) => `shell-nav-item${isActive ? " active" : ""}`}
                  key={item.to}
                  to={item.to}
                  end={item.to !== "/sales"}
                >
                  <span className="shell-nav-icon">
                    <AppIcon name={getNavigationIconName(item.icon)} size={17} strokeWidth={1.8} />
                  </span>
                  <span>{item.label}</span>
                </NavLink>
              )
            )}
          </nav>
        </div>

        {/* User card */}
        <div className="shell-sidebar-bottom">
          <div className="shell-user">
            <div className="shell-user-avatar">{getUserInitial(user)}</div>
            <div className="shell-user-info">
              <span className="shell-user-name">{user?.name || user?.username}</span>
              <span className="shell-user-role">{user?.role}</span>
            </div>
          </div>
        </div>
      </aside>

      {/* ── Main ── */}
      <div className="shell-main-wrap">
        {/* Topbar */}
        {!isCheckoutRoute ? (
          <div className="shell-topbar">
            <div className="shell-topbar-title">{pageTitle}</div>
            {activeWorkspace ? (
              <span className="shell-topbar-badge">{activeWorkspace.name}</span>
            ) : null}
            <div className="shell-topbar-spacer" />
            <div className="shell-topbar-date">{formatDate()}</div>
            <button className="shell-topbar-logout" onClick={logout} type="button">
              Keluar
            </button>
          </div>
        ) : null}

        {/* Content */}
        <div className={`shell-content${isCheckoutRoute ? " shell-content-flush" : ""}`}>
          {children}
        </div>
      </div>
    </div>
  );
}
