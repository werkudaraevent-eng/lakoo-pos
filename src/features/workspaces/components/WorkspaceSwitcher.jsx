import { Link, useLocation } from "react-router-dom";

import { useAuth } from "../../../context/AuthContext";
import { usePosData } from "../../../context/PosDataContext";
import { useWorkspace } from "../../../context/WorkspaceContext";
import { filterAccessibleWorkspaces } from "../workspaceGuards";

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

export function WorkspaceSwitcher() {
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

  return (
    <section className="workspace-switcher">
      <div className="workspace-switcher-head">
        <div>
          <p className="eyebrow">Current Workspace</p>
          <strong className="workspace-switcher-title">
            {activeWorkspace?.name || (loading ? "Loading workspace..." : "No workspace selected")}
          </strong>
        </div>

        <Link
          className="secondary-button small-button workspace-switcher-button"
          to="/workspace/select"
          state={{ from: `${location.pathname}${location.search}` }}
        >
          {canSwitch ? "Switch" : "Open"}
        </Link>
      </div>

      {activeWorkspace ? (
        <div className="workspace-switcher-meta">
          <span className="badge-soft">{formatWorkspaceType(activeWorkspace.type)}</span>
          {statusLabel ? <span className="badge-soft">{statusLabel}</span> : null}
          {stockModeLabel ? <span className="badge-soft">{stockModeLabel}</span> : null}
        </div>
      ) : (
        <p className="muted-text workspace-switcher-empty">
          Select a workspace to scope dashboard, sales, and inventory data.
        </p>
      )}
    </section>
  );
}
