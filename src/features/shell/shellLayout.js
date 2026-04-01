const ROUTE_META = [
  {
    match: (pathname) => pathname.startsWith("/checkout"),
    meta: {
      eyebrow: "Sell",
      title: "Checkout workspace",
      description: "Search, add, review, and complete sales without leaving the workspace flow.",
    },
  },
  {
    match: (pathname) => pathname.startsWith("/sales"),
    meta: {
      eyebrow: "Sales",
      title: "Transaction workspace",
      description: "Review finalized receipts, payment flow, and cashier activity in one split view.",
    },
  },
  {
    match: (pathname) => pathname.startsWith("/events"),
    meta: {
      eyebrow: "Events",
      title: "Event workspace control",
      description: "Create bazaar workspaces, assign team access, and drive lifecycle status clearly.",
    },
  },
  {
    match: (pathname) => pathname.startsWith("/catalog"),
    meta: {
      eyebrow: "Catalog",
      title: "Product setup",
      description: "Maintain assortments, variants, and base pricing.",
    },
  },
  {
    match: (pathname) => pathname.startsWith("/inventory"),
    meta: {
      eyebrow: "Inventory",
      title: "Stock control",
      description: "Track movement, restocks, and current quantity on hand.",
    },
  },
  {
    match: (pathname) => pathname.startsWith("/promotions"),
    meta: {
      eyebrow: "Promotions",
      title: "Offer management",
      description: "Publish retail offers without breaking the selling flow.",
    },
  },
  {
    match: (pathname) => pathname.startsWith("/reports"),
    meta: {
      eyebrow: "Reports",
      title: "Operational reporting",
      description: "Read workspace performance and stock pressure clearly.",
    },
  },
  {
    match: (pathname) => pathname.startsWith("/settings"),
    meta: {
      eyebrow: "Settings",
      title: "Store configuration",
      description: "Adjust store-level preferences and selling defaults.",
    },
  },
  {
    match: (pathname) => pathname.startsWith("/users"),
    meta: {
      eyebrow: "Users",
      title: "Team access",
      description: "Manage team access and role coverage.",
    },
  },
  {
    match: (pathname) => pathname.startsWith("/dashboard"),
    meta: {
      eyebrow: "Dashboard",
      title: "Retail command view",
      description: "Stay on top of revenue, alerts, and workspace activity.",
    },
  },
];

export function getShellTone(pathname) {
  if (pathname.startsWith("/checkout") || pathname.startsWith("/sales")) {
    return "compact";
  }

  return "default";
}

export function getShellRouteMeta(pathname) {
  return (
    ROUTE_META.find((item) => item.match(pathname))?.meta ?? {
      eyebrow: "Workspace",
      title: "Retail operations",
      description: "Run daily store and event operations from one system.",
    }
  );
}
