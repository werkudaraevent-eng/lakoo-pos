function normalizeCategory(value) {
  return String(value || "").trim();
}

function normalizeQuery(value) {
  return String(value || "").trim().toLowerCase();
}

function normalizeMetaPart(value) {
  const part = String(value || "").trim();
  return part && part !== "-" ? part : "";
}

export function buildCheckoutCategories(variants = []) {
  const uniqueCategories = [...new Set(
    (Array.isArray(variants) ? variants : [])
      .map((item) => normalizeCategory(item?.category))
      .filter(Boolean)
  )].sort((left, right) => left.localeCompare(right));

  return ["All Items", ...uniqueCategories];
}

export function filterCheckoutVariants({ variants = [], category = "All Items", query = "" } = {}) {
  const safeVariants = Array.isArray(variants) ? variants : [];
  const selectedCategory = normalizeCategory(category);
  const keyword = normalizeQuery(query);

  return safeVariants.filter((item) => {
    if (!item?.productActive || !item?.isActive) {
      return false;
    }

    if (selectedCategory && selectedCategory !== "All Items" && normalizeCategory(item.category) !== selectedCategory) {
      return false;
    }

    if (!keyword) {
      return true;
    }

    const haystack = `${item.productName} ${item.sku} ${item.attribute2Value} ${item.attribute1Value}`.toLowerCase();
    return haystack.includes(keyword);
  });
}

export function formatCheckoutVariantMeta(variant = {}) {
  const metaParts = [normalizeMetaPart(variant.attribute1Value), normalizeMetaPart(variant.attribute2Value)].filter(Boolean);

  if (metaParts.length > 0) {
    return metaParts.join(" / ");
  }

  return normalizeCategory(variant.category) || "Standard";
}

export function getCheckoutStockState(quantityOnHand) {
  const quantity = Number.isFinite(quantityOnHand) ? quantityOnHand : Number(quantityOnHand || 0);

  if (quantity <= 0) {
    return {
      label: "Out of stock",
      tone: "out",
    };
  }

  if (quantity <= 3) {
    return {
      label: `${quantity} left`,
      tone: "low",
    };
  }

  return {
    label: `${quantity} in stock`,
    tone: "ready",
  };
}
