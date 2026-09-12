import readline from "node:readline/promises";
import { stdin, stdout } from "node:process";
import { runHerdr, runHerdrJson } from "./herdr.js";

const agent = runHerdrJson(["agent", "list"]).agents.find((candidate) => candidate.focused);
if (!agent) { console.error("The focused pane does not contain an agent."); process.exit(1); }
const paneId = agent.pane_id;
const prompt = readline.createInterface({ input: stdin, output: stdout });
try {
  const name = (await prompt.question("Agent name (lowercase, - or _, blank cancels): ")).trim();
  if (name) { runHerdr(["agent", "rename", paneId, name]); console.log(`Renamed ${paneId} to ${name}.`); }
} finally { prompt.close(); }
