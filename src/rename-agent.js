import readline from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { focusedPaneId, runHerdr } from "./herdr.js";

const paneId = focusedPaneId();
if (!paneId) { console.error("No focused pane was supplied by Herdr."); process.exit(1); }
const prompt = readline.createInterface({ input: stdin, output: stdout });
try {
  const name = (await prompt.question("New agent name (blank cancels): ")).trim();
  if (name) { runHerdr(["agent", "rename", paneId, name]); console.log(`Renamed ${paneId} to ${name}.`); }
} finally { prompt.close(); }
