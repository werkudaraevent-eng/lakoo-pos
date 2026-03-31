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
    size: "",
    color: "",
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
    size: draft.size.trim(),
    color: draft.color.trim(),
    priceOverride: priceOverride ? Number(priceOverride) : null,
    quantityOnHand: Number(draft.quantityOnHand),
    lowStockThreshold: Number(draft.lowStockThreshold),
    isActive: Boolean(draft.isActive),
  };
}
