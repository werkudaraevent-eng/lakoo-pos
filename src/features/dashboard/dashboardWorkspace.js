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
      label: "Pendapatan Hari Ini",
      value: revenue,
      kind: "currency",
      tone: "up",
      meta: `${transactions} transaksi hari ini`,
      iconName: "BarChart3",
      iconBg: "#f5ead8",
    },
    {
      label: "Transaksi Hari Ini",
      value: transactions,
      kind: "count",
      tone: "up",
      meta: "Penjualan selesai hari ini.",
      iconName: "Monitor",
      iconBg: "#e8f0f8",
    },
    {
      label: "Item Terjual",
      value: itemsSold,
      kind: "count",
      tone: "up",
      meta: "Unit terjual hari ini.",
      iconName: "ShoppingBag",
      iconBg: "#ebf5ef",
    },
    {
      label: "Rata-rata Order",
      value: averageOrderValue,
      kind: "currency",
      tone: "down",
      meta: "Rata-rata nilai pesanan.",
      iconName: "Clock",
      iconBg: "#fbeaea",
    },
  ];
}
