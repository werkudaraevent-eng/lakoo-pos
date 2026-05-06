import { useEffect } from "react";
import { Navigate, Outlet, useLocation } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { usePosData } from "../context/PosDataContext";
import { useWorkspace } from "../context/WorkspaceContext";
import { AppShell } from "../components/AppShell";
import { LoadingScreen } from "../components/LoadingScreen";
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
      // Show shell with inline loading — NOT full-page blank
      if (renderShell) {
        return (
          <AppShell>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 24px" }}>
              <div style={{ textAlign: "center" }}>
                <div style={{ width: 32, height: 32, border: "3px solid var(--surface)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 0.8s linear infinite", margin: "0 auto 12px" }} />
                <div style={{ fontSize: 13.5, color: "var(--text-soft)" }}>Memuat data...</div>
                <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
              </div>
            </div>
          </AppShell>
        );
      }
      return <LoadingScreen message="Menyiapkan workspace..." />;
    }

    if (loadError) {
      const errorContent = (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "60px 24px" }}>
          <div style={{ textAlign: "center" }}>
            <div style={{ fontSize: 17, fontWeight: 700, color: "var(--danger)", marginBottom: 8 }}>Gagal Memuat</div>
            <div style={{ fontSize: 13.5, color: "var(--text-soft)" }}>{loadError}</div>
          </div>
        </div>
      );
      if (renderShell) return <AppShell>{errorContent}</AppShell>;
      return errorContent;
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
