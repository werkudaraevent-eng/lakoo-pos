import { useEffect } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { usePosData } from "../context/PosDataContext";
import { useWorkspace } from "../context/WorkspaceContext";
import { buildWorkspacePickerOptions } from "../features/workspaces/workspacePicker";
import {
  filterAccessibleWorkspaces,
  getRoleLandingPath,
  shouldClearWorkspaceSelection,
} from "../features/workspaces/workspaceGuards";

function getNextPath(locationState, user) {
  const requestedPath = typeof locationState?.from === "string" ? locationState.from : "";

  if (requestedPath && !requestedPath.startsWith("/workspace/select")) {
    return requestedPath;
  }

  return getRoleLandingPath(user?.role);
}

function getUserInitial(user) {
  const source = user?.name || user?.username || "U";
  return source.charAt(0).toUpperCase();
}

export function WorkspacePickerPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user, logout } = useAuth();
  const { workspaces, loading, hasLoaded, loadError } = usePosData();
  const { activeWorkspaceId, selectWorkspace, clearWorkspace } = useWorkspace();
  const accessibleWorkspaces = filterAccessibleWorkspaces(workspaces, user);
  const pickerOptions = buildWorkspacePickerOptions(accessibleWorkspaces, activeWorkspaceId);
  const autoWorkspaceId = searchParams.get("auto");
  const nextPath = getNextPath(location.state, user);

  useEffect(() => {
    if (
      shouldClearWorkspaceSelection({
        activeWorkspaceId,
        accessibleWorkspaces,
        hasLoaded,
        loadError,
      })
    ) {
      clearWorkspace();
    }
  }, [accessibleWorkspaces, activeWorkspaceId, clearWorkspace, hasLoaded, loadError]);

  useEffect(() => {
    if (loading || !autoWorkspaceId || accessibleWorkspaces.length !== 1) {
      return;
    }

    const workspace = accessibleWorkspaces.find((item) => item.id === autoWorkspaceId);

    if (!workspace) {
      return;
    }

    selectWorkspace(workspace);
    navigate(nextPath, { replace: true });
  }, [accessibleWorkspaces, autoWorkspaceId, loading, navigate, nextPath, selectWorkspace]);

  function handleSelect(workspace) {
    selectWorkspace(workspace);
    navigate(nextPath, { replace: true });
  }

  return (
    <div className="workspace-picker-page">
      <div className="workspace-picker-container">
        <div className="workspace-picker-brand">
          <div className="workspace-picker-brand-icon">L</div>
          <div className="workspace-picker-brand-copy">
            <p className="workspace-picker-brand-title">Lakoo</p>
            <p className="workspace-picker-brand-subtitle">POS</p>
          </div>
        </div>

        <section className="workspace-picker-card">
          <header className="workspace-picker-card-header">
            <div className="workspace-picker-user-badge">
              <div className="workspace-picker-user-avatar">{getUserInitial(user)}</div>
              <div className="workspace-picker-user-text">
                Signed in as <strong>{user?.role || "user"}</strong>
              </div>
            </div>

            <h1>Select workspace</h1>
            <p className="workspace-picker-subtitle">
              Choose the workspace you want to use for this session. You can switch again later.
            </p>
          </header>

          <div className="workspace-picker-card-body">
            {loading ? <p className="workspace-picker-message">Loading workspaces...</p> : null}
            {!loading && loadError ? <p className="workspace-picker-message error-text">{loadError}</p> : null}
            {!loading && !loadError && pickerOptions.length === 0 ? (
              <p className="workspace-picker-message">No workspaces are available for your account.</p>
            ) : null}

            {!loading && !loadError && pickerOptions.length > 0 ? (
              <div className="workspace-picker-list">
                {pickerOptions.map((workspace) => (
                  <button
                    className={`workspace-picker-item${workspace.isCurrent ? " is-current" : ""}`}
                    key={workspace.id}
                    onClick={() => handleSelect(workspace.id)}
                    type="button"
                  >
                    <div className={`workspace-picker-item-badge${workspace.typeLabel === 'Event' ? ' is-event' : ''}`}>
                      {workspace.typeLabel === 'Event' ? '🎪' : '🏪'}
                    </div>
                    <div className="workspace-picker-item-copy">
                      <div className="workspace-picker-item-head">
                        <strong>{workspace.name}</strong>
                        {workspace.isCurrent ? <span className="workspace-picker-current">Current</span> : null}
                      </div>
                      <div className="workspace-picker-item-meta">
                        <span className="workspace-picker-chip">{workspace.typeLabel}</span>
                        {workspace.statusLabel ? (
                          <span className="workspace-picker-chip">{workspace.statusLabel}</span>
                        ) : null}
                      </div>
                    </div>
                    <span className="workspace-picker-chevron">/</span>
                  </button>
                ))}
              </div>
            ) : null}
          </div>

          <footer className="workspace-picker-card-footer">
            <button className="workspace-picker-logout" onClick={logout} type="button">
              Log out and return to sign in
            </button>
          </footer>
        </section>
      </div>
    </div>
  );
}
