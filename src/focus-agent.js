import { runHerdr, socketRequest } from "./herdr.js";

const [workspaceId, tabId, targetPaneId] = process.argv.slice(2);
if (!workspaceId || !tabId || !targetPaneId) process.exit(1);

const directions = ["left", "right", "up", "down"];

async function pathToPane(startPaneId, targetPane) {
  const queue = [{ paneId: startPaneId, path: [] }];
  const seen = new Set([startPaneId]);
  while (queue.length) {
    const { paneId, path } = queue.shift();
    if (paneId === targetPane) return path;
    for (const direction of directions) {
      const result = await socketRequest("pane.neighbor", { pane_id: paneId, direction });
      const neighbor = result.neighbor.neighbor_pane_id;
      if (neighbor && !seen.has(neighbor)) {
        seen.add(neighbor);
        queue.push({ paneId: neighbor, path: [...path, direction] });
      }
    }
  }
  return null;
}

// A popup restores its previous tiled-pane focus while it is closing. Defer
// navigation until that teardown has completed, then move to the selected
// agent's workspace and tab. Herdr has no public focus-by-pane-ID operation,
// so walk its directional neighbor graph to the target pane.
await new Promise((resolve) => setTimeout(resolve, 150));
try {
  runHerdr(["workspace", "focus", workspaceId]);
  runHerdr(["tab", "focus", tabId]);
  const current = await socketRequest("pane.current", {});
  const path = await pathToPane(current.pane.pane_id, targetPaneId);
  if (!path) throw new Error(`no directional path to ${targetPaneId}`);
  let paneId = current.pane.pane_id;
  for (const direction of path) {
    const result = await socketRequest("pane.focus_direction", { pane_id: paneId, direction });
    paneId = result.focus.focused_pane_id;
    if (!paneId) throw new Error(`unable to move ${direction}`);
  }
} catch (error) {
  console.error(`Unable to navigate to ${targetPaneId}: ${error.message}`);
  process.exitCode = 1;
}
