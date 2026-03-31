const BLOCKED_CASHIER_EVENT_STATUSES = new Set(["draft", "closed", "archived"]);

function getWorkspaceStatus(workspace) {
  return workspace?.eventStatus ?? null;
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
  return workspaces.filter((workspace) => {
    if (workspace?.isVisible === false) {
      return false;
    }

    if (user?.role === "admin") {
      return true;
    }

    if (!isAssignedToUser(workspace, user?.id)) {
      return false;
    }

    if (user?.role === "cashier" && BLOCKED_CASHIER_EVENT_STATUSES.has(getWorkspaceStatus(workspace))) {
      return false;
    }

    return true;
  });
}

export function shouldConfirmWorkspaceSwitch({ currentPath, cartCount, hasPendingEventClosing }) {
  if (currentPath?.startsWith("/checkout") && cartCount > 0) {
    return true;
  }

  return hasPendingEventClosing;
}
