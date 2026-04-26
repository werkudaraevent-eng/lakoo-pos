function parseDate(value) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
}

function getUtcDayStart(date) {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()));
}

function getUtcDayKey(date) {
  return getUtcDayStart(date).toISOString().slice(0, 10);
}

function isWithinLastDays(date, now, days) {
  const start = getUtcDayStart(now);
  start.setUTCDate(start.getUTCDate() - (days - 1));
  return date >= start && date <= now;
}

function formatDayLabel(date) {
  return new Intl.DateTimeFormat("en-US", { weekday: "short", timeZone: "UTC" }).format(date);
}

export function filterSalesByPeriod(sales = [], period = "7d", now = new Date()) {
  const safeSales = Array.isArray(sales) ? sales : [];
  const days = period === "30d" ? 30 : 7;

  return safeSales.filter((sale) => {
    const createdAt = parseDate(sale?.createdAt);
    return createdAt ? isWithinLastDays(createdAt, now, days) : false;
  });
}

export function buildReportsSummary(sales = []) {
  const safeSales = Array.isArray(sales) ? sales : [];
  const grossSales = safeSales.reduce((sum, sale) => sum + Number(sale?.subtotal || 0), 0);
  const totalOrders = safeSales.length;
  const avgOrderValue = totalOrders ? safeSales.reduce((sum, sale) => sum + Number(sale?.grandTotal || 0), 0) / totalOrders : 0;
  const itemsSold = safeSales.reduce(
    (sum, sale) => sum + (Array.isArray(sale?.items) ? sale.items.reduce((itemSum, item) => itemSum + Number(item?.qty || 0), 0) : 0),
    0
  );

  return {
    grossSales,
    totalOrders,
    avgOrderValue,
    itemsSold,
  };
}

export function buildSalesOverTime(sales = [], period = "7d", now = new Date()) {
  const days = period === "30d" ? 30 : 7;
  const start = getUtcDayStart(now);
  start.setUTCDate(start.getUTCDate() - (days - 1));

  const buckets = Array.from({ length: days }, (_, index) => {
    const date = new Date(start);
    date.setUTCDate(start.getUTCDate() + index);
    return {
      key: getUtcDayKey(date),
      label: formatDayLabel(date),
      total: 0,
    };
  });
  const byKey = new Map(buckets.map((bucket) => [bucket.key, bucket]));

  for (const sale of Array.isArray(sales) ? sales : []) {
    const createdAt = parseDate(sale?.createdAt);
    if (!createdAt) {
      continue;
    }

    const key = getUtcDayKey(createdAt);
    const bucket = byKey.get(key);
    if (bucket) {
      bucket.total += Number(sale?.grandTotal || 0);
    }
  }

  const max = Math.max(...buckets.map((bucket) => bucket.total), 0);
  return buckets.map((bucket) => ({
    ...bucket,
    heightRatio: max > 0 ? bucket.total / max : 0,
  }));
}

export function buildTopCategories(sales = [], products = []) {
  const variantsById = new Map();

  for (const product of Array.isArray(products) ? products : []) {
    for (const variant of Array.isArray(product?.variants) ? product.variants : []) {
      variantsById.set(variant.id, product.category || "Unknown");
    }
  }

  const totals = new Map();

  for (const sale of Array.isArray(sales) ? sales : []) {
    for (const item of Array.isArray(sale?.items) ? sale.items : []) {
      const category = variantsById.get(item.variantId) || "Unknown";
      totals.set(category, (totals.get(category) || 0) + Number(item.lineTotal || 0));
    }
  }

  const entries = [...totals.entries()].sort((left, right) => right[1] - left[1]).slice(0, 5);
  const max = Math.max(...entries.map(([, total]) => total), 0);

  return entries.map(([label, total]) => ({
    label,
    total,
    ratio: max > 0 ? total / max : 0,
  }));
}

export function buildRecentTransactions(sales = []) {
  return [...(Array.isArray(sales) ? sales : [])]
    .sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt))
    .slice(0, 5)
    .map((sale) => ({
      id: sale.id,
      time: parseDate(sale.createdAt),
      orderId: sale.receiptNumber,
      customer: "Walk-in",
      items: Array.isArray(sale.items) ? sale.items.reduce((sum, item) => sum + Number(item.qty || 0), 0) : 0,
      status: "Completed",
      total: Number(sale.grandTotal || 0),
    }));
}

export function buildReportsCsv(sales = []) {
  const header = [["Receipt", "Created At", "Items", "Status", "Total"]];
  const rows = buildRecentTransactions(sales).map((sale) => [
    sale.orderId || "",
    sale.time ? sale.time.toISOString() : "",
    String(sale.items || 0),
    sale.status || "",
    String(sale.total || 0),
  ]);

  return [...header, ...rows]
    .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
    .join("\n");
}
