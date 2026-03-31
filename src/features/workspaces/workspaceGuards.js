const BLOCKED_CASHIER_EVENT_STATUSES = new Set(["draft", "closed", "archived"]);

function resolveUserId(user) {
  return user?.id ?? user?.userId ?? user?.username ?? null;
}

function getWorkspaceStatus(workspace) {
  return workspace?.eventStatus ?? workspace?.status ?? null;
}

function isAssignedToUser(workspace, userId) {
  if (!userId) {
    return false;
  }

  if (Array.isArray(workspace?.assignedUserIds)) {
    return workspace.assignedUserIds.includes(userId);
  }

  if (workspace?.assignedUserId) {
    return workspace.assignedUserId === userId;
  }

  if (Array.isArray(workspace?.assignedUsers)) {
    return workspace.assignedUsers.some((assignedUser) => {
      if (typeof assignedUser === "string") {
        return assignedUser === userId;
      }

      return resolveUserId(assignedUser) === userId;
    });
  }

  return false;
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

    if (!isAssignedToUser(workspace, resolveUserId(user))) {
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
