# Harness Hub — Personal AI Skill Stack (30 capabilities)

Date: 2026-08-09
Runtime scope: `harness/hub/skills/` (`hub_builtin`)
Delivery form: Hub-native, text-only `SKILL.md` contracts

## Installation summary

- Requested logical skills: 30
- Added: 29
- Already present and preserved: 1 (`backend-patterns`)
- Skipped capabilities: 0
- Copied upstream scripts/hooks/packages: 0
- Project-external Codex installation: none

The Hub runtime injects `SKILL.md` text but does not bind arbitrary upstream
scripts, hooks, package installers, or sibling references as trusted tools.
Therefore the stack uses newly written Hub-native contracts rather than raw
plugin copies. This preserves the requested capabilities while keeping tool
authority in agent profiles and deterministic Hub policy.

## Logical catalog

| Category | Skills |
|---|---|
| Platform | `skill-creator`, `mcp-builder`, `claude-api`, `agent-governance` |
| Web | `frontend-design`, `frontend-app-builder`, `frontend-testing-debugging`, `react-best-practices`, `shadcn-best-practices`, `webapp-testing`, `web-artifacts-builder`, `supabase-best-practices` |
| Backend | `backend-patterns`, `api-design`, `security-review` |
| Data | `postgres-patterns`, `database-migrations`, `clickhouse-io`, `create-data-context`, `analyze-data-quality`, `validate-data`, `jupyter-notebooks`, `visualize-data`, `build-dashboard`, `design-kpis`, `metric-diagnostics` |
| Engineering | `systematic-debugging`, `verification-before-completion` |
| Knowledge work | `doc-coauthoring`, `xlsx` |

## Pinned research sources

| Source | Revision | License finding | Hub treatment |
|---|---|---|---|
| `anthropics/skills` | `f17010c9bb483898c1d9c9f42dde2b3a98889434` | Installed example skills have per-skill Apache-2.0; `doc-coauthoring` has no explicit grant found; `xlsx` is restrictive source-available | Capability-only rewrites; no scripts/assets copied |
| `openai/plugins` | `11c74d6ba24d3a6d48f54a194cd00ef3beea18f9` | No OSS license found at root/plugin scope | Capability-only rewrites; no upstream text/assets redistributed |
| `openai/role-specific-plugins` | `fe5608d2512a7d6a7b9821ce8a88c48464ecd6e4` | MIT | Text-only adaptations |
| `affaan-m/everything-claude-code` | `51a6950bde756fe3ebc8879aa0c8ee49b9c53e78` | MIT | Text-only adaptations; existing `backend-patterns` preserved |
| `obra/superpowers` | `44c9b2d6e889982ac18c27d05a19fefe335194e1` | MIT | Text-only adaptations |
| `github/awesome-copilot` | `ab7544d03d4c49fdd07f5958e1888ad39c4118e2` | MIT | Text-only adaptation |

## Security model

- Every new package contains only `SKILL.md`.
- No `scripts/`, `hooks/`, MCP configuration, package manifest, executable, or
  network connector was copied.
- Skills may describe a command or integration, but they explicitly require an
  agent-bound tool and approval; text never grants authority.
- Destructive writes, live database actions, external scans, credential use,
  package installation, git publishing, and completion claims are fail-closed.
- Evidence-producing checks are distinct from model recommendations.

## Duplicate and overlap policy

The requested overlaps remain separate because they govern different stages:

- `frontend-design` defines design discipline; `frontend-app-builder` defines delivery.
- `webapp-testing` validates browser behavior; `frontend-testing-debugging` diagnoses failures.
- `analyze-data-quality` profiles source quality; `validate-data` independently verifies methodology and conclusions.
- Existing `backend-patterns` was not overwritten; its content and attribution remain intact.

## Discovery contract

Success requires more than directory presence. Automated tests must verify:

1. all 30 exact logical names parse from frontmatter;
2. every package is text-only;
3. `runtime_skills.list_skills()` exposes every name from the `hub_builtin` source;
4. `runtime_skills.get_skill()` returns the full body;
5. every skill referenced by an agent profile resolves in the Hub catalog.

## Verification evidence

- `PYTEST_DISABLE_PLUGIN_AUTOLOAD=1 .\.ih\Scripts\python.exe -m pytest harness\hub\tests\test_runtime_skills.py harness\hub\tests\test_workflow_templates.py -q`
  returned `19 passed` in 192.22 seconds.
- `git diff --check` returned exit code 0. Git reported only expected Windows
  LF/CRLF conversion warnings.
- SkillSpector v2.3.7 scanned all 39 Hub skill packages. Every package was
  classified `LOW` with recommendation `SAFE`; no executable component was
  found. Thirty-six scored 0. `mcp-builder` scored 17, `security-review` 17,
  and `webapp-testing` 15 because static rules matched explicit denial text
  such as not accessing credentials or executing arbitrary commands. These are
  retained safety boundaries, not granted behavior.
- Runtime smoke coverage verifies the exact 30 names, non-empty descriptions
  and bodies, text-only packages, full `get_skill` reads, and assignment of all
  30 capabilities across the 15 canonical workflow agents.
- FastAPI `TestClient` called `GET /api/skills` and returned status 200 with
  `catalog_count=53`, `requested_found=30`, and `missing=[]`.
- The focused six-capability smoke marker test was rerun after its final edit:
  `1 passed, 11 deselected` in 102.94 seconds.
