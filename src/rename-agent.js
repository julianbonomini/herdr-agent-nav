import readline from "node:readline";
import { runHerdr, runHerdrJson } from "./herdr.js";

const c = { reset: "\x1b[0m", dim: "\x1b[2m", title: "\x1b[96m", accent: "\x1b[48;5;111m\x1b[30m", error: "\x1b[91m" };
const agent = runHerdrJson(["agent", "list"]).agents.find((candidate) => candidate.focused);
if (!agent) { console.error("The focused pane does not contain an agent."); process.exit(1); }

let value = agent.name || "";
const rawMode = typeof process.stdin.setRawMode === "function";
let message = "";

function render() {
  process.stdout.write("\x1b[2J\x1b[H");
  process.stdout.write(`${c.title}Rename agent${c.reset}\n\n`);
  process.stdout.write(`${value}\x1b[7m \x1b[0m\n\n`);
  process.stdout.write(`${c.accent} ↵ save ${c.reset}  ${c.dim}Ctrl+C clear${c.reset}  ${c.dim}Esc cancel${c.reset}\n`);
  if (message) process.stdout.write(`\n${c.error}${message}${c.reset}\n`);
}

function close() {
  if (rawMode) process.stdin.setRawMode(false);
  process.exit(0);
}

function save() {
  const name = value.trim();
  if (!name) return close();
  try {
    runHerdr(["agent", "rename", agent.pane_id, name]);
    close();
  } catch (error) {
    message = error.message;
    render();
  }
}

function handleKey(key) {
  if (key.name === "return" || key.name === "enter") return save();
  if (key.name === "escape") return close();
  if (key.ctrl && key.name === "c") { value = ""; message = ""; return render(); }
  if (key.name === "backspace") { value = value.slice(0, -1); message = ""; return render(); }
  if (!key.ctrl && !key.meta && key.sequence?.length === 1 && key.sequence >= " ") {
    value += key.sequence;
    message = "";
    render();
  }
}

render();
readline.emitKeypressEvents(process.stdin);
if (rawMode) process.stdin.setRawMode(true);
process.stdin.resume();
process.stdin.on("keypress", (_value, key) => handleKey(key));
process.stdin.on("data", (chunk) => {
  const input = chunk.toString();
  if (input === "\r" || input === "\n") save();
});
