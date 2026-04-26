export const CHECKOUT_CART_COUNT_STORAGE_KEY = "pos-checkout-cart-count";

export function evaluateCartAddition(current, variant) {
  if (variant.quantityOnHand <= 0) {
    return {
      blocked: true,
      reason: "out-of-stock",
      nextCart: current,
    };
  }

  const existing = current.find((item) => item.variantId === variant.id);

  if (existing) {
    if (existing.qty >= variant.quantityOnHand) {
      return {
        blocked: true,
        reason: "at-capacity",
        nextCart: current,
      };
    }

    return {
      blocked: false,
      reason: null,
      nextCart: current.map((item) =>
        item.variantId === variant.id ? { ...item, qty: item.qty + 1 } : item
      ),
    };
  }

  return {
    blocked: false,
    reason: null,
    nextCart: [
      ...current,
      {
        variantId: variant.id,
        productName: variant.productName,
        sku: variant.sku,
        attribute1Value: variant.attribute1Value,
        attribute2Value: variant.attribute2Value,
        price: variant.price,
        qty: 1,
      },
    ],
  };
}

export function createFinalizeSaleLock() {
  let inFlight = false;

  return {
    tryBegin() {
      if (inFlight) {
        return false;
      }

      inFlight = true;
      return true;
    },
    release() {
      inFlight = false;
    },
  };
}

export function canFinalizeSale({ cartLength }) {
  if (cartLength === 0) {
    return { allowed: false, reason: "empty-cart" };
  }

  return { allowed: true, reason: null };
}
