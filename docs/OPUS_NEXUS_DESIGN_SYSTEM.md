# Opus Nexus Design System

**Status:** merged working design system  
**Last updated:** 2026-05-31  
**Sources merged:**
- `OPUS ANIMUS Design System (1).zip`
- `docs/PLAN-uiux-transformation.md`
- `docs/BD-phase1-foundation.md`
- `docs/BD-phase2-navigation.md`
- `docs/BD-phase3-today-redesign.md`
- `docs/BD-phase4-proposal-calendar.md`
- current `health-app/dashboard.html`

## North Star

Opus Nexus is a premium personal command center: dark, compact, operational, and calm. The visual language should feel Roman/geometric/authoritative without turning the product into a gold theme.

## What We Keep

1. **Dark OLED shell**
   - Keep `--vita-bg: #090A0F`, dark surfaces, subtle borders, and compact mobile-first layout.
   - Keep the app as a single HTML dashboard for now; no CDN or React dependency is required for this surface.

2. **Blue active navigation**
   - Keep `--vita-active: #0A84FF` for active app navigation and primary proposal/calendar actions.
   - The previous full nav-gold active theme is not the default app state.
   - Module tabs use a selected pill state, not an underline-only state: active tabs get a soft blue background, blue border, and blue icon/text.

3. **Semantic health colors**
   - Keep blue for protein/water/feedback, green for success/fiber/sync, purple for sleep/recovery, orange for energy/warning, red for critical deficits, gray for inactive/missing data.
   - Do not recolor all metrics gold.

4. **Existing Phase 3/4 UX**
   - Keep Today bento layout, conic rings, sleep bars, insight color-by-status, weekly nutrition summary, proposal elevation/collapse, sticky batch approve, and calendar empty CTAs.
   - Vita > Sức khỏe should be coach-first: show diagnosis, priority risk, and next action before trend analytics/charts.

5. **Inter typography and compact controls**
   - Keep Inter as the UI font.
   - Keep compact mobile controls and 8-10px radius for navigation/tool tiles where possible.

## What We Adopt From The Uploaded Design

1. **Opus Nexus Mark**
   - Use the geometric circle/triangle mark as the brand identity.
   - Use restrained gold `#C9A84C` only for brand mark/favicon-level authority accents.

2. **Custom icon set**
   - `OpusNexusMark`: brand/topbar/loading/PAT/favicon.
   - `HealthHeart`: health primary and protein/health contexts.
   - `VitaGuardianShield`: Vita navigation and recovery/protection contexts.
   - `FiberLeaf`: fiber/nutrition fiber signal.
   - `SunriseIcon`: Today navigation.

3. **Local Lucide-style equivalents**
   - Because `health-app/dashboard.html` is single-file/no-build, use inline SVG symbols instead of `lucide-react`.
   - Local equivalents now cover `CalendarDays`, `ShieldCheck`, sync, key, dumbbell, wallet, scale, chart, water, check, alert, critical, flame, steps, and sleep.

4. **No emoji icons in product UI**
   - Product UI components should use SVG symbols, not emoji.
   - Emoji may still appear in docs, raw copied text, or historical data if the content itself contains them, but not as interface icons.

## What We Replaced

- Topbar brand emoji -> `OpusNexusMark`.
- Loading leaf emoji -> `OpusNexusMark`.
- Sync arrow text icon -> `i-sync`.
- PAT key emoji -> `i-key`.
- Module tabs:
  - Sức khỏe -> `HealthHeart`
  - Tập luyện -> `i-dumbbell`
  - Tài chính -> `i-wallet`
- Bottom nav:
  - Today -> `SunriseIcon`
  - Vita -> `VitaGuardianShield`
  - Calendar -> `CalendarDays`
  - Approval -> `ShieldCheck`
- Today snapshot metric icons -> SVG symbols.
- Calendar empty/not-connected emoji -> `CalendarDays`.
- Health insight status emoji -> check/alert/critical SVG.
- Workout/finance list/category emoji -> SVG symbols.
- Streak fire emoji -> local flame SVG.

## What We Retain Temporarily

- Legacy Phosphor sprite symbols remain in `dashboard.html` for compatibility while older markup is removed gradually. New UI should not add more Phosphor-filled icons.
- Chart rendering, data validation, Google API logic, approval logic, and localStorage/PAT behavior stay unchanged.
- `health-app/assets/opus-mark.svg` is the canonical favicon/app asset for the single-file app.

## Implementation Rules

1. Prefer inline SVG symbols in `dashboard.html` for this app surface.
2. Use `currentColor`, `fill: none`, 2px-ish strokes, square line caps/joins.
3. Keep gold around brand identity only; app actions remain semantic blue/green/orange/red.
4. Do not introduce new emoji in buttons, nav, cards, badges, or metric labels.
5. If a new domain icon is needed, add a local symbol first and document whether it is a permanent custom icon or a temporary Lucide-style equivalent.

