import { NavLink, useLocation } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
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

const routeMeta = [
  {
    match: (pathname) => pathname.startsWith("/checkout"),
    eyebrow: "Sell",
    title: "Checkout workspace",
    description: "Keep the current workspace moving with a fast sales flow.",
  },
  {
    match: (pathname) => pathname.startsWith("/sales"),
    eyebrow: "Sales",
    title: "Transaction history",
    description: "Review receipts, totals, and cashier activity.",
  },
  {
    match: (pathname) => pathname.startsWith("/catalog"),
    eyebrow: "Catalog",
    title: "Product setup",
    description: "Maintain assortments, variants, and base pricing.",
  },
  {
    match: (pathname) => pathname.startsWith("/inventory"),
    eyebrow: "Inventory",
    title: "Stock control",
    description: "Track movement, restocks, and current quantity on hand.",
  },
  {
    match: (pathname) => pathname.startsWith("/promotions"),
    eyebrow: "Promotions",
    title: "Offer management",
    description: "Publish retail offers without breaking the selling flow.",
  },
  {
    match: (pathname) => pathname.startsWith("/reports"),
    eyebrow: "Reports",
    title: "Operational reporting",
    description: "Read workspace performance and stock pressure clearly.",
  },
  {
    match: (pathname) => pathname.startsWith("/settings"),
    eyebrow: "Settings",
    title: "Store configuration",
    description: "Adjust store-level preferences and selling defaults.",
  },
  {
    match: (pathname) => pathname.startsWith("/users"),
    eyebrow: "Users",
    title: "Team access",
    description: "Manage team access and role coverage.",
  },
  {
    match: (pathname) => pathname.startsWith("/dashboard"),
    eyebrow: "Dashboard",
    title: "Retail command view",
    description: "Stay on top of revenue, alerts, and workspace activity.",
  },
];

function getRouteMeta(pathname) {
  return (
    routeMeta.find((item) => item.match(pathname)) ?? {
      eyebrow: "Workspace",
      title: "Harness POS",
      description: "Retail operations in one compact shell.",
    }
  );
}

export function AppShell({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const allowedGroups = navigationGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.roles.includes(user.role)),
    }))
    .filter((group) => group.items.length > 0);
  const currentRoute = getRouteMeta(location.pathname);

  return (
    <div className="app-shell">
      <aside className="sidebar">
        <div className="brand-block brand-block-compact">
          <div className="brand-badge">H</div>
          <div className="brand-copy">
            <p className="eyebrow">Harness POS</p>
            <h1>Retail workspace</h1>
            <p className="muted-text">Tighter control for daily selling, stock, and reporting.</p>
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
                    className={({ isActive }) => `sidebar-link${isActive ? " is-active" : ""}`}
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

        <div className="sidebar-user sidebar-user-card">
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
        <header className="topbar-app">
          <div className="shell-heading">
            <p className="eyebrow">{currentRoute.eyebrow}</p>
            <h2>{currentRoute.title}</h2>
            <p className="shell-subtitle">{currentRoute.description}</p>
          </div>
          <div className="topbar-context">
            <span className="role-pill">{user.role}</span>
            <p className="muted-text">Signed in as {user.username}</p>
          </div>
        </header>

        <div className="page-shell">{children}</div>
      </div>
    </div>
  );
}
