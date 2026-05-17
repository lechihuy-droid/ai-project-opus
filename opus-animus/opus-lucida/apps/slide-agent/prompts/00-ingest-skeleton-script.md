# Mode 0 - Ingest Skeleton + Script

Read:

- `production/00-active/<lane>/01-master-teaching-skeleton.md`
- `production/00-active/<lane>/02-script.md`
- `production/01-rules/slide-system/02-slide-template-library.md`
- `production/01-rules/slide-system/10-banned-preferred-language-dictionary.md`

Emit only typed JSON at `apps/slide-agent/lessons/<lane>/lesson.json`.

Pass condition: validates against `apps/slide-agent/schemas/lesson.schema.json`; Wake has at least four grammar points; public 3-view labels use `Ý nghĩa - Dạng - Cách dùng`.
