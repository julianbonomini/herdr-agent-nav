import { ACTIVE_VIEW_SOURCE, activeAgentFilter, socketRequest } from "./herdr.js";

export function setActiveView() {
  return socketRequest("agent.view.set", { source: ACTIVE_VIEW_SOURCE, label: "active agents", filter: activeAgentFilter });
}

export function clearActiveView() {
  return socketRequest("agent.view.clear", { source: ACTIVE_VIEW_SOURCE });
}
