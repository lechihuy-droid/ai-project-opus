# HANDOFF - OPUS ANIMUS
**Updated:** 2026-05-12

> Resume anchor for Codex after interruption.

## Task dang lam

`CONS-RESEARCH-TOOL` - build and stabilize the local news/research dashboard for Opus Consilium.

## Da lam duoc

- Located the active work in `C:/Users/HUY/AI/opus-animus/opus-consilium`.
- Confirmed this task is separate from the stale Lucida handoff.
- Verified FastAPI app routes:
  - `/api/dashboard`
  - `/api/articles`
  - `/api/goals`
  - `/api/run/{action}`
- Fixed `/api/run/{action}` polling in `api/actions.py`:
  - stdout is now captured by a background thread
  - polling no longer blocks waiting for a subprocess line
- Fixed `/api/articles` date filtering in `api/data.py`:
  - uses the `YYYY-MM-DD` prefix in article filenames
  - avoids hiding older article files just because filesystem mtime changed
- Added missing `beautifulsoup4` dependency for GitHub Trending scraping in `requirements.txt`.
- Fixed Windows console startup crash in `run_dashboard.py` by changing the launch print to ASCII.
- Added safe action discovery/dry-run support:
  - `GET /api/actions`
  - `POST /api/run/collect_dry_run`
  - dashboard Actions view now shows `Test Collect` before the full collect action
- Added Intel daily report support:
  - `GET /api/intel/reports`
  - `GET /api/intel/report?date=YYYY-MM-DD`
  - Intel tab now renders a daily report in-page with date links/chips
- Created the implementation plan artifact:
  - `opus-consilium/docs/PLAN-intel-tab-fpt-ai-sdlc.html`
- Executed the first implementation slice of the plan:
  - upgraded `api/intel.py` from markdown-only report to explicit Intel schema
  - added report sections: summary, executive brief, strategic signals, category mix, actor map, top items, recommended actions
  - added `used_status` state in `opus-consilium/logs/intel_state.json` without editing raw article files
  - added mark-used / mark-unused endpoints
  - updated Intel tab to render structured report cards and Used/Unused controls
  - added gated `intel_synthesis` action placeholder to Actions view
- Simplified the user-facing Intel tab after feedback:
  - added `GET /api/intel/simple`
  - switched the Intel route to `SimpleIntelView`
  - visible flow is now only: latest AI market changes -> summary -> suggested actions
  - detailed schema/report machinery remains available behind the simple surface
- Added `run_collect.py --no-notify` so the collector can update Intel data without Telegram.
- Ran today's Intel refresh on 2026-05-12 JST:
  - command: `python run_collect.py --no-ingest --no-notify`
  - first sandboxed run hit proxy/network failure and fetched 0
  - escalated network run fetched 107, passed 58, kept 28 after goal filter, saved 28 raw files
  - wiki ingest skipped, Telegram skipped
  - saved files have source publish date `2026-05-11`, written locally on 2026-05-12 JST
- Smoke tested:
  - `GET /api/dashboard` -> 200
  - `GET /api/articles?limit=3&days_back=7` -> 200 with 3 rows
  - `GET /api/actions` -> includes `collect_dry_run`
  - `GET /api/intel/reports` -> 200
  - `GET /api/intel/report?date=2026-05-09` -> 200
  - `GET /api/actions` -> includes `intel_synthesis`
  - `POST /api/intel/articles/{slug}/mark-used` -> 200
  - `POST /api/intel/articles/{slug}/mark-unused` -> 200
  - `GET /api/intel/simple` -> 200
  - latest simple Intel after refresh -> date `2026-05-11`, 28 items, 5 latest changes
- Confirmed dashboard responds at:
  - `http://127.0.0.1:8765`

## Exact next action

1. Open/verify `http://127.0.0.1:8765`.
2. Check views:
   - Home
   - Intel
   - Reading
   - Actions
3. Test action runner safely:
   - prefer non-mutating or dry-run behavior before running full collect/research
   - avoid accidental writes to `raw/` or wiki unless the user asks
4. Update `TODO.md`:
   - mark completed Consilium dashboard/API steps
   - move stale HOME Dashboard status out of "Planned"
   - keep remaining CONS-REBUILD tasks visible

## Files da touch

- `C:/Users/HUY/AI/opus-animus/opus-consilium/api/actions.py`
- `C:/Users/HUY/AI/opus-animus/opus-consilium/api/data.py`
- `C:/Users/HUY/AI/opus-animus/opus-consilium/api/intel.py`
- `C:/Users/HUY/AI/opus-animus/opus-consilium/requirements.txt`
- `C:/Users/HUY/AI/opus-animus/opus-consilium/run_collect.py`
- `C:/Users/HUY/AI/opus-animus/opus-consilium/run_dashboard.py`
- `C:/Users/HUY/AI/opus-animus/opus-consilium/dashboard/index.html`
- `C:/Users/HUY/AI/opus-animus/opus-consilium/docs/PLAN-intel-tab-fpt-ai-sdlc.html`
- `C:/Users/HUY/AI/opus-animus/opus-consilium/logs/intel_state.json`
- `C:/Users/HUY/AI/opus-animus/ai/status.md`
- `C:/Users/HUY/AI/opus-animus/ai/handoff-codex.md`

## Risks / can kiem tra

- Dashboard HTML still uses CDN React/Babel and Google Fonts; it may not work fully offline.
- `dashboard/index.html` is large and should be visually checked in a browser.
- `/api/run/collect` may fetch network sources and write raw articles; test deliberately.
- User asked to keep Intel simple. Avoid re-exposing category/actor/signal internals unless asked.

## Validation commands

```powershell
$env:PYTHONDONTWRITEBYTECODE='1'
C:/Users/HUY/AppData/Local/Programs/Python/Python311/python.exe -c "from fastapi.testclient import TestClient; from run_dashboard import app; c=TestClient(app); print(c.get('/api/dashboard').status_code); r=c.get('/api/articles?limit=3&days_back=7'); print(r.status_code, len(r.json()))"
```

Expected:

```text
200
200 3
```
