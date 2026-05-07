import { createContext, useContext, useEffect, useMemo, useRef, useState } from "react";

import {
  apiDelete,
  apiGet,
  apiPatch,
  apiPost,
  apiPut,
  withActiveWorkspace,
  withQuery,
} from "../api/client";
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
      imageUrl: product.imageUrl,
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
      taxRate: 0,
      attribute1Label: "Size",
      attribute2Label: "Color",
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
  const activeWorkspaceIdRef = useRef(activeWorkspaceId);

  const variants = useMemo(() => flattenVariants(state.products), [state.products]);

  useEffect(() => {
    activeWorkspaceIdRef.current = activeWorkspaceId;
  }, [activeWorkspaceId]);

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

  function applyMutationState(responseData, requestWorkspaceId) {
    if (activeWorkspaceIdRef.current !== requestWorkspaceId) {
      return;
    }

    setState(normalizeBootstrapState(responseData));
  }

  useEffect(() => {
    if (!user) {
      setState(createEmptyState());
      setLoading(false);
      setHasLoaded(false);
      setLoadError("");
      return;
    }

    // Only bootstrap when we have a workspace selected (or on first load to get workspace list)
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
    const requestWorkspaceId = activeWorkspaceIdRef.current || "";
    const response = await apiPost(
      "/api/inventory/movements",
      withActiveWorkspace(
        {
          variantId,
          mode,
          quantity,
          note,
          actorUserId: actor.id,
        },
        requestWorkspaceId
      )
    );
    applyMutationState(response.data, requestWorkspaceId);
    return { ok: true };
  }

  async function createEvent(payload) {
    try {
      const requestWorkspaceId = activeWorkspaceIdRef.current || "";
      const response = await apiPost("/api/events", withActiveWorkspace(payload, requestWorkspaceId));
      applyMutationState(response.data, requestWorkspaceId);
      return { ok: true, eventId: response.eventId };
    } catch (error) {
      return { ok: false, message: error.message };
    }
  }

  async function updateEventStatus(eventId, nextStatus) {
    try {
      const requestWorkspaceId = activeWorkspaceIdRef.current || "";
      const response = await apiPatch(
        `/api/events/${eventId}/status`,
        withActiveWorkspace({ nextStatus }, requestWorkspaceId)
      );
      applyMutationState(response.data, requestWorkspaceId);
      return { ok: true, eventId: response.eventId, nextStatus: response.nextStatus };
    } catch (error) {
      return { ok: false, message: error.message };
    }
  }

  async function closeEvent(eventId, payload) {
    try {
      const requestWorkspaceId = activeWorkspaceIdRef.current || "";
      const response = await apiPost(
        `/api/events/${eventId}/close`,
        withActiveWorkspace(payload, requestWorkspaceId)
      );
      applyMutationState(response.data, requestWorkspaceId);
      return { ok: true, eventId: response.eventId };
    } catch (error) {
      return { ok: false, message: error.message };
    }
  }

  async function finalizeSale({ cart, promoCode, paymentMethod, paidAmount, actor }) {
    try {
      const requestWorkspaceId = activeWorkspaceIdRef.current || "";
      const response = await apiPost(
        "/api/sales",
        withActiveWorkspace(
          {
            cart,
            promoCode,
            paymentMethod,
            paidAmount,
            actorUserId: actor.id,
          },
          requestWorkspaceId
        )
      );
      applyMutationState(response.data, requestWorkspaceId);
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
    return { ok: true, userId: response.userId };
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

  async function updateEvent(eventId, payload) {
    try {
      const requestWorkspaceId = activeWorkspaceIdRef.current || "";
      const response = await apiPatch(`/api/events/${eventId}`, payload);
      applyMutationState(response.data, requestWorkspaceId);
      return { ok: true };
    } catch (error) {
      return { ok: false, message: error.message };
    }
  }

  async function deleteEvent(eventId) {
    try {
      const requestWorkspaceId = activeWorkspaceIdRef.current || "";
      const response = await apiDelete(`/api/events/${eventId}`);
      applyMutationState(response.data, requestWorkspaceId);
      return { ok: true };
    } catch (error) {
      return { ok: false, message: error.message };
    }
  }

  async function updateWorkspaceAssignments(workspaceId, userIds) {
    try {
      const requestWorkspaceId = activeWorkspaceIdRef.current || "";
      const response = await apiPut(`/api/workspaces/${workspaceId}/assignments`, { userIds });
      applyMutationState(response.data, requestWorkspaceId);
      return { ok: true };
    } catch (error) {
      return { ok: false, message: error.message };
    }
  }

  async function allocateStockToEvent(eventId, items) {
    const requestWorkspaceId = activeWorkspaceIdRef.current || "";
    const response = await apiPost(`/api/events/${eventId}/allocate`, { items });
    applyMutationState(response.data, requestWorkspaceId);
    return { ok: true };
  }

  async function bulkImportProducts(products) {
    const requestWorkspaceId = activeWorkspaceIdRef.current || "";
    const response = await apiPost("/api/products/import", { products });
    applyMutationState(response.data, requestWorkspaceId);
    return { ok: true, created: response.created, errors: response.errors };
  }

  async function uploadImage(base64DataUri) {
    const response = await apiPost("/api/upload/image", { image: base64DataUri });
    return response.url;
  }

  async function getStoreProducts() {
    const response = await apiGet("/api/store-products");
    return response.products || [];
  }

  async function createNewCategory(name) {
    const requestWorkspaceId = activeWorkspaceIdRef.current || "";
    const response = await apiPost("/api/categories", { name });
    applyMutationState(response.data, requestWorkspaceId);
    return { ok: true };
  }

  async function deleteCategory(categoryName) {
    const requestWorkspaceId = activeWorkspaceIdRef.current || "";
    const response = await apiDelete(`/api/categories/${encodeURIComponent(categoryName)}`);
    applyMutationState(response.data, requestWorkspaceId);
    return { ok: true };
  }

  async function renameCategory(oldName, newName) {
    const requestWorkspaceId = activeWorkspaceIdRef.current || "";
    const response = await apiPatch(`/api/categories/${encodeURIComponent(oldName)}`, { newName });
    applyMutationState(response.data, requestWorkspaceId);
    return { ok: true };
  }

  async function getAuditLogs(params = {}) {
    const query = new URLSearchParams();
    if (params.limit) query.set("limit", params.limit);
    if (params.offset) query.set("offset", params.offset);
    if (params.action) query.set("action", params.action);
    if (params.entityType) query.set("entityType", params.entityType);
    const response = await apiGet(`/api/audit-logs?${query.toString()}`);
    return response.logs || [];
  }

  async function getRecycleBin() {
    const response = await apiGet("/api/recycle-bin");
    return { products: response.products || [], sales: response.sales || [], promotions: response.promotions || [] };
  }

  async function restoreFromBin(entityType, entityIds) {
    await apiPost("/api/recycle-bin/restore", { entityType, entityIds });
  }

  async function permanentDeleteFromBin(entityType, entityIds) {
    await apiPost("/api/recycle-bin/delete", { entityType, entityIds });
  }

  async function deleteSale(saleId) {
    const requestWorkspaceId = activeWorkspaceIdRef.current || "";
    const response = await apiDelete(`/api/sales/${saleId}`);
    applyMutationState(response.data, requestWorkspaceId);
    return { ok: true };
  }

  async function deletePromotion(promoId) {
    const requestWorkspaceId = activeWorkspaceIdRef.current || "";
    const response = await apiDelete(`/api/promotions/${promoId}`);
    applyMutationState(response.data, requestWorkspaceId);
    return { ok: true };
  }

  async function bulkDeleteProducts() {
    const requestWorkspaceId = activeWorkspaceIdRef.current || "";
    const response = await apiPost("/api/bulk/delete-products");
    applyMutationState(response.data, requestWorkspaceId);
    return response.count;
  }

  async function bulkDeleteSales() {
    const requestWorkspaceId = activeWorkspaceIdRef.current || "";
    const response = await apiPost("/api/bulk/delete-sales");
    applyMutationState(response.data, requestWorkspaceId);
    return response.count;
  }

  async function bulkResetStock() {
    const requestWorkspaceId = activeWorkspaceIdRef.current || "";
    const response = await apiPost("/api/bulk/reset-stock");
    applyMutationState(response.data, requestWorkspaceId);
  }

  const contextValue = useMemo(() => ({
    ...state,
    variants,
    loading,
    hasLoaded,
    loadError,
    reload,
    createEvent,
    updateEvent,
    deleteEvent,
    updateEventStatus,
    closeEvent,
    createPromotion,
    deletePromotion,
    deleteSale,
    adjustInventory,
    finalizeSale,
    updateSettings,
    createUser,
    updateUser,
    createProduct,
    updateProduct,
    createVariant,
    updateVariant,
    updateWorkspaceAssignments,
    allocateStockToEvent,
    bulkImportProducts,
    getStoreProducts,
    createNewCategory,
    deleteCategory,
    renameCategory,
    uploadImage,
    getAuditLogs,
    getRecycleBin,
    restoreFromBin,
    permanentDeleteFromBin,
    bulkDeleteProducts,
    bulkDeleteSales,
    bulkResetStock,
  }), [state, variants, loading, hasLoaded, loadError]);

  return (
    <PosDataContext.Provider value={contextValue}>
      {children}
    </PosDataContext.Provider>
  );
}

export function usePosData() {
  return useContext(PosDataContext);
}
