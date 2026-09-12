import readline from "node:readline";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { runHerdrJson } from "./herdr.js";
import { displayName, filterAgents, location } from "./picker-model.js";

const c = { reset: "\x1b[0m", dim: "\x1b[2m", blue: "\x1b[94m", green: "\x1b[92m", yellow: "\x1b[93m", red: "\x1b[91m", gray: "\x1b[90m", selected: "\x1b[48;5;24m\x1b[97m" };
const statusColor = { working: c.green, blocked: c.red, idle: c.yellow, unknown: c.gray };
const pad = (value, width) => `${value}`.slice(0, width).padEnd(width);
const trim = (value, width) => value.length > width ? `${value.slice(0, Math.max(0, width - 1))}…` : value;

let allAgents;
try { allAgents = runHerdrJson(["agent", "list"]).agents.filter((agent) => agent.agent_status !== "done"); }
catch (error) { console.error(`Unable to list agents: ${error.message}`); process.exit(1); }
let workspaceLabels = new Map();
try {
  workspaceLabels = new Map(runHerdrJson(["workspace", "list"]).workspaces
    .map((workspace) => [workspace.workspace_id, workspace.label]));
} catch { /* Workspace IDs remain a useful fallback. */ }
const space = (agent) => workspaceLabels.get(agent.workspace_id) || agent.workspace_id;

let query = "";
let selected = Math.max(0, allAgents.findIndex((agent) => agent.focused));
let visible = [];
const rawMode = typeof process.stdin.setRawMode === "function";
let isFocusing = false;

function refreshVisible() {
  visible = filterAgents(allAgents, query, space);
  selected = Math.min(selected, Math.max(visible.length - 1, 0));
}

function render() {
  refreshVisible();
  const columns = process.stdout.columns || 100;
  const nameWidth = Math.max(18, Math.min(36, Math.floor(columns * 0.28)));
  const spaceWidth = Math.max(14, Math.min(28, Math.floor(columns * 0.22)));
  const statusWidth = 9;
  const locationWidth = Math.max(14, columns - nameWidth - spaceWidth - statusWidth - 10);
  process.stdout.write("\x1b[2J\x1b[H");
  process.stdout.write(`${c.blue}Active agents${c.reset}\n`);
  process.stdout.write(`${c.dim}Search:${c.reset} ${query || `${c.gray}type to filter…${c.reset}`}\n`);
  process.stdout.write(`${c.dim}↑/↓ or j/k select  ·  Enter open tab  ·  Esc close${c.reset}\n\n`);
  process.stdout.write(`${c.dim}  ${pad("AGENT", nameWidth)} ${pad("SPACE", spaceWidth)} ${pad("LOCATION", locationWidth)} STATUS${c.reset}\n`);
  if (!visible.length) return process.stdout.write(`\n  ${c.gray}No active agents match “${query}”.${c.reset}\n`);
  const groups = new Map();
  visible.forEach((agent) => {
    const group = space(agent);
    groups.set(group, [...(groups.get(group) || []), agent]);
  });
  for (const [spaceName, agents] of groups) {
    process.stdout.write(`\n${c.blue}▾ ${spaceName}${c.reset} ${c.dim}(${agents.length})${c.reset}\n`);
    agents.forEach((agent) => {
      const index = visible.indexOf(agent);
      const name = pad(trim(displayName(agent), nameWidth), nameWidth);
      const spaceNameCell = pad(trim(space(agent), spaceWidth), spaceWidth);
      const status = pad(agent.agent_status, statusWidth);
      const place = trim(location(agent), locationWidth);
      if (index === selected) process.stdout.write(`${c.selected}› ${name} ${spaceNameCell} ${pad(place, locationWidth)} ${status}${c.reset}\n`);
      else process.stdout.write(`  ${name} ${c.dim}${spaceNameCell} ${pad(place, locationWidth)}${c.reset} ${statusColor[agent.agent_status] || c.gray}${status}${c.reset}\n`);
    });
  }
}

function restoreTerminal() {
  if (rawMode) process.stdin.setRawMode(false);
}

function close() { restoreTerminal(); process.exit(0); }
function focusSelected() {
  if (!visible[selected] || isFocusing) return;
  isFocusing = true;
  restoreTerminal();
  try {
    const helper = fileURLToPath(new URL("./focus-agent.js", import.meta.url));
    const target = visible[selected];
    const child = spawn(process.execPath, [helper, target.workspace_id, target.tab_id, target.pane_id], {
      detached: true,
      stdio: "ignore",
      env: process.env,
    });
    child.unref();
    process.exit(0);
  } catch (error) {
    isFocusing = false;
    process.stdout.write(`\n${c.red}Unable to focus ${visible[selected].pane_id}: ${error.message}${c.reset}\n`);
  }
}
function move(amount) { if (visible.length) { selected = (selected + amount + visible.length) % visible.length; render(); } }
function handleKey(key) {
  if (key.name === "up" || key.name === "k") return move(-1);
  if (key.name === "down" || key.name === "j") return move(1);
  if (key.name === "return" || key.name === "enter") return focusSelected();
  if (key.name === "escape" || key.name === "q" || (key.ctrl && key.name === "c")) return close();
  if (key.name === "backspace") { query = query.slice(0, -1); selected = 0; return render(); }
  if (!key.ctrl && !key.meta && key.sequence?.length === 1 && key.sequence >= " ") { query += key.sequence; selected = 0; render(); }
}
render();
readline.emitKeypressEvents(process.stdin);
if (rawMode) {
  process.stdin.setRawMode(true);
}
process.stdin.resume();
process.stdin.on("keypress", (_value, key) => handleKey(key));
// Some terminal hosts deliver Enter as raw carriage return without a readline
// keypress. Keep this narrow fallback for Herdr popup panes.
process.stdin.on("data", (chunk) => {
  const input = chunk.toString();
  if (input === "\r" || input === "\n") focusSelected();
});
