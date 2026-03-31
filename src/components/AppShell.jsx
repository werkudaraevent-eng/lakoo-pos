import { NavLink } from "react-router-dom";

import { useAuth } from "../context/AuthContext";

const navigation = [
  { label: "Dashboard", to: "/dashboard", roles: ["admin", "manager", "cashier"] },
  { label: "Checkout", to: "/checkout", roles: ["admin", "manager", "cashier"] },
  { label: "Sales", to: "/sales", roles: ["admin", "manager", "cashier"] },
  { label: "Catalog", to: "/catalog", roles: ["admin", "manager"] },
  { label: "Inventory", to: "/inventory", roles: ["admin", "manager"] },
  { label: "Promotions", to: "/promotions", roles: ["admin", "manager"] },
  { label: "Reports", to: "/reports", roles: ["admin", "manager"] },
  { label: "Settings", to: "/settings", roles: ["admin"] },
  { label: "Users", to: "/users", roles: ["admin"] },
];

export function AppShell({ children }) {
  const { user, logout } = useAuth();
  const allowedNav = navigation.filter((item) => item.roles.includes(user.role));

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block">
          <p className="eyebrow">POS Platform</p>
          <h1>Harness POS</h1>
          <p className="muted-text">Single-store fashion retail control center.</p>
        </div>

        <nav className="sidebar-nav">
          {allowedNav.map((item) => (
            <NavLink
              className={({ isActive }) => `sidebar-link${isActive ? " is-active" : ""}`}
              key={item.to}
              to={item.to}
              end
            >
              {item.label}
            </NavLink>
          ))}
        </nav>

        <div className="sidebar-user">
          <span className="role-pill">{user.role}</span>
          <strong>{user.name}</strong>
          <span className="muted-text">@{user.username}</span>
          <button className="ghost-button" onClick={logout} type="button">
            Logout
          </button>
        </div>
      </aside>

      <div className="main-shell">
        <header className="topbar-app">
          <div>
            <p className="eyebrow">Live Workspace</p>
            <h2>Always-online POS MVP</h2>
          </div>
          <div className="topbar-badges">
            <span className="badge-soft">JWT Auth</span>
            <span className="badge-soft">Role Based</span>
            <span className="badge-soft">Inventory Audited</span>
          </div>
        </header>

        <div className="page-shell">{children}</div>
      </div>
    </div>
  );
}
