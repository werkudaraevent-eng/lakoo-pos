const BLOCKED_CASHIER_EVENT_STATUSES = new Set(["draft", "closed", "archived"]);

function getWorkspaceStatus(workspace) {
  return workspace?.eventStatus ?? null;
}

function isEventWorkspace(workspace) {
  return workspace?.type === "event";
}

function isAssignedToUser(workspace, userId) {
  if (!userId || !Array.isArray(workspace?.assignedUserIds)) {
    return false;
  }

  return workspace.assignedUserIds.includes(userId);
}

export function getRoleLandingPath(role) {
  return role === "cashier" ? "/checkout" : "/dashboard";
}

export function filterAccessibleWorkspaces(workspaces, user) {
  const safeWorkspaces = Array.isArray(workspaces) ? workspaces : [];

  return safeWorkspaces.filter((workspace) => {
    if (workspace?.isVisible === false) {
      return false;
    }

    if (user?.role === "admin") {
      return true;
    }

    if (!isAssignedToUser(workspace, user?.id)) {
      return false;
    }

    if (
      user?.role === "cashier" &&
      isEventWorkspace(workspace) &&
      BLOCKED_CASHIER_EVENT_STATUSES.has(getWorkspaceStatus(workspace))
    ) {
      return false;
    }

    return true;
  });
}

export function pickWorkspaceRedirect(workspaces) {
  const safeWorkspaces = Array.isArray(workspaces) ? workspaces : [];

  if (safeWorkspaces.length === 1 && safeWorkspaces[0]?.id) {
    const searchParams = new URLSearchParams({
      auto: safeWorkspaces[0].id,
    });

    return `/workspace/select?${searchParams.toString()}`;
  }

  return "/workspace/select";
}

export function shouldConfirmWorkspaceSwitch({
  currentPath,
  cartCount,
  hasPendingEventClosing = false,
}) {
  return (currentPath?.startsWith("/checkout") && cartCount > 0) || Boolean(hasPendingEventClosing);
}
