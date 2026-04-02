function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function toDayKey(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? "" : date.toDateString();
}

function toDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

const EVENT_TRANSITIONS = {
  draft: new Set(["active", "archived"]),
  active: new Set(["closed"]),
  closed: new Set(["archived"]),
  archived: new Set(),
};

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
    itemsSold: todaySales.reduce(
      (sum, sale) =>
        sum +
        (Array.isArray(sale?.items)
          ? sale.items.reduce((itemSum, item) => itemSum + toNumber(item?.qty), 0)
          : 0),
      0
    ),
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

export function buildEventProgress({ workspace, now = new Date().toISOString() } = {}) {
  if (workspace?.type !== "event") {
    return null;
  }

  const start = toDate(workspace.startsAt);
  const end = toDate(workspace.endsAt);
  const current = toDate(now);

  if (!start || !end || !current || end <= start) {
    return null;
  }

  const totalHours = Math.round((end - start) / 36e5);
  const elapsedHours = Math.max(0, Math.min(totalHours, Math.round((current - start) / 36e5)));
  const remainingHours = Math.max(0, Math.round((end - current) / 36e5));
  const status = workspace.status || "";

  let phase = "Live now";
  let progressPercent = totalHours === 0 ? 100 : Math.round((elapsedHours / totalHours) * 100);
  let isComplete = false;

  if (status === "draft" || current < start) {
    phase = "Upcoming";
    progressPercent = 0;
  } else if (status === "closed") {
    phase = "Closed";
    progressPercent = 100;
    isComplete = true;
  } else if (status === "archived") {
    phase = "Archived";
    progressPercent = 100;
    isComplete = true;
  } else if (current >= end) {
    phase = "Ended";
    progressPercent = 100;
    isComplete = true;
  }

  return {
    phase,
    progressPercent,
    elapsedHours: phase === "Upcoming" ? 0 : elapsedHours,
    remainingHours: isComplete ? 0 : remainingHours,
    totalHours,
    isComplete,
  };
}

export function canTransitionEvent(currentStatus, nextStatus) {
  return EVENT_TRANSITIONS[currentStatus]?.has(nextStatus) ?? false;
}

export function getEventActionLabel(stockMode) {
  if (stockMode === "allocate") {
    return "Allocate from main stock";
  }

  if (stockMode === "manual") {
    return "Manual event stock";
  }

  return "Configure event stock";
}

export function canCompleteClosingReview({ salesReviewed, stockReviewed, paymentReviewed } = {}) {
  return Boolean(salesReviewed && stockReviewed && paymentReviewed);
}
