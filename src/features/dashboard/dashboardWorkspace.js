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

export function buildDashboardKpiCards({ revenue = 0, transactions = 0, itemsSold = 0 } = {}) {
  const averageOrderValue = transactions > 0 ? Math.round(revenue / transactions) : 0;

  return [
    {
      label: "Gross revenue",
      value: revenue,
      kind: "currency",
      tone: "up",
      meta: `${transactions} transactions today`,
    },
    {
      label: "Transactions",
      value: transactions,
      kind: "count",
      tone: "up",
      meta: "Completed sales today.",
    },
    {
      label: "Average order value",
      value: averageOrderValue,
      kind: "currency",
      tone: "down",
      meta: "Average basket size.",
    },
    {
      label: "Items sold",
      value: itemsSold,
      kind: "count",
      tone: "up",
      meta: "Units sold today.",
    },
  ];
}
