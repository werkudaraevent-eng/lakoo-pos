function normalizeCategory(value) {
  return String(value || "").trim();
}

function normalizeQuery(value) {
  return String(value || "").trim().toLowerCase();
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

    const haystack = `${item.productName} ${item.sku} ${item.color} ${item.size}`.toLowerCase();
    return haystack.includes(keyword);
  });
}
