function formatLabel(value) {
  if (!value) {
    return "";
  }

  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getTypeLabel(type) {
  if (type === "store") {
    return "Store";
  }

  if (type === "event") {
    return "Event";
  }

  return "Workspace";
}

function getBadgeLabel(type) {
  if (type === "store") {
    return "ST";
  }

  if (type === "event") {
    return "EV";
  }

  return "WS";
}

export function buildWorkspacePickerOptions(workspaces, activeWorkspaceId) {
  const safeWorkspaces = Array.isArray(workspaces) ? workspaces : [];

  return safeWorkspaces.map((workspace) => ({
    id: workspace.id,
    name: workspace.name || workspace.id,
    typeLabel: getTypeLabel(workspace.type),
    statusLabel: formatLabel(workspace.eventStatus ?? workspace.status),
    badgeLabel: getBadgeLabel(workspace.type),
    isCurrent: workspace.id === activeWorkspaceId,
  }));
}
