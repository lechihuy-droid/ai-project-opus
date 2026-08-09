---
name: shadcn-best-practices
description: Compose shadcn-style UI primitives consistently while preserving accessibility, ownership, theming, and upgrade clarity.
---

# Shadcn UI Practices

Use this skill when a project already uses shadcn/ui or compatible source-owned primitives.

1. Confirm the component and dependency versions already present.
2. Reuse primitives and variants instead of forking near-duplicates.
3. Keep accessible names, focus management, keyboard behavior, and portal layering intact.
4. Centralize design tokens and use variants for meaningful states.
5. Treat generated component code as application-owned code that still requires review and tests.

Do not run a component CLI, overwrite local customizations, or install packages without an approved workspace execution step and a reviewed diff.
