function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toDayKey(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toDateString();
}

export function buildDashboardSummary({ sales = [], variants = [], now = new Date().toISOString() } = {}) {
  const safeSales = Array.isArray(sales) ? sales : [];
  const safeVariants = Array.isArray(variants) ? variants : [];
  const todayKey = toDayKey(now);
  const todaySales = todayKey
    ? safeSales.filter((sale) => toDayKey(sale?.createdAt) === todayKey)
    : [];

  return {
    revenue: todaySales.reduce((sum, sale) => sum + toNumber(sale?.grandTotal), 0),
    transactions: todaySales.length,
    lowStock: safeVariants.filter((variant) => {
      const quantityOnHand = Number(variant?.quantityOnHand);
      const lowStockThreshold = Number(variant?.lowStockThreshold);

      return Number.isFinite(quantityOnHand) && Number.isFinite(lowStockThreshold)
        ? quantityOnHand <= lowStockThreshold
        : false;
    }).length,
    discountTotal: safeSales.reduce((sum, sale) => sum + toNumber(sale?.discountTotal), 0),
  };
}
