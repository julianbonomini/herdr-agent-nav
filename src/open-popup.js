import { runHerdr } from "./herdr.js";

const entrypoint = process.argv[2];
if (!new Set(["picker", "rename"]).has(entrypoint)) throw new Error("Usage: open-popup.js <picker|rename>");
const size = entrypoint === "rename" ? ["--width", "45%", "--height", "7"] : [];
runHerdr(["plugin", "pane", "open", "--plugin", process.env.HERDR_PLUGIN_ID || "herdr.power-tools", "--entrypoint", entrypoint, "--placement", "popup", ...size]);
