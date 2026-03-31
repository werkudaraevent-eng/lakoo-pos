import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { apiGet, apiPatch, apiPost, apiPut } from "../api/client";
import { useAuth } from "./AuthContext";

const PosDataContext = createContext(null);

function flattenVariants(products) {
  return products.flatMap((product) =>
    product.variants.map((variant) => ({
      ...variant,
      productId: product.id,
      productName: product.name,
      category: product.category,
      basePrice: product.basePrice,
      price: variant.priceOverride ?? product.basePrice,
      productActive: product.isActive,
    }))
  );
}

export function PosDataProvider({ children }) {
  const { user } = useAuth();
  const [state, setState] = useState({
    settings: {
      storeName: "",
      storeCode: "",
      address: "",
      paymentMethods: [],
      serviceChargeEnabled: false,
    },
    categories: [],
    users: [],
    products: [],
    promotions: [],
    sales: [],
    inventoryMovements: [],
  });
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState("");

  const variants = useMemo(() => flattenVariants(state.products), [state.products]);

  async function reload() {
    setLoading(true);
    setLoadError("");

    try {
      const payload = await apiGet("/api/bootstrap");
      setState(payload.data);
    } catch (error) {
      setLoadError(error.message);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (user) {
      reload();
    } else {
      setState({
        settings: {
          storeName: "",
          storeCode: "",
          address: "",
        paymentMethods: [],
        serviceChargeEnabled: false,
      },
      categories: [],
      users: [],
      products: [],
      promotions: [],
        sales: [],
        inventoryMovements: [],
      });
    }
  }, [user]);

  async function createPromotion(payload, actor) {
    const response = await apiPost("/api/promotions", {
      ...payload,
      actorUserId: actor.id,
    });
    setState(response.data);
    return { ok: true };
  }

  async function adjustInventory({ variantId, mode, quantity, note, actor }) {
    try {
      const response = await apiPost("/api/inventory/movements", {
        variantId,
        mode,
        quantity,
        note,
        actorUserId: actor.id,
      });
      setState(response.data);
      return { ok: true };
    } catch (error) {
      return { ok: false, message: error.message };
    }
  }

  async function finalizeSale({ cart, promoCode, paymentMethod, actor }) {
    try {
      const response = await apiPost("/api/sales", {
        cart,
        promoCode,
        paymentMethod,
        actorUserId: actor.id,
      });
      setState(response.data);
      return { ok: true, sale: response.sale };
    } catch (error) {
      return { ok: false, message: error.message };
    }
  }

  async function updateSettings(nextSettings) {
    const response = await apiPut("/api/settings", nextSettings);
    setState(response.data);
    return { ok: true };
  }

  async function createUser(payload) {
    const response = await apiPost("/api/users", payload);
    setState(response.data);
    return { ok: true };
  }

  async function updateUser(userId, payload) {
    const response = await apiPatch(`/api/users/${userId}`, payload);
    setState(response.data);
    return { ok: true };
  }

  async function createProduct(payload) {
    const response = await apiPost("/api/products", payload);
    setState(response.data);
    return { ok: true };
  }

  async function updateProduct(productId, payload) {
    const response = await apiPatch(`/api/products/${productId}`, payload);
    setState(response.data);
    return { ok: true };
  }

  async function createVariant(productId, payload) {
    const response = await apiPost(`/api/products/${productId}/variants`, payload);
    setState(response.data);
    return { ok: true };
  }

  async function updateVariant(variantId, payload) {
    const response = await apiPatch(`/api/variants/${variantId}`, payload);
    setState(response.data);
    return { ok: true };
  }

  return (
    <PosDataContext.Provider
      value={{
        ...state,
        variants,
        loading,
        loadError,
        reload,
        createPromotion,
        adjustInventory,
        finalizeSale,
        updateSettings,
        createUser,
        updateUser,
        createProduct,
        updateProduct,
        createVariant,
        updateVariant,
      }}
    >
      {children}
    </PosDataContext.Provider>
  );
}

export function usePosData() {
  return useContext(PosDataContext);
}
