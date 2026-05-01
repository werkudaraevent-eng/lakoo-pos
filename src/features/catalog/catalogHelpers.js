export function createEmptyProductDraft() {
  return {
    name: "",
    category: "",
    description: "",
    basePrice: "",
    isActive: true,
  };
}

export function createEmptyVariantDraft() {
  return {
    sku: "",
    attribute1Value: "",
    attribute2Value: "",
    priceOverride: "",
    quantityOnHand: "",
    lowStockThreshold: "",
    isActive: true,
  };
}

export function normalizeProductPayload(draft) {
  return {
    name: draft.name.trim(),
    category: draft.category.trim(),
    description: draft.description.trim(),
    basePrice: Number(draft.basePrice),
    isActive: Boolean(draft.isActive),
  };
}

export function normalizeVariantPayload(draft) {
  const priceOverride = `${draft.priceOverride}`.trim();

  return {
    sku: draft.sku.trim(),
    attribute1Value: (draft.attribute1Value || draft.size || "").trim(),
    attribute2Value: (draft.attribute2Value || draft.color || "").trim(),
    priceOverride: priceOverride ? Number(priceOverride) : null,
    quantityOnHand: Number(draft.quantityOnHand),
    lowStockThreshold: Number(draft.lowStockThreshold),
    isActive: Boolean(draft.isActive),
  };
}

function toNumber(value) {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : 0;
}

export function buildCatalogStockSummary(product = {}) {
  const variants = Array.isArray(product.variants) ? product.variants : [];
  const activeVariants = variants.filter((variant) => variant?.isActive !== false);
  const quantityTotal = activeVariants.reduce((sum, variant) => sum + toNumber(variant?.quantityOnHand), 0);
  const hasOutOfStock = activeVariants.some((variant) => toNumber(variant?.quantityOnHand) <= 0);
  const hasLowStock = activeVariants.some((variant) => {
    const quantityOnHand = toNumber(variant?.quantityOnHand);
    const threshold = toNumber(variant?.lowStockThreshold);
    return quantityOnHand > 0 && threshold > 0 && quantityOnHand <= threshold;
  });

  if (activeVariants.length === 0 || quantityTotal <= 0 || hasOutOfStock && quantityTotal <= 0) {
    return {
      tone: "none",
      label: "Out of stock",
      total: 0,
    };
  }

  if (hasLowStock) {
    return {
      tone: "low",
      label: `${quantityTotal} in stock`,
      total: quantityTotal,
    };
  }

  return {
    tone: "high",
    label: `${quantityTotal} in stock`,
    total: quantityTotal,
  };
}

export function filterCatalogProducts(products = [], { query = "", stockFilter = "all" } = {}) {
  const keyword = String(query || "").trim().toLowerCase();
  const safeProducts = Array.isArray(products) ? products : [];

  return safeProducts.filter((product) => {
    const stockSummary = buildCatalogStockSummary(product);
    const matchesStock = stockFilter === "all" || stockSummary.tone === stockFilter;

    if (!matchesStock) {
      return false;
    }

    if (!keyword) {
      return true;
    }

    const variantSearch = (Array.isArray(product.variants) ? product.variants : [])
      .map((variant) => `${variant.sku} ${variant.attribute1Value} ${variant.attribute2Value}`)
      .join(" ");
    const haystack = `${product.name} ${product.category} ${product.description} ${variantSearch}`.toLowerCase();
    return haystack.includes(keyword);
  });
}

export function sortCatalogProducts(products = [], sortBy = "name-asc") {
  const safeProducts = [...(Array.isArray(products) ? products : [])];

  if (sortBy === "price-low") {
    return safeProducts.sort((left, right) => toNumber(left.basePrice) - toNumber(right.basePrice));
  }

  if (sortBy === "price-high") {
    return safeProducts.sort((left, right) => toNumber(right.basePrice) - toNumber(left.basePrice));
  }

  if (sortBy === "stock-high") {
    return safeProducts.sort(
      (left, right) => buildCatalogStockSummary(right).total - buildCatalogStockSummary(left).total
    );
  }

  return safeProducts.sort((left, right) => String(left.name || "").localeCompare(String(right.name || "")));
}

export function paginateCatalogProducts(products = [], { page = 1, pageSize = 8 } = {}) {
  const safeProducts = Array.isArray(products) ? products : [];
  const totalPages = Math.max(1, Math.ceil(safeProducts.length / pageSize));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const start = (safePage - 1) * pageSize;

  return {
    page: safePage,
    pageSize,
    totalPages,
    items: safeProducts.slice(start, start + pageSize),
  };
}

export function buildCatalogCsv(products = []) {
  const header = '"Nama Produk","Kategori","Harga Dasar","SKU","Atribut 1","Atribut 2","Stok","Harga Override","Status"';
  const rows = [];

  for (const product of (Array.isArray(products) ? products : [])) {
    for (const variant of (product.variants || [])) {
      rows.push([
        product.name,
        product.category || "",
        product.basePrice || 0,
        variant.sku || "",
        variant.attribute1Value || "",
        variant.attribute2Value || "",
        variant.quantityOnHand || 0,
        variant.priceOverride || "",
        product.isActive ? "active" : "inactive",
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(","));
    }
    // Product with no variants — still export it
    if (!product.variants || product.variants.length === 0) {
      rows.push([
        product.name,
        product.category || "",
        product.basePrice || 0,
        "", "", "", "", "",
        product.isActive ? "active" : "inactive",
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(","));
    }
  }

  return header + "\n" + rows.join("\n");
}
