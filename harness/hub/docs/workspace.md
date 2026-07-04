# Workspace Route

`#/workspace` is a full-bleed AI Workspace surface inside Harness Hub. It mounts
`window.HubWorkspace` into the normal SPA content root, then `app.js` toggles
`body.route-workspace` so the hub header/sidebar are hidden and the workspace
owns the full `100vw x 100vh` viewport.

Real backend wiring:

- Model catalog: `GET /api/chat/models`; the top-bar selector uses the returned
  `catalog` rows and defaults to the returned `default` model.
- Chat: `POST /api/chat` with `{ model, messages }`; assistant output streams
  from SSE `reasoning`, `delta`, `done`, and `error` events.

Client-side mock/demo wiring:

- Files and uploads.
- Artifacts, artifact generation, section actions, versions, context selection,
  and export status.
- Export copy/share/download actions, except copy may use the browser clipboard
  when available.

Route isolation:

- Workspace tokens are scoped to `.ws-root`; HUD tokens in `styles-hub.css` are
  not redefined.
- Leaving `#/workspace` calls `HubWorkspace.unmount()`, aborts any active chat
  stream, clears timers, and removes `body.route-workspace` through the router
  class toggle.
