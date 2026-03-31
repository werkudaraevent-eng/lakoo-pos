import { createContext, useContext, useEffect, useState } from "react";

const WorkspaceContext = createContext(null);

const ACTIVE_WORKSPACE_STORAGE_KEY = "pos-active-workspace-id";
const WORKSPACE_CLEAR_EVENT = "pos:workspace-cleared";

function readStoredWorkspaceId() {
  if (typeof window === "undefined") {
    return "";
  }

  return window.localStorage.getItem(ACTIVE_WORKSPACE_STORAGE_KEY) || "";
}

export function clearStoredWorkspaceSelection() {
  if (typeof window === "undefined") {
    return;
  }

  window.localStorage.removeItem(ACTIVE_WORKSPACE_STORAGE_KEY);
  window.dispatchEvent(new CustomEvent(WORKSPACE_CLEAR_EVENT));
}

export function WorkspaceProvider({ children }) {
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(() => readStoredWorkspaceId());

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (activeWorkspaceId) {
      window.localStorage.setItem(ACTIVE_WORKSPACE_STORAGE_KEY, activeWorkspaceId);
    } else {
      window.localStorage.removeItem(ACTIVE_WORKSPACE_STORAGE_KEY);
    }
  }, [activeWorkspaceId]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    function handleStorage(event) {
      if (event.key && event.key !== ACTIVE_WORKSPACE_STORAGE_KEY) {
        return;
      }

      setActiveWorkspaceId(event.newValue || "");
    }

    function handleWorkspaceClear() {
      setActiveWorkspaceId("");
    }

    window.addEventListener("storage", handleStorage);
    window.addEventListener(WORKSPACE_CLEAR_EVENT, handleWorkspaceClear);

    return () => {
      window.removeEventListener("storage", handleStorage);
      window.removeEventListener(WORKSPACE_CLEAR_EVENT, handleWorkspaceClear);
    };
  }, []);

  function selectWorkspace(nextWorkspace) {
    const nextWorkspaceId =
      typeof nextWorkspace === "string" ? nextWorkspace : nextWorkspace?.id ?? "";

    // Route all selection changes through one helper so guarded switching can hook in later.
    setActiveWorkspaceId(nextWorkspaceId);
    return nextWorkspaceId;
  }

  function clearWorkspace() {
    clearStoredWorkspaceSelection();
  }

  return (
    <WorkspaceContext.Provider
      value={{
        activeWorkspaceId,
        hasActiveWorkspace: Boolean(activeWorkspaceId),
        selectWorkspace,
        clearWorkspace,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const value = useContext(WorkspaceContext);

  if (!value) {
    throw new Error("useWorkspace must be used within a WorkspaceProvider.");
  }

  return value;
}
