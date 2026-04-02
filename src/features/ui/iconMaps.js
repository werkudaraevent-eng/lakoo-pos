export function getNavigationIconName(label) {
  const map = {
    Dashboard: "LayoutDashboard",
    Checkout: "ShoppingCart",
    Sales: "Receipt",
    Events: "CalendarDays",
    Catalog: "Package",
    Inventory: "Boxes",
    Promotions: "BadgePercent",
    Reports: "BarChart3",
    Settings: "Settings",
    Users: "Users",
  };

  return map[label] || "Circle";
}

export function getDashboardKpiIconName(label) {
  const map = {
    "Gross revenue": "Banknote",
    Transactions: "Receipt",
    "Average order value": "Calculator",
    "Items sold": "ShoppingBag",
  };

  return map[label] || "Circle";
}

export function getCheckoutActionIconName(action) {
  const map = {
    search: "Search",
    note: "StickyNote",
    customer: "UserPlus",
    clear: "Trash2",
    walkIn: "User",
    minus: "Minus",
    plus: "Plus",
    charge: "CreditCard",
  };

  return map[action] || "Circle";
}
