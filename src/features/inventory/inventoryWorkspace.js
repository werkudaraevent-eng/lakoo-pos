export function getInventoryStatusLabel(variant = {}) {
  if (Number(variant.quantityOnHand) <= Number(variant.lowStockThreshold)) {
    return { tone: "warning", label: "Low" };
  }

  return { tone: "stable", label: "Healthy" };
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
