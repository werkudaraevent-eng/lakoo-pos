const DEFAULT_START_HOUR = 10;
const DEFAULT_WINDOW_SIZE = 8;

function toDayKey(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toDateString();
}

function sortByNewest(items) {
  return [...items].sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));
}

function buildTopItems(sales) {
  const tally = new Map();

  sales.forEach((sale) => {
    (Array.isArray(sale.items) ? sale.items : []).forEach((item) => {
      const key = item.productNameSnapshot || item.skuSnapshot || "Item";
      const current = tally.get(key) || { name: key, qty: 0, revenue: 0 };

      tally.set(key, {
        name: key,
        qty: current.qty + Number(item.qty || 0),
        revenue: current.revenue + Number(item.lineTotal || Number(item.unitPriceSnapshot || 0) * Number(item.qty || 0)),
      });
    });
  });

  return [...tally.values()]
    .sort((left, right) => right.qty - left.qty || right.revenue - left.revenue)
    .slice(0, 4);
}

function formatHourLabel(hour) {
  if (hour === 0) {
    return "12 AM";
  }

  if (hour < 12) {
    return `${hour} AM`;
  }

  if (hour === 12) {
    return "12 PM";
  }

  return `${hour - 12} PM`;
}

function buildChartHours(sales) {
  const saleHours = sales
    .map((sale) => new Date(sale.createdAt))
    .filter((date) => !Number.isNaN(date.getTime()))
    .map((date) => date.getHours());

  if (saleHours.length === 0) {
    return Array.from({ length: DEFAULT_WINDOW_SIZE }, (_, index) => DEFAULT_START_HOUR + index);
  }

  const earliestHour = Math.min(...saleHours);
  const startHour = Math.max(0, Math.min(earliestHour, 24 - DEFAULT_WINDOW_SIZE));

  return Array.from({ length: DEFAULT_WINDOW_SIZE }, (_, index) => startHour + index);
}

function buildChartBars(sales) {
  const hours = buildChartHours(sales);
  const buckets = new Map(hours.map((hour) => [hour, 0]));

  sales.forEach((sale) => {
    const date = new Date(sale.createdAt);
    const hour = date.getHours();

    if (!Number.isNaN(date.getTime()) && buckets.has(hour)) {
      buckets.set(hour, buckets.get(hour) + Number(sale.grandTotal || 0));
    }
  });

  const maxValue = Math.max(...buckets.values(), 0);

  return hours.map((hour) => {
    const value = buckets.get(hour) || 0;

    return {
      label: formatHourLabel(hour),
      value,
      height: maxValue > 0 ? Math.max(16, Math.round((value / maxValue) * 100)) : 0,
    };
  });
}

export function buildDashboardCollections({ sales = [], now = new Date().toISOString() } = {}) {
  const safeSales = Array.isArray(sales) ? sales : [];
  const todayKey = toDayKey(now);
  const todaySales = todayKey
    ? safeSales.filter((sale) => toDayKey(sale?.createdAt) === todayKey)
    : [];

  return {
    todaySales,
    topItems: buildTopItems(todaySales),
    recentSales: sortByNewest(todaySales).slice(0, 4),
    chartBars: buildChartBars(todaySales),
  };
}
