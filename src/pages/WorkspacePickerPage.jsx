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
import "../features/workspaces/workspace-picker.css";

function getNextPath(locationState, user) {
  const requestedPath = typeof locationState?.from === "string" ? locationState.from : "";
  if (requestedPath && !requestedPath.startsWith("/workspace/select")) return requestedPath;
  return getRoleLandingPath(user?.role);
}

export function WorkspacePickerPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { user, logout } = useAuth();
  const { workspaces, settings, loading, hasLoaded, loadError } = usePosData();
  const { activeWorkspaceId, selectWorkspace, clearWorkspace } = useWorkspace();
  const accessibleWorkspaces = filterAccessibleWorkspaces(workspaces, user);
  const pickerOptions = buildWorkspacePickerOptions(accessibleWorkspaces, activeWorkspaceId);
  const autoWorkspaceId = searchParams.get("auto");
  const nextPath = getNextPath(location.state, user);

  const now = new Date();
  const dateStr = now.toLocaleDateString("id-ID", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  useEffect(() => {
    if (shouldClearWorkspaceSelection({ activeWorkspaceId, accessibleWorkspaces, hasLoaded, loadError })) {
      clearWorkspace();
    }
  }, [accessibleWorkspaces, activeWorkspaceId, clearWorkspace, hasLoaded, loadError]);

  useEffect(() => {
    if (loading || !autoWorkspaceId || accessibleWorkspaces.length !== 1) return;
    const workspace = accessibleWorkspaces.find((item) => item.id === autoWorkspaceId);
    if (!workspace) return;
    selectWorkspace(workspace);
    navigate(nextPath, { replace: true });
  }, [accessibleWorkspaces, autoWorkspaceId, loading, navigate, nextPath, selectWorkspace]);

  function handleSelect(workspace) {
    selectWorkspace(workspace);
    navigate(nextPath, { replace: true });
  }

  return (
    <div className="wsp-page">
      {/* Top bar */}
      <div className="wsp-topbar">
        <div className="wsp-topbar-brand">{user?.planLimits?.customBranding && settings?.storeName ? `${settings.storeName}.` : "Lakoo."}</div>
        <div className="wsp-topbar-right">
          <div className="wsp-topbar-user-info">
            <div className="wsp-topbar-user-name">{user?.name || user?.username}</div>
            <div className="wsp-topbar-user-role">{user?.role}</div>
          </div>
          <div className="wsp-topbar-avatar">
            {(user?.name || user?.username || "U").charAt(0).toUpperCase()}
          </div>
          <button className="wsp-topbar-logout" onClick={logout} type="button">Keluar</button>
        </div>
      </div>

      {/* Content */}
      <div className="wsp-center">
        <div className="wsp-inner">
          <div className="wsp-date">{dateStr}</div>
          <h1 className="wsp-title">Pilih Sesi Penjualan</h1>
          <p className="wsp-subtitle">
            Halo, <strong>{user?.name || user?.username}</strong>! Pilih sesi untuk memulai aktivitas hari ini.
          </p>

          {loading ? <div className="wsp-loading" style={{ padding: 24, color: "var(--text-soft)", fontSize: 13.5 }}>Memuat workspace...</div> : null}
          {!loading && loadError ? <div className="wsp-error">{loadError}</div> : null}

          {!loading && !loadError && pickerOptions.length > 0 ? (
            <div className="wsp-grid">
              {pickerOptions.map((workspace) => {
                const isEvent = workspace.typeLabel === "Event";
                return (
                  <button
                    className="wsp-card"
                    key={workspace.id}
                    onClick={() => handleSelect(workspace.id)}
                    type="button"
                  >
                    <div className={`wsp-card-icon ${isEvent ? "is-event" : "is-store"}`}>
                      {isEvent ? (
                        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                          <path d="M4 3h16l-2 7H6L4 3z"/><path d="M6 10v10a1 1 0 001 1h10a1 1 0 001-1V10"/><path d="M9 21v-5a1 1 0 011-1h4a1 1 0 011 1v5"/>
                        </svg>
                      ) : (
                        <svg width="24" height="24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24">
                          <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>
                        </svg>
                      )}
                    </div>
                    <div className="wsp-card-body">
                      <div className="wsp-card-head">
                        <span className="wsp-card-name">{workspace.name}</span>
                        <span className={`wsp-card-badge ${isEvent ? "badge-blue" : "badge-amber"}`}>
                          {isEvent ? "Bazar" : "Toko Tetap"}
                        </span>
                      </div>
                      {workspace.statusLabel ? (
                        <div className="wsp-card-location">{workspace.statusLabel}</div>
                      ) : null}
                    </div>
                    <div className="wsp-card-chevron">
                      <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><polyline points="9 18 15 12 9 6"/></svg>
                    </div>
                  </button>
                );
              })}
            </div>
          ) : null}

          {!loading && !loadError && pickerOptions.length === 0 ? (
            <div className="wsp-empty">Tidak ada workspace yang tersedia.</div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
