function toBoolean(value) {
  return value === true || value === 1 || value === "1" || value === "t";
}

export function mapSettingsRows(rows) {
  const settings = {};

  for (const row of rows) {
    if (row.key === "showLogo" || row.key === "showBarcode" || row.key === "taxEnabled") {
      settings[row.key] = row.value === "true";
    } else if (row.key === "paymentMethods") {
      try {
        settings[row.key] = JSON.parse(row.value);
      } catch {
        settings[row.key] = [];
      }
    } else if (row.key === "serviceChargeEnabled") {
      settings[row.key] = JSON.parse(row.value);
    } else if (row.key === "taxRate") {
      settings[row.key] = parseFloat(row.value) || 0;
    } else {
      settings[row.key] = row.value;
    }
  }

  // Defaults for new settings
  if (settings.taxRate == null) settings.taxRate = 0;
  if (!settings.attribute1Label) settings.attribute1Label = "Size";
  if (!settings.attribute2Label) settings.attribute2Label = "Color";

  return settings;
}

export function mapUsers(rows) {
  return rows.map((user) => ({
    ...user,
    isActive: toBoolean(user.isActive),
  }));
}

export function mapProducts(rows) {
  const products = [];
  const byId = new Map();

  for (const row of rows) {
    if (!byId.has(row.id)) {
      const product = {
        id: row.id,
        name: row.name,
        category: row.category,
        description: row.description,
        basePrice: row.basePrice,
        imageUrl: row.imageUrl || null,
        isActive: toBoolean(row.isActive),
        createdAt: row.createdAt,
        variants: [],
      };

      byId.set(row.id, product);
      products.push(product);
    }

    if (!row.variantId) {
      continue;
    }

    byId.get(row.id).variants.push({
      id: row.variantId,
      productId: row.id,
      sku: row.sku,
      attribute1Value: row.attribute1Value,
      attribute2Value: row.attribute2Value,
      priceOverride: row.priceOverride,
      quantityOnHand: row.quantityOnHand,
      lowStockThreshold: row.lowStockThreshold,
      isActive: toBoolean(row.variantIsActive),
      createdAt: row.variantCreatedAt,
    });
  }

  return products;
}

export function overlayProductsWithWorkspaceStock(products, workspaceVariantStocks) {
  const safeProducts = Array.isArray(products) ? products : [];
  const safeWorkspaceVariantStocks = Array.isArray(workspaceVariantStocks) ? workspaceVariantStocks : [];
  const stockByVariantId = new Map(
    safeWorkspaceVariantStocks.map((stock) => [stock.variantId, stock])
  );

  return safeProducts.reduce((nextProducts, product) => {
    const nextVariants = (Array.isArray(product?.variants) ? product.variants : []).flatMap((variant) => {
      const workspaceStock = stockByVariantId.get(variant.id);

      if (!workspaceStock) {
        return [];
      }

      return [
        {
          ...variant,
          mainStockOnHand: variant.quantityOnHand,
          quantityOnHand: workspaceStock.quantityOnHand,
          sourceMode: workspaceStock.sourceMode,
          allocatedFromMain: workspaceStock.allocatedFromMain,
        },
      ];
    });

    if (nextVariants.length === 0) {
      return nextProducts;
    }

    nextProducts.push({
      ...product,
      variants: nextVariants,
    });

    return nextProducts;
  }, []);
}

export function mapPromotions(rows) {
  return rows.map((promo) => ({
    ...promo,
    isActive: toBoolean(promo.isActive),
  }));
}

export function mapWorkspaceRows(rows) {
  const workspaces = [];
  const byId = new Map();

  for (const row of rows) {
    if (!byId.has(row.id)) {
      const workspace = {
        id: row.id,
        type: row.type,
        name: row.name,
        status: row.status,
        stockMode: row.stockMode,
        isVisible: toBoolean(row.isVisible),
        locationLabel: row.locationLabel,
        startsAt: row.startsAt,
        endsAt: row.endsAt,
        assignedUserIds: [],
      };

      byId.set(row.id, workspace);
      workspaces.push(workspace);
    }

    if (row.assignedUserId) {
      byId.get(row.id).assignedUserIds.push(row.assignedUserId);
    }
  }

  return workspaces;
}

export function filterRowsByWorkspace(rows, { workspaceId = null, fallbackWorkspaceId = null } = {}) {
  if (!workspaceId) {
    return rows;
  }

  return rows.filter((row) => (row.workspaceId ?? fallbackWorkspaceId ?? null) === workspaceId);
}

export function mapSales(sales, items, promotions) {
  const mappedSales = sales.map((sale) => ({
    ...sale,
    items: [],
    promotion: null,
  }));
  const byId = new Map(mappedSales.map((sale) => [sale.id, sale]));

  items.forEach((item) => {
    byId.get(item.saleId)?.items.push(item);
  });

  promotions.forEach((promotion) => {
    const sale = byId.get(promotion.saleId);
    if (sale) {
      sale.promotion = promotion;
    }
  });

  return mappedSales;
}
