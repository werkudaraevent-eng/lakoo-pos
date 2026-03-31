import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { usePosData } from "../context/PosDataContext";
import { useWorkspace } from "../context/WorkspaceContext";
import { AppShell } from "../components/AppShell";
import {
  filterAccessibleWorkspaces,
  pickWorkspaceRedirect,
  shouldClearWorkspaceSelection,
} from "../features/workspaces/workspaceGuards";

export function ProtectedRoute({ allow, renderShell = true, requireWorkspace = true }) {
  const { user } = useAuth();
  const { workspaces, loading, hasLoaded, loadError } = usePosData();
  const { activeWorkspaceId, clearWorkspace } = useWorkspace();
  const location = useLocation();
  const accessibleWorkspaces = filterAccessibleWorkspaces(workspaces, user);
  const hasResolvedWorkspace = accessibleWorkspaces.some(
    (workspace) => workspace.id === activeWorkspaceId
  );

  useEffect(() => {
    if (
      requireWorkspace &&
      shouldClearWorkspaceSelection({
        activeWorkspaceId,
        accessibleWorkspaces,
        hasLoaded,
        loadError,
      })
    ) {
      clearWorkspace();
    }
  }, [accessibleWorkspaces, activeWorkspaceId, clearWorkspace, hasLoaded, loadError, requireWorkspace]);

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  if (allow && !allow.includes(user.role)) {
    return <Navigate to="/dashboard" replace />;
  }

  if (requireWorkspace) {
    if (!hasLoaded || loading) {
      return <div style={{ padding: "2rem" }}>Loading workspace...</div>;
    }

    if (loadError) {
      return <div style={{ padding: "2rem" }}>{loadError}</div>;
    }

    if (!hasResolvedWorkspace) {
      return (
        <Navigate
          to={pickWorkspaceRedirect(accessibleWorkspaces)}
          replace
          state={{ from: `${location.pathname}${location.search}` }}
        />
      );
    }
  }

  const content = <Outlet />;

  return renderShell ? <AppShell>{content}</AppShell> : content;
}
