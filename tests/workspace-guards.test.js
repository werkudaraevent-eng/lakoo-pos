import test from "node:test";
import assert from "node:assert/strict";

import {
  filterAccessibleWorkspaces,
  getRoleLandingPath,
  shouldConfirmWorkspaceSwitch,
} from "../src/features/workspaces/workspaceGuards.js";

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
