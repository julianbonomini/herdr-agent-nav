import { spawnSync } from "node:child_process";
import net from "node:net";

export const ACTIVE_VIEW_SOURCE = "plugin:herdr.agent-nav";

export function runHerdr(args) {
  const result = spawnSync(process.env.HERDR_BIN_PATH || "herdr", args, {
    encoding: "utf8",
    stdio: ["ignore", "pipe", "pipe"],
  });
  if (result.error) throw result.error;
  if (result.status !== 0) throw new Error(result.stderr.trim() || `herdr ${args.join(" ")} failed`);
  return result.stdout;
}

export function runHerdrJson(args) {
  const output = runHerdr(args);
  try {
    const response = JSON.parse(output);
    return response.result ?? response;
  } catch {
    throw new Error(`Herdr returned invalid JSON for ${args.join(" ")}: ${output}`);
  }
}

export function focusedPaneId() {
  let pluginContext = {};
  try { pluginContext = JSON.parse(process.env.HERDR_PLUGIN_CONTEXT_JSON || "{}"); } catch { /* use empty context */ }
  return process.env.HERDR_PANE_ID || pluginContext.pane_id || pluginContext.focused_pane?.pane_id || pluginContext.pane?.pane_id;
}

export function socketRequest(method, params) {
  const socketPath = process.env.HERDR_SOCKET_PATH;
  if (!socketPath) throw new Error("HERDR_SOCKET_PATH is unavailable; run this from Herdr.");
  const request = JSON.stringify({ id: `power-tools-${Date.now()}`, method, params });
  return new Promise((resolve, reject) => {
    const socket = net.createConnection(socketPath);
    let buffer = "";
    socket.setEncoding("utf8");
    socket.once("error", reject);
    socket.on("connect", () => socket.write(`${request}\n`));
    socket.on("data", (chunk) => {
      buffer += chunk;
      const newline = buffer.indexOf("\n");
      if (newline === -1) return;
      socket.end();
      try {
        const response = JSON.parse(buffer.slice(0, newline));
        if (response.error) reject(new Error(response.error.message || "Herdr API request failed"));
        else resolve(response.result);
      } catch (error) { reject(error); }
    });
  });
}

export const activeAgentFilter = { op: "not", filter: { op: "eq", field: "status", value: "done" } };
