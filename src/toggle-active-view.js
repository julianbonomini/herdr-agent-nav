import { existsSync, mkdirSync, rmSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { clearActiveView, setActiveView } from "./active-view.js";

const stateFile = join(process.env.HERDR_PLUGIN_STATE_DIR || ".", "active-view-enabled");
try {
  if (existsSync(stateFile)) {
    await clearActiveView();
    rmSync(stateFile);
    console.log("Active-agent view disabled.");
  } else {
    await setActiveView();
    mkdirSync(dirname(stateFile), { recursive: true });
    writeFileSync(stateFile, "enabled\n");
    console.log("Active-agent view enabled.");
  }
} catch (error) {
  console.error(`Unable to toggle active-agent view: ${error.message}`);
  process.exitCode = 1;
}
