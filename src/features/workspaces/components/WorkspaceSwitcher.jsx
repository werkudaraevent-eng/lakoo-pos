import { Link, useLocation } from "react-router-dom";

import { useAuth } from "../../../context/AuthContext";
import { usePosData } from "../../../context/PosDataContext";
import { CHECKOUT_CART_COUNT_STORAGE_KEY } from "../../checkout/checkoutGuards";
import { useWorkspace } from "../../../context/WorkspaceContext";
import { filterAccessibleWorkspaces, shouldConfirmWorkspaceSwitch } from "../workspaceGuards";

function formatWorkspaceType(type) {
  if (type === "event") {
    return "Event";
  }

  if (type === "store") {
    return "Store";
  }

  return "Workspace";
}

function formatWorkspaceStatus(status) {
  if (!status) {
    return "";
  }

  return status.charAt(0).toUpperCase() + status.slice(1);
}

function formatStockMode(stockMode) {
  if (stockMode === "allocate") {
    return "Allocated stock";
  }

  if (stockMode === "manual") {
    return "Manual stock";
  }

  return "";
}

export function WorkspaceSwitcher({ variant = "executive" }) {
  const location = useLocation();
  const { user } = useAuth();
  const { workspaces, loading } = usePosData();
  const { activeWorkspaceId } = useWorkspace();
  const accessibleWorkspaces = filterAccessibleWorkspaces(workspaces, user);
  const activeWorkspace =
    accessibleWorkspaces.find((workspace) => workspace.id === activeWorkspaceId) ??
    workspaces.find((workspace) => workspace.id === activeWorkspaceId) ??
    null;
  const statusLabel = formatWorkspaceStatus(
    activeWorkspace?.eventStatus ?? activeWorkspace?.status
  );
  const stockModeLabel = formatStockMode(activeWorkspace?.stockMode);
  const canSwitch = accessibleWorkspaces.length > 1;

  function handleSwitchClick(event) {
    const cartCount =
      typeof window === "undefined"
        ? 0
        : Number(window.sessionStorage.getItem(CHECKOUT_CART_COUNT_STORAGE_KEY) || 0);
    const requiresConfirm = shouldConfirmWorkspaceSwitch({
      currentPath: location.pathname,
      cartCount: Number.isFinite(cartCount) ? cartCount : 0,
    });

    if (
      requiresConfirm &&
      typeof window !== "undefined" &&
      !window.confirm("The current checkout cart still has items. Switch workspace anyway?")
    ) {
      event.preventDefault();
    }
  }

  if (variant === "banani") {
    return (
      <section className="workspace-card-compact">
        <div className="workspace-header-compact">
          <span className="ws-label">Current Workspace</span>
          <Link
            className="ws-switch"
            onClick={handleSwitchClick}
            to="/workspace/select"
            state={{ from: `${location.pathname}${location.search}` }}
          >
            {canSwitch ? "Switch" : "Open"}
          </Link>
        </div>

        {activeWorkspace ? (
          <>
            <div className="ws-name">{activeWorkspace.name}</div>
            <div className="ws-badges">
              <span className="badge badge-muted">{formatWorkspaceType(activeWorkspace.type)}</span>
              {statusLabel ? <span className="badge badge-success">{statusLabel}</span> : null}
            </div>
            {stockModeLabel ? <button className="btn-outline-full" type="button">{stockModeLabel}</button> : null}
          </>
        ) : (
          <p className="muted-text workspace-switcher-empty">
            {loading ? "Loading workspace..." : "Select a workspace to start."}
          </p>
        )}
      </section>
    );
  }

  return (
    <section className="workspace-switcher workspace-switcher-compact workspace-switcher-executive">
      <div className="workspace-switcher-head workspace-switcher-head-compact">
        <p className="workspace-switcher-label">Current Workspace</p>
        <Link
          className="workspace-switcher-link"
          onClick={handleSwitchClick}
          to="/workspace/select"
          state={{ from: `${location.pathname}${location.search}` }}
        >
          {canSwitch ? "Switch" : "Open"}
        </Link>
      </div>

      {activeWorkspace ? (
        <>
          <strong className="workspace-switcher-name">{activeWorkspace.name}</strong>
          <div className="workspace-switcher-meta">
            <span className="badge-soft">{formatWorkspaceType(activeWorkspace.type)}</span>
            {statusLabel ? <span className="badge-soft">{statusLabel}</span> : null}
          </div>
          {stockModeLabel ? <div className="workspace-switcher-stock-pill">{stockModeLabel}</div> : null}
        </>
      ) : (
        <p className="muted-text workspace-switcher-empty">
          Select a workspace to scope dashboard, sales, and inventory data.
        </p>
      )}
    </section>
  );
}
