import { NavLink, useLocation } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { getShellRouteMeta, getShellTone } from "../features/shell/shellLayout";
import { WorkspaceSwitcher } from "../features/workspaces/components/WorkspaceSwitcher";

const navigationGroups = [
  {
    label: "Operate",
    items: [
      {
        label: "Dashboard",
        description: "Summary and alerts",
        to: "/dashboard",
        roles: ["admin", "manager", "cashier"],
      },
      {
        label: "Checkout",
        description: "Sell and print receipts",
        to: "/checkout",
        roles: ["admin", "manager", "cashier"],
      },
      {
        label: "Sales",
        description: "Review transactions",
        to: "/sales",
        roles: ["admin", "manager", "cashier"],
      },
    ],
  },
  {
    label: "Stock",
    items: [
      {
        label: "Events",
        description: "Bazaar workspaces",
        to: "/events",
        roles: ["admin", "manager"],
      },
      {
        label: "Catalog",
        description: "Products and variants",
        to: "/catalog",
        roles: ["admin", "manager"],
      },
      {
        label: "Inventory",
        description: "Adjust and audit stock",
        to: "/inventory",
        roles: ["admin", "manager"],
      },
      {
        label: "Promotions",
        description: "Offers and discount rules",
        to: "/promotions",
        roles: ["admin", "manager"],
      },
    ],
  },
  {
    label: "Admin",
    items: [
      {
        label: "Reports",
        description: "Performance reporting",
        to: "/reports",
        roles: ["admin", "manager"],
      },
      {
        label: "Settings",
        description: "Store preferences",
        to: "/settings",
        roles: ["admin"],
      },
      {
        label: "Users",
        description: "Access and roles",
        to: "/users",
        roles: ["admin"],
      },
    ],
  },
];

export function AppShell({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const allowedGroups = navigationGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.roles.includes(user.role)),
    }))
    .filter((group) => group.items.length > 0);
  const currentRoute = getShellRouteMeta(location.pathname);
  const shellTone = getShellTone(location.pathname);

  return (
    <div className={`app-shell app-shell-${shellTone}`}>
      <aside className="sidebar sidebar-executive-shell">
        <div className="brand-block brand-block-compact brand-block-executive">
          <div className="brand-badge brand-badge-neutral">H</div>
          <div className="brand-copy">
            <p className="eyebrow">Harness POS</p>
            <h1>Retail OS</h1>
          </div>
        </div>

        <WorkspaceSwitcher />

        <nav className="sidebar-nav sidebar-nav-grouped" aria-label="Primary">
          {allowedGroups.map((group) => (
            <section className="sidebar-group" key={group.label}>
              <p className="sidebar-section-title">{group.label}</p>
              <div className="sidebar-group-links">
                {group.items.map((item) => (
                  <NavLink
                    className={({ isActive }) => `sidebar-link sidebar-link-executive${isActive ? " is-active" : ""}`}
                    key={item.to}
                    to={item.to}
                    end={item.to !== "/sales"}
                  >
                    <span className="sidebar-link-label">{item.label}</span>
                    <span className="sidebar-link-support">{item.description}</span>
                  </NavLink>
                ))}
              </div>
            </section>
          ))}
        </nav>

        <div className="sidebar-user sidebar-user-card sidebar-user-executive">
          <div className="sidebar-user-head">
            <div>
              <strong>{user.name}</strong>
              <p className="muted-text">@{user.username}</p>
            </div>
            <span className="role-pill">{user.role}</span>
          </div>
          <button className="ghost-button" onClick={logout} type="button">
            Logout
          </button>
        </div>
      </aside>

      <div className="main-shell">
        <header className="topbar-app topbar-app-executive">
          <div className="shell-heading">
            <p className="eyebrow">{currentRoute.eyebrow}</p>
            <h2>{currentRoute.title}</h2>
            <p className="shell-subtitle">{currentRoute.description}</p>
          </div>
          <div className="topbar-context topbar-context-executive">
            <span className="role-pill">{user.role}</span>
            <p className="muted-text">Signed in as {user.username}</p>
          </div>
        </header>

        <div className="page-shell">{children}</div>
      </div>
    </div>
  );
}
