import { NavLink, useLocation } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import "./shell.css";
import { AppIcon } from "../features/ui/AppIcon";
import { getNavigationIconName } from "../features/ui/iconMaps";
import { WorkspaceSwitcher } from "../features/workspaces/components/WorkspaceSwitcher";

const navigationGroups = [
  {
    label: "Menu Utama",
    items: [
      { label: "Dashboard", to: "/dashboard", roles: ["admin", "manager", "cashier"] },
      { label: "Kasir", to: "/checkout", roles: ["admin", "manager", "cashier"] },
      { label: "Penjualan", to: "/sales", roles: ["admin", "manager", "cashier"] },
    ],
  },
  {
    label: "Kelola",
    items: [
      { label: "Event", to: "/events", roles: ["admin", "manager"] },
      { label: "Katalog", to: "/catalog", roles: ["admin", "manager"] },
      { label: "Inventori", to: "/inventory", roles: ["admin", "manager"] },
      { label: "Promosi", to: "/promotions", roles: ["admin", "manager"] },
    ],
  },
  {
    label: "Pengaturan",
    items: [
      { label: "Laporan", to: "/reports", roles: ["admin", "manager"] },
      { label: "Pengaturan", to: "/settings", roles: ["admin"] },
      { label: "Pengguna", to: "/users", roles: ["admin"] },
    ],
  },
];

function getUserInitial(user) {
  const source = user?.name || user?.username || "U";
  return source.charAt(0).toUpperCase();
}

export function AppShell({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const isCheckoutRoute = location.pathname.startsWith("/checkout");

  const allowedGroups = navigationGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.roles.includes(user.role)),
    }))
    .filter((group) => group.items.length > 0);

  return (
    <div className={`shell${isCheckoutRoute ? " shell-checkout" : ""}`}>
      {/* Sidebar */}
      <aside className="shell-sidebar">
        <div className="shell-sidebar-top">
          {/* Brand */}
          <div className="shell-brand">
            <div className="shell-brand-logo">L</div>
            <div className="shell-brand-text">
              <span className="shell-brand-name">Lakoo</span>
              <span className="shell-brand-sub">Point of Sale</span>
            </div>
          </div>

          {/* Navigation */}
          <nav className="shell-nav">
            {allowedGroups.map((group) => (
              <div className="shell-nav-group" key={group.label}>
                <span className="shell-nav-label">{group.label}</span>
                <div className="shell-nav-items">
                  {group.items.map((item) => (
                    <NavLink
                      className={({ isActive }) => `shell-nav-item${isActive ? " active" : ""}`}
                      key={item.to}
                      to={item.to}
                      end={item.to !== "/sales"}
                    >
                      <span className="shell-nav-icon">
                        <AppIcon name={getNavigationIconName(item.label === "Kasir" ? "Checkout" : item.label === "Penjualan" ? "Sales" : item.label === "Katalog" ? "Catalog" : item.label === "Inventori" ? "Inventory" : item.label === "Promosi" ? "Promotions" : item.label === "Laporan" ? "Reports" : item.label === "Pengaturan" ? "Settings" : item.label === "Pengguna" ? "Users" : item.label === "Event" ? "Events" : item.label)} size={18} strokeWidth={1.8} />
                      </span>
                      <span className="shell-nav-text">{item.label}</span>
                    </NavLink>
                  ))}
                </div>
              </div>
            ))}
          </nav>
        </div>

        {/* Sidebar footer */}
        <div className="shell-sidebar-bottom">
          <WorkspaceSwitcher variant="banani" />

          <div className="shell-user">
            <div className="shell-user-avatar">{getUserInitial(user)}</div>
            <div className="shell-user-info">
              <span className="shell-user-name">{user?.name || user?.username}</span>
              <span className="shell-user-role">{user?.role}</span>
            </div>
            <button className="shell-user-logout" onClick={logout} type="button" title="Keluar">
              <AppIcon name="LogOut" size={16} strokeWidth={1.8} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main className={`shell-main${isCheckoutRoute ? " shell-main-flush" : ""}`}>
        {children}
      </main>
    </div>
  );
}
