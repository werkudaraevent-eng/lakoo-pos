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
