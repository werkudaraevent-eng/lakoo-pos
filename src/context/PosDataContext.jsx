import { createContext, useContext, useEffect, useMemo, useState } from "react";

import { apiGet, apiPatch, apiPost, apiPut, withQuery } from "../api/client";
import { useAuth } from "./AuthContext";
import { useWorkspace } from "./WorkspaceContext";

const PosDataContext = createContext(null);

function flattenVariants(products) {
  const safeProducts = Array.isArray(products) ? products : [];

  return safeProducts.flatMap((product) =>
    (Array.isArray(product.variants) ? product.variants : []).map((variant) => ({
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

function createEmptyState() {
  return {
    settings: {
      storeName: "",
      storeCode: "",
      address: "",
      paymentMethods: [],
      serviceChargeEnabled: false,
    },
    workspaces: [],
    categories: [],
    users: [],
    products: [],
    promotions: [],
    sales: [],
    inventoryMovements: [],
  };
}

function normalizeBootstrapState(data) {
  const emptyState = createEmptyState();

  return {
    ...emptyState,
    ...data,
    settings: {
      ...emptyState.settings,
      ...(data?.settings ?? {}),
    },
    workspaces: Array.isArray(data?.workspaces) ? data.workspaces : emptyState.workspaces,
    categories: Array.isArray(data?.categories) ? data.categories : emptyState.categories,
    users: Array.isArray(data?.users) ? data.users : emptyState.users,
    products: Array.isArray(data?.products) ? data.products : emptyState.products,
    promotions: Array.isArray(data?.promotions) ? data.promotions : emptyState.promotions,
    sales: Array.isArray(data?.sales) ? data.sales : emptyState.sales,
    inventoryMovements: Array.isArray(data?.inventoryMovements)
      ? data.inventoryMovements
      : emptyState.inventoryMovements,
  };
}

export function PosDataProvider({ children }) {
  const { user } = useAuth();
  const { activeWorkspaceId } = useWorkspace();
  const [state, setState] = useState(() => createEmptyState());
  const [loading, setLoading] = useState(false);
  const [hasLoaded, setHasLoaded] = useState(false);
  const [loadError, setLoadError] = useState("");

  const variants = useMemo(() => flattenVariants(state.products), [state.products]);

  async function loadBootstrapData() {
    const payload = await apiGet(
      withQuery("/api/bootstrap", activeWorkspaceId ? { workspaceId: activeWorkspaceId } : undefined)
    );

    return normalizeBootstrapState(payload.data);
  }

  async function reload() {
    if (!user) {
      setState(createEmptyState());
      setLoading(false);
      setHasLoaded(false);
      setLoadError("");
      return;
    }

    setHasLoaded(false);
    setLoading(true);
    setLoadError("");

    try {
      setState(await loadBootstrapData());
    } catch (error) {
      setLoadError(error.message);
    } finally {
      setLoading(false);
      setHasLoaded(true);
    }
  }

  useEffect(() => {
    if (user) {
      let cancelled = false;

      async function bootstrap() {
        setHasLoaded(false);
        setLoading(true);
        setLoadError("");

        try {
          const nextState = await loadBootstrapData();

          if (!cancelled) {
            setState(nextState);
          }
        } catch (error) {
          if (!cancelled) {
            setLoadError(error.message);
          }
        } finally {
          if (!cancelled) {
            setLoading(false);
            setHasLoaded(true);
          }
        }
      }

      bootstrap();

      return () => {
        cancelled = true;
      };
    } else {
      setState(createEmptyState());
      setLoading(false);
      setHasLoaded(false);
      setLoadError("");
    }
  }, [activeWorkspaceId, user]);

  async function createPromotion(payload, actor) {
    const response = await apiPost("/api/promotions", {
      ...payload,
      actorUserId: actor.id,
    });
    setState(normalizeBootstrapState(response.data));
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
      setState(normalizeBootstrapState(response.data));
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
      setState(normalizeBootstrapState(response.data));
      return { ok: true, sale: response.sale };
    } catch (error) {
      return { ok: false, message: error.message };
    }
  }

  async function updateSettings(nextSettings) {
    const response = await apiPut("/api/settings", nextSettings);
    setState(normalizeBootstrapState(response.data));
    return { ok: true };
  }

  async function createUser(payload) {
    const response = await apiPost("/api/users", payload);
    setState(normalizeBootstrapState(response.data));
    return { ok: true };
  }

  async function updateUser(userId, payload) {
    const response = await apiPatch(`/api/users/${userId}`, payload);
    setState(normalizeBootstrapState(response.data));
    return { ok: true };
  }

  async function createProduct(payload) {
    const response = await apiPost("/api/products", payload);
    setState(normalizeBootstrapState(response.data));
    return { ok: true };
  }

  async function updateProduct(productId, payload) {
    const response = await apiPatch(`/api/products/${productId}`, payload);
    setState(normalizeBootstrapState(response.data));
    return { ok: true };
  }

  async function createVariant(productId, payload) {
    const response = await apiPost(`/api/products/${productId}/variants`, payload);
    setState(normalizeBootstrapState(response.data));
    return { ok: true };
  }

  async function updateVariant(variantId, payload) {
    const response = await apiPatch(`/api/variants/${variantId}`, payload);
    setState(normalizeBootstrapState(response.data));
    return { ok: true };
  }

  return (
    <PosDataContext.Provider
      value={{
        ...state,
        variants,
        loading,
        hasLoaded,
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
