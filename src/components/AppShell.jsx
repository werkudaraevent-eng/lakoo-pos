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
  return "Lakoo. POS";
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
  const { workspaces, settings } = usePosData();
  const { activeWorkspaceId } = useWorkspace();
  const isCheckoutRoute = location.pathname.startsWith("/checkout");
  const isImpersonating = localStorage.getItem("pos-impersonating") === "true";

  const activeWorkspace = workspaces.find((w) => w.id === activeWorkspaceId);
  const canCustomBrand = user?.planLimits?.customBranding === true;
  const brandName = canCustomBrand && settings?.storeName ? settings.storeName : "Lakoo.";

  // Expiry warning banner calculation
  const expiryDate = user?.tenant?.plan === "trial"
    ? user?.tenant?.trialEndsAt
    : user?.tenant?.subscriptionEndsAt;
  const daysLeft = expiryDate
    ? Math.ceil((new Date(expiryDate) - new Date()) / (1000 * 60 * 60 * 24))
    : null;
  const showExpiryWarning = daysLeft !== null && daysLeft <= 7 && daysLeft > 0;
  // Filter nav items: only show section headers that have at least one visible child
  const allowedItems = NAV_ITEMS.filter((item, index) => {
    if (!item.section) return item.roles.includes(user.role);
    // Section header: check if any following items (until next section) are visible
    for (let j = index + 1; j < NAV_ITEMS.length; j++) {
      if (NAV_ITEMS[j].section) break;
      if (NAV_ITEMS[j].roles.includes(user.role)) return true;
    }
    return false;
  });
  const pageTitle = getPageTitle(location.pathname);

  const bannerOffset = (isImpersonating ? 30 : 0) + (showExpiryWarning ? 30 : 0);

  return (
    <div
      className={`shell${isCheckoutRoute ? " shell-checkout" : ""}${isImpersonating ? " shell-impersonating" : ""}`}
      style={bannerOffset ? { height: `calc(100vh - ${bannerOffset}px)`, marginTop: bannerOffset } : undefined}
    >
      {/* ── Impersonation Banner ── */}
      {isImpersonating && (
        <div
          style={{
            background: "var(--accent, #6c5ce7)",
            color: "#fff",
            padding: "6px 16px",
            fontSize: 12,
            fontWeight: 600,
            textAlign: "center",
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            zIndex: 1000,
          }}
        >
          ⚡ Sesi impersonasi aktif — Anda masuk sebagai admin tenant.
          <button
            onClick={() => {
              localStorage.removeItem("pos-token");
              localStorage.removeItem("pos-user");
              localStorage.removeItem("pos-impersonating");
              window.close();
            }}
            style={{
              marginLeft: 12,
              background: "rgba(255,255,255,0.2)",
              border: "none",
              color: "#fff",
              padding: "2px 10px",
              borderRadius: 4,
              cursor: "pointer",
              fontSize: 11,
              fontFamily: "inherit",
            }}
          >
            Tutup Sesi
          </button>
        </div>
      )}

      {/* ── Expiry Warning Banner ── */}
      {showExpiryWarning && (
        <div style={{
          background: "var(--accent)",
          color: "#fff",
          padding: "6px 16px",
          fontSize: 12,
          fontWeight: 600,
          textAlign: "center",
          position: "fixed",
          top: isImpersonating ? 30 : 0,
          left: 0,
          right: 0,
          zIndex: 999,
        }}>
          ⏰ {user?.tenant?.plan === "trial" ? "Masa trial" : "Langganan"} Anda akan berakhir dalam {daysLeft} hari.
          {user?.role === "admin" && " Hubungi tim Lakoo untuk perpanjangan."}
        </div>
      )}

      {/* ── Sidebar ── */}
      <aside className="shell-sidebar">
        <div className="shell-sidebar-top">
          {/* Brand */}
          <div className="shell-brand">
            <div className="shell-brand-name">{brandName}</div>
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
