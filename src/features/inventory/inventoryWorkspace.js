export function getInventoryStatusLabel(variant = {}) {
  if (Number(variant.quantityOnHand) <= 0) {
    return { tone: "none", label: "Out of stock" };
  }

  if (Number(variant.quantityOnHand) <= Number(variant.lowStockThreshold)) {
    return { tone: "warning", label: "Low stock" };
  }

  return { tone: "stable", label: "In stock" };
}

export function buildInventoryWorkspaceSummary({ variants = [] } = {}) {
  return variants.reduce(
    (summary, variant) => {
      summary.totalVariants += 1;
      summary.totalOnHand += Number(variant.quantityOnHand || 0);

      if (Number(variant.quantityOnHand) <= Number(variant.lowStockThreshold)) {
        summary.lowStockCount += 1;
      }

      return summary;
    },
    {
      totalVariants: 0,
      lowStockCount: 0,
      totalOnHand: 0,
    }
  );
}

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

function matchesInventoryQuery(product, query) {
  if (!query) {
    return true;
  }

  const haystack = `${product.name} ${product.category} ${product.description} ${(product.variants || [])
    .map((variant) => `${variant.sku} ${variant.attribute1Value} ${variant.attribute2Value}`)
    .join(" ")}`.toLowerCase();
  return haystack.includes(String(query).trim().toLowerCase());
}

export function buildInventoryProductRows(products = [], { activeWorkspace = null } = {}) {
  const safeProducts = Array.isArray(products) ? products : [];

  return safeProducts.map((product) => {
    const activeVariants = (Array.isArray(product.variants) ? product.variants : []).filter(
      (variant) => variant?.isActive !== false
    );
    const totalStock = activeVariants.reduce((sum, variant) => sum + toNumber(variant.quantityOnHand), 0);
    const lowThreshold = activeVariants.reduce((sum, variant) => sum + toNumber(variant.lowStockThreshold), 0);
    const hasLowStock = activeVariants.some((variant) => {
      const quantity = toNumber(variant.quantityOnHand);
      const threshold = toNumber(variant.lowStockThreshold);
      return quantity > 0 && threshold > 0 && quantity <= threshold;
    });
    const status =
      totalStock <= 0
        ? { tone: "none", label: "Out of stock" }
        : hasLowStock
          ? { tone: "warning", label: "Low stock" }
          : { tone: "stable", label: "In stock" };

    const warehouseStock =
      activeWorkspace?.type === "event"
        ? null
        : totalStock;
    const activeWorkspaceStock =
      activeWorkspace?.type === "event"
        ? totalStock
        : null;

    return {
      id: product.id,
      name: product.name,
      category: product.category,
      description: product.description,
      totalStock,
      warehouseStock,
      workspaceStock: activeWorkspaceStock,
      workspaceLabel: activeWorkspace?.name || "Active workspace",
      lowThreshold,
      status,
      variants: activeVariants.length,
      sku: activeVariants[0]?.sku ?? "-",
    };
  });
}

export function filterInventoryProductRows(rows = [], { query = "", category = "all", status = "all" } = {}) {
  const safeRows = Array.isArray(rows) ? rows : [];

  return safeRows.filter((row) => {
    const matchesCategory = category === "all" || row.category === category;
    const matchesStatus = status === "all" || row.status.tone === status;
    const matchesQueryText = matchesInventoryQuery(row, query);
    return matchesCategory && matchesStatus && matchesQueryText;
  });
}

export function paginateInventoryRows(rows = [], { page = 1, pageSize = 8 } = {}) {
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

export function buildInventoryCsv(rows = []) {
  const head = [["Product", "Category", "Total Stock", "Warehouse", "Workspace", "Status"]];
  const csvRows = (Array.isArray(rows) ? rows : []).map((row) => [
    row.name || "",
    row.category || "",
    String(toNumber(row.totalStock)),
    row.warehouseStock == null ? "-" : String(toNumber(row.warehouseStock)),
    row.workspaceStock == null ? "-" : String(toNumber(row.workspaceStock)),
    row.status?.label || "",
  ]);

  return [...head, ...csvRows]
    .map((row) => row.map((cell) => `"${String(cell).replaceAll('"', '""')}"`).join(","))
    .join("\n");
}
