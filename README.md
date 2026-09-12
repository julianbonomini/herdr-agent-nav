# Herdr Power Tools

Opinionated, keyboard-first quality-of-life tools for [Herdr](https://herdr.dev): a little more like a well-tuned tmux workflow, without changing Herdr itself.

## What works today

| Tool | What it does | Suggested binding |
| --- | --- | --- |
| Active-agent view | Toggles the built-in Agents sidebar to hide finished agents. This also scopes Herdr's next/previous and indexed agent navigation. | `prefix+g` |
| Active-agent picker | Opens a keyboard picker containing only non-finished agents and navigates to their workspace and tab. | `prefix+g` (instead of the view toggle, if preferred) |
| Rename current agent | Opens a small prompt and gives the focused agent a durable display name. | `prefix+r` |

Requires Herdr **0.9.0+** and Node.js **18+**. The plugin has no npm dependencies and currently supports macOS and Linux.

## Install

From GitHub after publishing:

```sh
herdr plugin install julianbonomini/herdr-power-tools
```

For local development:

```sh
herdr plugin link "$(pwd)"
```

Then add the desired bindings from [`config.example.toml`](config.example.toml) to `~/.config/herdr/config.toml`, and reload Herdr's configuration.

## How active-agent mode behaves

Herdr treats an agent as `done` when it is idle and has not yet been seen. The active view hides only that status; working, blocked, idle, and unknown agents remain available. The view survives a Herdr server restart when it was enabled, and it only clears the projection owned by this plugin.

The picker uses the same definition. Press `↑`/`↓` (or `j`/`k`) and `Enter` to open the selected agent's workspace and tab; press `Esc` or `q` to cancel. Herdr's public API does not currently provide focus-by-pane-ID, so a tab containing multiple panes restores its own last selected pane.

## Deliberately not implemented

Herdr's plugin v1 API can declare actions and terminal popups, but it cannot intercept raw key events or render/resize native UI. That means these ideas need an upstream Herdr feature rather than a plugin workaround:

- `Leader + L L L` key-sequence repetition
- temporarily widening the native sidebar or native hover tooltips
- changing results in Herdr's global search

The active-agent view is native and therefore affects the sidebar, agent navigation, and indexed focus without reimplementing any UI. This is the better boundary to use while the plugin API remains manifest-based.

## Development

```sh
npm test
herdr plugin link "$(pwd)"
herdr plugin action invoke herdr.power-tools.toggle-active-view
```

Inspect plugin command logs with:

```sh
herdr plugin log list --plugin herdr.power-tools --limit 20
```

## Publishing

Push a tagged release, add the `herdr-plugin` GitHub topic, and the Herdr marketplace can discover this repository automatically. Users then install it with `herdr plugin install julianbonomini/herdr-power-tools`.

## License

[MIT](LICENSE)
