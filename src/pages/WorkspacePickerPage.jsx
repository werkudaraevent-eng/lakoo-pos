import { useEffect } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";

import { useAuth } from "../context/AuthContext";
import { usePosData } from "../context/PosDataContext";
import { useWorkspace } from "../context/WorkspaceContext";
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

export function WorkspacePickerPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const { workspaces, loading, hasLoaded, loadError } = usePosData();
  const { activeWorkspaceId, selectWorkspace, clearWorkspace } = useWorkspace();
  const accessibleWorkspaces = filterAccessibleWorkspaces(workspaces, user);
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
    <section style={{ maxWidth: "36rem", margin: "0 auto", padding: "2rem 1rem" }}>
      <h1>Select workspace</h1>
      <p>Choose the workspace you want to use for this session.</p>

      {loading ? <p>Loading workspaces...</p> : null}
      {!loading && loadError ? <p>{loadError}</p> : null}
      {!loading && !loadError && accessibleWorkspaces.length === 0 ? (
        <p>No workspaces are available for your account.</p>
      ) : null}

      {!loading && !loadError && accessibleWorkspaces.length > 0 ? (
        <ul style={{ listStyle: "none", padding: 0, margin: "1.5rem 0 0", display: "grid", gap: "0.75rem" }}>
          {accessibleWorkspaces.map((workspace) => (
            <li key={workspace.id}>
              <button
                type="button"
                onClick={() => handleSelect(workspace)}
                style={{
                  width: "100%",
                  textAlign: "left",
                  padding: "0.9rem 1rem",
                  border: "1px solid #d4d4d8",
                  borderRadius: "0.75rem",
                  background: "#fff",
                  cursor: "pointer",
                }}
              >
                <strong>{workspace.name || workspace.id}</strong>
                <div>{workspace.type || "workspace"}</div>
                {activeWorkspaceId === workspace.id ? <div>Current selection</div> : null}
              </button>
            </li>
          ))}
        </ul>
      ) : null}
    </section>
  );
}
