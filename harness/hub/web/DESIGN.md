# Design System: Harness Hub (control-plane HUD)

Agent-facing design contract for the Harness Hub web UI
(`harness/hub/web/`). Read this before any UI edit. Keep it current: when a
real design decision changes, update this file, do not fork the style.

## 1. Visual Theme & Atmosphere

A calm, dense **control-plane / HUD**. Two zones:

- **Chrome (dark):** the top status bar and the left sidebar nav. Near-navy,
  quiet, instrument-like. This is what gives the "HUD" feel.
- **Content (light):** the page body keeps the existing McKinsey light system
  (white cards, navy headings) so the 12 data pages stay readable and the
  shared `styles.css` / html-kit stays intact.

Operational, scan-first, no decorative UI. Metrics read like instruments
(monospace, status dots), not like prose.

## 2. Color Palette & Roles

Reuse `styles.css` `:root` tokens for content. Add a HUD token layer in
`styles-hub.css` `:root` for the dark chrome. Do NOT hard-code these values in
components; always reference the token.

Content (existing, unchanged): `--navy #051C2C`, `--blue #0047AB`,
`--blue-mid #2563EB`, `--teal #00968A`, `--red #C9002B`, `--green #00875A`,
grays `--gray-50..800`, `--white`.

New HUD chrome tokens (add to `styles-hub.css`):
```
--hud-bg:        #0A1622;  /* sidebar + topbar base            */
--hud-surface:   #0F2133;  /* raised chrome (active row, menus)*/
--hud-border:    rgba(255,255,255,.08);
--hud-text:      #C6D2DE;  /* chrome default text             */
--hud-text-dim:  #7E93A6;  /* section labels, inactive        */
--hud-accent:    #2DD4BF;  /* teal glow: active nav, focus    */
--hud-accent-bg: rgba(45,212,191,.14);
--status-ok:     #34D399;
--status-warn:   #FBBF24;
--status-danger: #F87171;
```

Roles:
- **Active nav item** = `--hud-accent-bg` fill + left `--hud-accent` bar + text `#FFFFFF`.
- **Status dot** = `--status-ok|warn|danger`, 8px circle. ok = healthy, warn =
  degradation > 0 / warnings, danger = errors / blocked / server down.
- **Accent** (`--hud-accent`) is for state (active, focus, live), never a generic
  button color. Buttons in content stay the existing navy/blue/`.link-button`.
- Semantic colors stay semantic; never repurpose red/green for decoration.

## 3. Typography Rules

- Chrome + all **numeric metrics** use `--font-mono` (counts, tokens, latency,
  degradation level, run counts, timestamps). Numbers must look like readouts.
- Content headings keep the existing scale BUT: page titles inside the HUD app
  (`h1` on a route) switch from serif to `--font-sans`, 700, to read as an app,
  not a document. Serif remains only for long-form doc/report bodies.
- Sidebar section labels: `--font-sans`, .68rem, uppercase, letter-spacing .1em,
  color `--hud-text-dim`.
- Nav items: .9rem, sans; min tap height 36px.

## 4. Component Stylings

- **Topbar (status bar):** full width, dark, height 48px, sticky top. Left:
  brand mark. Center/right: live status group = `status-dot + label` chips
  (`server`, `deg Ln`, `N runs live`), each `--font-mono`. Chips are read-only.
- **Sidebar:** fixed 232px, dark, full height, scrolls independently. Nav grouped
  under labels: **MONITOR** (Dashboard, Runs, Sessions), **CONTROL** (Jobs,
  Governance, Violations), **AI** (Chat, Usage), **SYSTEM** (Suites, Tools,
  Inspect, Board). Collapses under 900px to an icon/topbar toggle.
- **Cards:** unchanged (`.card`, `.card-grid`) in content.
- **Status dot:** `.status-dot` span, 8px, `border-radius:50%`, color by role.
- **Buttons:** content actions reuse `.link-button` / existing button styles.
  Do not restyle globally.
- **Chat (see 5 + below):** dark toolbar row optional; bubbles stay light.

## 5. Layout Principles

- App shell fills the viewport: `100vh` grid = `topbar` (row) then
  `[sidebar | content]`. Content column scrolls, chrome stays put.
- Content column is **full-bleed** (no centered 1100px cap for app routes);
  inner padding ~1.25rem. Wide screens fill; do not float content in a narrow
  column with dead white space.
- **Chat page fills available height:** messages area flexes to fill, composer
  sticks to the bottom, toolbar sticks to the top of the panel. No fixed 380px
  empty box.
- Persistent shell: render the topbar + sidebar immediately; only the content
  area shows a loading skeleton. Never blank the whole screen with "Loading".

## 6. Interaction, States & Accessibility

- Every interactive element needs a visible `:focus-visible` ring
  (`outline: 2px solid --hud-accent` on dark, `--blue-mid` on light).
- Provide all states: default, hover, active/selected, disabled, loading,
  error, empty, success. Empty states are compact and helpful, not big voids.
- Chat streaming: show a live cursor/indicator; the Send button becomes **Stop**
  while streaming (abort the fetch). Autoscroll to bottom on new tokens unless
  the user has scrolled up (then show a "jump to latest" affordance).
- Keyboard: Enter sends, Shift+Enter newline (hint shown near composer).
- `prefers-reduced-motion`: disable non-essential transitions/glows.
- Min tap target 36px chrome / 40px touch.

## 7. Agent Rules

- Edit only files under `harness/hub/`. Never touch `harness/run_harness.py`.
- Vanilla JS + plain CSS only. No frameworks, no new packages, no CDN.
- Reference tokens; never hard-code a hex that a token already covers. Add new
  tokens to `:root` in `styles-hub.css`, not inline.
- Keep the shared `styles.css` (html-kit) intact; layer HUD styles in
  `styles-hub.css`. Content pages must stay readable in the light system.
- Metrics/counts/tokens/timestamps render in `--font-mono`.
- No emoji as functional UI; use text/CSS glyphs or inline SVG. Small status
  dots are CSS circles.
- All 12 existing routes must keep working; do not regress any page while
  restyling the shell.
- Chat must support: model select, New chat, Export (Markdown + JSON) + Copy
  transcript, per-message copy + regenerate, Stop while streaming, autoscroll,
  token usage per turn, and localStorage persistence of the conversation.
- Bind 127.0.0.1. Never hard-code or log an API key. Avoid non-ASCII
  punctuation in source.

## 8. Workflow Run View

- `#/workflows` lists declared workflows; `#/workflows/runs/{run_id}` is the live run surface.
- Node timeline badges use done, running, interrupted, and pending states. Use the workflow node order and run metadata as the source of truth.
- Approval gates show the rendered provider prompt, objective, and optional JSON payload before resume or reject.
- Reuse the existing budget bar twice: workflow steps and elapsed workflow time. Token caps stay hidden because workflow limits are per agent.
