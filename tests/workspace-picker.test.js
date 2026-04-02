import test from "node:test";
import assert from "node:assert/strict";

import { buildWorkspacePickerOptions } from "../src/features/workspaces/workspacePicker.js";

test("buildWorkspacePickerOptions formats premium picker rows with type and status", () => {
  const result = buildWorkspacePickerOptions(
    [
      { id: "store-main", name: "Main Store", type: "store", status: "active" },
      { id: "event-gi", name: "Bazar GI", type: "event", eventStatus: "active" },
    ],
    "event-gi"
  );

  assert.deepEqual(result, [
    {
      id: "store-main",
      name: "Main Store",
      typeLabel: "Store",
      statusLabel: "Active",
      badgeLabel: "ST",
      isCurrent: false,
    },
    {
      id: "event-gi",
      name: "Bazar GI",
      typeLabel: "Event",
      statusLabel: "Active",
      badgeLabel: "EV",
      isCurrent: true,
    },
  ]);
});

test("buildWorkspacePickerOptions tolerates missing names and statuses", () => {
  const result = buildWorkspacePickerOptions([{ id: "ws-1", type: "unknown" }], "");

  assert.deepEqual(result, [
    {
      id: "ws-1",
      name: "ws-1",
      typeLabel: "Workspace",
      statusLabel: "",
      badgeLabel: "WS",
      isCurrent: false,
    },
  ]);
});
