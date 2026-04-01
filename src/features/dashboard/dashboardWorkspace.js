export function buildDashboardCommandStrip(workspace) {
  const commands = [
    { label: "Open checkout", href: "/checkout" },
    { label: "View sales", href: "/sales" },
    { label: "Adjust stock", href: "/inventory" },
  ];

  if (workspace?.type === "event" && workspace?.status === "active") {
    commands.push({ label: "Close event", href: `/events/${workspace.id}/close`, tone: "warning" });
  } else {
    commands.push({ label: "View events", href: "/events" });
  }

  return commands;
}

export function buildDashboardHeroMetrics({ revenue = 0, transactions = 0, discountTotal = 0 } = {}) {
  const averageOrderValue = transactions > 0 ? Math.round(revenue / transactions) : 0;

  return {
    primary: {
      label: "Revenue today",
      value: revenue,
      kind: "currency",
      meta: `${transactions} transactions today`,
    },
    secondary: [
      {
        label: "Transactions",
        value: transactions,
        kind: "count",
        meta: "Completed sales today.",
      },
      {
        label: "Average order value",
        value: averageOrderValue,
        kind: "currency",
        meta: "Average basket across finalized sales.",
      },
      {
        label: "Discount total",
        value: discountTotal,
        kind: "currency",
        meta: "Applied across finalized sales today.",
      },
    ],
  };
}

export function buildDashboardKpiBand({ revenue = 0, transactions = 0, lowStock = 0, discountTotal = 0 } = {}) {
  return [
    {
      label: "Revenue today",
      value: revenue,
      kind: "currency",
      meta: `Discounts recorded: ${discountTotal}`,
    },
    {
      label: "Transactions",
      value: transactions,
      kind: "count",
      meta: "Completed sales for the current day.",
    },
    {
      label: "Low-stock variants",
      value: lowStock,
      kind: "count",
      meta: lowStock > 0 ? "Restock attention needed now." : "Stock position is stable.",
    },
  ];
}
