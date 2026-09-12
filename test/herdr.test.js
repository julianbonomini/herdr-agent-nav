import test from "node:test";
import assert from "node:assert/strict";
import { activeAgentFilter, focusedPaneId } from "../src/herdr.js";
import { displayName, filterAgents, location } from "../src/picker-model.js";

test("active view excludes only finished agents", () => {
  assert.deepEqual(activeAgentFilter, { op: "not", filter: { op: "eq", field: "status", value: "done" } });
});

test("focusedPaneId uses the direct Herdr pane context", () => {
  const previous = process.env.HERDR_PANE_ID;
  process.env.HERDR_PANE_ID = "w1:p2";
  assert.equal(focusedPaneId(), "w1:p2");
  if (previous === undefined) delete process.env.HERDR_PANE_ID; else process.env.HERDR_PANE_ID = previous;
});

test("picker searches names, status, pane, and location", () => {
  const agents = [
    { name: "fix-auth", agent_status: "working", pane_id: "w1:p1", cwd: "/repo/auth" },
    { agent: "claude", agent_status: "idle", pane_id: "w2:p1", cwd: "/repo/docs" },
  ];
  assert.equal(displayName(agents[0]), "fix-auth");
  assert.equal(location(agents[0]), "auth · w1:p1");
  assert.deepEqual(filterAgents(agents, "docs"), [agents[1]]);
  assert.deepEqual(filterAgents(agents, "working"), [agents[0]]);
  assert.deepEqual(filterAgents(agents, "frontend", () => "frontend"), agents);
});
