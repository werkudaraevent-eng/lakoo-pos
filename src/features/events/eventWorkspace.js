import { getEventActionLabel } from "./eventHelpers.js";

function formatStatusLabel(status) {
  if (!status) {
    return "Unknown";
  }

  return status.charAt(0).toUpperCase() + status.slice(1);
}

export function buildEventWorkspaceSummary({ events = [] } = {}) {
  return events.reduce(
    (summary, event) => {
      summary.totalEvents += 1;

      if (event.status === "draft") {
        summary.draftEvents += 1;
      } else if (event.status === "active") {
        summary.activeEvents += 1;
      } else if (event.status === "closed") {
        summary.closedEvents += 1;
      }

      return summary;
    },
    {
      totalEvents: 0,
      draftEvents: 0,
      activeEvents: 0,
      closedEvents: 0,
    }
  );
}

export function buildEventRowSummary(event = {}) {
  return {
    title: event.name || "Untitled event",
    subtitle: event.locationLabel || "Location pending",
    statusLabel: formatStatusLabel(event.status),
    stockModeLabel: getEventActionLabel(event.stockMode),
  };
}
