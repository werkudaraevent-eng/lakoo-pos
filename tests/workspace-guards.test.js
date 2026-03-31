import test from "node:test";
import assert from "node:assert/strict";

import {
  filterAccessibleWorkspaces,
  getRoleLandingPath,
  pickWorkspaceRedirect,
  shouldClearWorkspaceSelection,
  shouldConfirmWorkspaceSwitch,
} from "../src/features/workspaces/workspaceGuards.js";
import { withActiveWorkspace } from "../src/api/client.js";

test("getRoleLandingPath sends cashiers to checkout and everyone else to dashboard", () => {
  assert.equal(getRoleLandingPath("cashier"), "/checkout");
  assert.equal(getRoleLandingPath("admin"), "/dashboard");
  assert.equal(getRoleLandingPath("manager"), "/dashboard");
});

test("filterAccessibleWorkspaces hides invisible workspaces and blocks unassigned non-admins", () => {
  const workspaces = [
    { id: "ws-1", isVisible: true, assignedUserIds: ["user-1"], eventStatus: "active" },
    { id: "ws-2", isVisible: true, assignedUserIds: [], eventStatus: "active" },
    { id: "ws-3", isVisible: false, assignedUserIds: ["user-1"], eventStatus: "active" },
  ];

  const result = filterAccessibleWorkspaces(workspaces, {
    id: "user-1",
    role: "manager",
  });

  assert.deepEqual(result.map((workspace) => workspace.id), ["ws-1"]);
});

test("filterAccessibleWorkspaces lets admin see all visible workspaces regardless of assignment", () => {
  const workspaces = [
    { id: "ws-1", isVisible: true, assignedUserIds: [], eventStatus: "active" },
    { id: "ws-2", isVisible: true, assignedUserIds: ["user-2"], eventStatus: "draft" },
    { id: "ws-3", isVisible: false, assignedUserIds: [], eventStatus: "active" },
  ];

  const result = filterAccessibleWorkspaces(workspaces, {
    id: "admin-1",
    role: "admin",
  });

  assert.deepEqual(result.map((workspace) => workspace.id), ["ws-1", "ws-2"]);
});

test("filterAccessibleWorkspaces blocks cashiers from draft closed and archived event workspaces", () => {
  const workspaces = [
    { id: "ws-draft", type: "event", isVisible: true, assignedUserIds: ["cashier-1"], eventStatus: "draft" },
    { id: "ws-closed", type: "event", isVisible: true, assignedUserIds: ["cashier-1"], eventStatus: "closed" },
    {
      id: "ws-archived",
      type: "event",
      isVisible: true,
      assignedUserIds: ["cashier-1"],
      eventStatus: "archived",
    },
    { id: "ws-active", type: "event", isVisible: true, assignedUserIds: ["cashier-1"], eventStatus: "active" },
  ];

  const result = filterAccessibleWorkspaces(workspaces, {
    id: "cashier-1",
    role: "cashier",
  });

  assert.deepEqual(result.map((workspace) => workspace.id), ["ws-active"]);
});

test("filterAccessibleWorkspaces does not block non-event workspaces with event statuses", () => {
  const workspaces = [
    { id: "ws-store", type: "store", isVisible: true, assignedUserIds: ["cashier-1"], eventStatus: "draft" },
  ];

  const result = filterAccessibleWorkspaces(workspaces, {
    id: "cashier-1",
    role: "cashier",
  });

  assert.deepEqual(result.map((workspace) => workspace.id), ["ws-store"]);
});

test("filterAccessibleWorkspaces normalizes nullish and non-array workspaces to an empty list", () => {
  assert.deepEqual(filterAccessibleWorkspaces(null, { id: "user-1", role: "manager" }), []);
  assert.deepEqual(filterAccessibleWorkspaces(undefined, { id: "user-1", role: "manager" }), []);
  assert.deepEqual(filterAccessibleWorkspaces("not-an-array", { id: "user-1", role: "manager" }), []);
});

test("shouldConfirmWorkspaceSwitch returns a strict boolean when pending event closing is omitted", () => {
  assert.equal(
    shouldConfirmWorkspaceSwitch({
      currentPath: "/dashboard",
      cartCount: 0,
    }),
    false
  );
});

test("shouldConfirmWorkspaceSwitch requires confirmation for checkout with cart items and pending event closing otherwise", () => {
  assert.equal(
    shouldConfirmWorkspaceSwitch({
      currentPath: "/checkout",
      cartCount: 1,
      hasPendingEventClosing: false,
    }),
    true
  );

  assert.equal(
    shouldConfirmWorkspaceSwitch({
      currentPath: "/dashboard",
      cartCount: 1,
      hasPendingEventClosing: true,
    }),
    true
  );

  assert.equal(
    shouldConfirmWorkspaceSwitch({
      currentPath: "/dashboard",
      cartCount: 0,
      hasPendingEventClosing: false,
    }),
    false
  );
});

test("pickWorkspaceRedirect sends users with one workspace to the auto-select route", () => {
  assert.equal(pickWorkspaceRedirect([{ id: "ws-1" }]), "/workspace/select?auto=ws-1");
});

test("pickWorkspaceRedirect sends users with multiple workspaces to the picker without auto selection", () => {
  assert.equal(
    pickWorkspaceRedirect([
      { id: "ws-1" },
      { id: "ws-2" },
    ]),
    "/workspace/select"
  );
});

test("pickWorkspaceRedirect falls back to the picker route when no workspaces are available", () => {
  assert.equal(pickWorkspaceRedirect([]), "/workspace/select");
});

test("shouldClearWorkspaceSelection keeps the saved workspace on load errors", () => {
  assert.equal(
    shouldClearWorkspaceSelection({
      activeWorkspaceId: "ws-1",
      accessibleWorkspaces: [],
      hasLoaded: true,
      loadError: "Network error",
    }),
    false
  );
});

test("shouldClearWorkspaceSelection clears the saved workspace only after a successful load proves it invalid", () => {
  assert.equal(
    shouldClearWorkspaceSelection({
      activeWorkspaceId: "ws-missing",
      accessibleWorkspaces: [{ id: "ws-1" }],
      hasLoaded: true,
      loadError: "",
    }),
    true
  );
});

test("withActiveWorkspace forces the current workspace id into workspace-scoped mutation payloads", () => {
  assert.deepEqual(
    withActiveWorkspace(
      {
        cart: [{ variantId: "var-1", quantity: 2 }],
        workspaceId: "stale-workspace",
      },
      "ws-active"
    ),
    {
      cart: [{ variantId: "var-1", quantity: 2 }],
      workspaceId: "ws-active",
    }
  );
});
