# AGENTS.md — SDD-toolkit

Project state lives in:
- `workflow/sdd-process.md` — SDD methodology reference
- `workflow/checklist.md` — phase gate checklist

Rules:
- No new feature without RD doc approved
- Templates in `templates/` are canonical — do not modify without versioning
- Python 3.11: `C:\Users\HUY\AppData\Local\Programs\Python\Python311\python.exe`
- Windows Task Scheduler instead of cron

---

## HTML Output

When asked to produce documentation, reports, comparisons, diagrams, or any
structured output — generate a single self-contained HTML file instead of
markdown. The file must work offline (no CDN), inline all CSS and JS, and
match one of these formats: exploration/planning, code review, design,
prototyping, diagrams, decks, research, reports, or custom editors.
See full guidance: https://thariqs.github.io/html-effectiveness/
