import { existsSync } from "node:fs";
import { join } from "node:path";
import { setActiveView } from "./active-view.js";

if (existsSync(join(process.env.HERDR_PLUGIN_STATE_DIR || ".", "active-view-enabled"))) {
  try { await setActiveView(); }
  catch (error) { console.error(`Unable to restore active-agent view: ${error.message}`); process.exitCode = 1; }
}
