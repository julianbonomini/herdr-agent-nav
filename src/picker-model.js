export function displayName(agent) {
  return agent.name || agent.title || agent.terminal_title_stripped || agent.display_agent || agent.agent || agent.pane_id;
}

export function location(agent) {
  const directory = agent.foreground_cwd || agent.cwd || agent.workspace_id;
  return directory ? `${directory.split("/").filter(Boolean).at(-1) || directory} · ${agent.pane_id}` : agent.pane_id;
}

export function filterAgents(agents, query) {
  const needle = query.trim().toLocaleLowerCase();
  if (!needle) return agents;
  return agents.filter((agent) => [displayName(agent), agent.agent, agent.agent_status, agent.pane_id, agent.cwd, agent.workspace_id]
    .filter(Boolean).join(" ").toLocaleLowerCase().includes(needle));
}
