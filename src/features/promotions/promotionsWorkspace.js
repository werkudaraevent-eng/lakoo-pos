function parseDate(value) {
  const date = value ? new Date(value) : null;
  return date && !Number.isNaN(date.getTime()) ? date : null;
}

function isSameDay(left, right) {
  return (
    left.getFullYear() === right.getFullYear() &&
    left.getMonth() === right.getMonth() &&
    left.getDate() === right.getDate()
  );
}

export function getPromotionStatus(promotion, now = new Date()) {
  const startAt = parseDate(promotion?.startAt);
  const endAt = parseDate(promotion?.endAt);

  if (!promotion?.isActive || (endAt && now > endAt)) {
    return { tone: "ended", label: "Ended" };
  }

  if (startAt && now < startAt) {
    return { tone: "scheduled", label: "Scheduled" };
  }

  return { tone: "active", label: "Active" };
}

export function buildPromotionTypeLabel(promotion) {
  const value = Number(promotion?.value || 0);

  if (promotion?.type === "percentage") {
    return `${value}% Off Order`;
  }

  return `Rp ${value.toLocaleString("id-ID")} Off`;
}

export function buildPromotionMetrics(promotions = [], sales = [], now = new Date()) {
  const safePromotions = Array.isArray(promotions) ? promotions : [];
  const safeSales = Array.isArray(sales) ? sales : [];
  const todayPromoSales = safeSales.filter((sale) => {
    if (!sale?.promotion || !sale?.createdAt) {
      return false;
    }

    const createdAt = new Date(sale.createdAt);
    return !Number.isNaN(createdAt.getTime()) && isSameDay(createdAt, now);
  });

  return {
    activeCount: safePromotions.filter((promotion) => getPromotionStatus(promotion, now).tone === "active").length,
    scheduledCount: safePromotions.filter((promotion) => getPromotionStatus(promotion, now).tone === "scheduled")
      .length,
    totalDiscounts: safeSales.reduce((sum, sale) => sum + Number(sale?.promotion?.discountAmount || 0), 0),
    promoUsedToday: todayPromoSales.length,
  };
}

export function buildPromotionRows(promotions = [], sales = [], now = new Date()) {
  const safePromotions = Array.isArray(promotions) ? promotions : [];
  const safeSales = Array.isArray(sales) ? sales : [];

  return safePromotions.map((promotion) => {
    const usageSales = safeSales.filter((sale) => sale?.promotion?.codeSnapshot === promotion.code);
    const totalDiscount = usageSales.reduce((sum, sale) => sum + Number(sale?.promotion?.discountAmount || 0), 0);
    const status = getPromotionStatus(promotion, now);

    return {
      ...promotion,
      status,
      typeLabel: buildPromotionTypeLabel(promotion),
      usageCount: usageSales.length,
      totalDiscount,
      hasUsageData: usageSales.length > 0,
    };
  });
}

export function filterPromotionRows(rows = [], { query = "", status = "all" } = {}) {
  const safeRows = Array.isArray(rows) ? rows : [];
  const keyword = String(query || "").trim().toLowerCase();

  return safeRows.filter((row) => {
    const matchesStatus = status === "all" || row.status.tone === status;

    if (!matchesStatus) {
      return false;
    }

    if (!keyword) {
      return true;
    }

    const haystack = `${row.code} ${row.type} ${row.typeLabel}`.toLowerCase();
    return haystack.includes(keyword);
  });
}

export function sortPromotionRows(rows = [], sortBy = "status") {
  const safeRows = [...(Array.isArray(rows) ? rows : [])];
  const rank = {
    active: 0,
    scheduled: 1,
    ended: 2,
  };

  if (sortBy === "latest") {
    return safeRows.sort((left, right) => new Date(right.createdAt) - new Date(left.createdAt));
  }

  if (sortBy === "usage") {
    return safeRows.sort((left, right) => right.usageCount - left.usageCount);
  }

  return safeRows.sort((left, right) => {
    const leftRank = rank[left.status.tone] ?? 99;
    const rightRank = rank[right.status.tone] ?? 99;
    if (leftRank !== rightRank) {
      return leftRank - rightRank;
    }

    return String(left.code || "").localeCompare(String(right.code || ""));
  });
}

export function paginatePromotionRows(rows = [], { page = 1, pageSize = 8 } = {}) {
  const safeRows = Array.isArray(rows) ? rows : [];
  const totalPages = Math.max(1, Math.ceil(safeRows.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    page: safePage,
    pageSize,
    totalPages,
    items: safeRows.slice(start, start + pageSize),
  };
}

export function buildPromotionsCsv(rows = []) {
  const header = [["Code", "Type", "Status", "Usage Count", "Start", "End"]];
  const csvRows = (Array.isArray(rows) ? rows : []).map((row) => [
    row.code || "",
    row.typeLabel || "",
    row.status?.label || "",
    String(row.usageCount || 0),
    row.startAt || "",
    row.endAt || "",
  ]);

  return [...header, ...csvRows]
    .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
    .join("\n");
}
