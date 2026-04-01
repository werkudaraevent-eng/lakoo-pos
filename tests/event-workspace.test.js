import test from "node:test";
import assert from "node:assert/strict";

import { buildEventRowSummary, buildEventWorkspaceSummary } from "../src/features/events/eventWorkspace.js";

test("buildEventWorkspaceSummary counts events by lifecycle", () => {
  const result = buildEventWorkspaceSummary({
    events: [
      { status: "draft" },
      { status: "active" },
      { status: "active" },
      { status: "closed" },
    ],
  });

  assert.deepEqual(result, {
    totalEvents: 4,
    draftEvents: 1,
    activeEvents: 2,
    closedEvents: 1,
  });
});

test("buildEventRowSummary formats event row labels", () => {
  const result = buildEventRowSummary({
    name: "Bazar PIK",
    locationLabel: "PIK Avenue",
    status: "active",
    stockMode: "allocate",
  });

  assert.deepEqual(result, {
    title: "Bazar PIK",
    subtitle: "PIK Avenue",
    statusLabel: "Active",
    stockModeLabel: "Allocate from main stock",
  });
});
