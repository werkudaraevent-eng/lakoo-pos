import { NavLink, useLocation } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { getShellRouteMeta, getShellTone } from "../features/shell/shellLayout";
import { AppIcon } from "../features/ui/AppIcon";
import { getNavigationIconName } from "../features/ui/iconMaps";
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

function matchesPath(pathname, target) {
  return pathname === target || pathname.startsWith(`${target}/`);
}

function getNavigationContext(pathname, groups) {
  for (const group of groups) {
    const item = group.items.find((entry) => matchesPath(pathname, entry.to));

    if (item) {
      return {
        groupLabel: group.label,
        itemLabel: item.label,
      };
    }
  }

  return {
    groupLabel: "Workspace",
    itemLabel: "Overview",
  };
}

export function AppShell({ children }) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const isDashboardRoute = location.pathname.startsWith("/dashboard");
  const allowedGroups = navigationGroups
    .map((group) => ({
      ...group,
      items: group.items.filter((item) => item.roles.includes(user.role)),
    }))
    .filter((group) => group.items.length > 0);
  const currentRoute = getShellRouteMeta(location.pathname);
  const shellTone = getShellTone(location.pathname);
  const navigationContext = getNavigationContext(location.pathname, allowedGroups);

  return (
    <div className={`app-shell app-shell-${shellTone} dashboard-shell`}>
      <aside className="sidebar dashboard-sidebar">
        <div className="sidebar-top">
          <div className="brand">
            <div className="brand-logo" aria-hidden="true">
              <AppIcon name="ShoppingBag" size={18} strokeWidth={2} />
            </div>
            <div className="brand-text">
              <span className="brand-subtitle">Harness POS</span>
              <span className="brand-title">Retail OS</span>
            </div>
          </div>

          <nav aria-label="Primary">
            {allowedGroups.map((group) => (
              <section className="nav-section" key={group.label}>
                <h3 className="nav-heading">{group.label}</h3>
                {group.items.map((item) => (
                  <NavLink
                    className={({ isActive }) => `nav-item${isActive ? " active" : ""}`}
                    key={item.to}
                    to={item.to}
                    end={item.to !== "/sales"}
                  >
                    <span className="nav-icon" aria-hidden="true">
                      <AppIcon name={getNavigationIconName(item.label)} size={18} strokeWidth={1.9} />
                    </span>
                    <span className="nav-label">{item.label}</span>
                  </NavLink>
                ))}
              </section>
            ))}
          </nav>
        </div>

        <div className="sidebar-footer">
          <WorkspaceSwitcher variant="banani" />
          <button className="sidebar-logout-link" onClick={logout} type="button">
            Logout
          </button>
        </div>
      </aside>

      <div className="main-content">
        <header className="topbar">
          <div className="breadcrumb">
            <span className="bc-link">{navigationContext.groupLabel}</span>
            <span className="bc-sep">/</span>
            <span className="bc-current">{navigationContext.itemLabel || currentRoute.eyebrow}</span>
          </div>

          <div className="topbar-actions">
            <div className="user-profile">
              <span>Signed in as {user.username}</span>
              <span className="user-badge">{user.role}</span>
            </div>
          </div>
        </header>

        <div className={isDashboardRoute ? "dashboard-page-frame" : "page-shell"}>{children}</div>
      </div>
    </div>
  );
}
