---
description: Run the FormForge audit checklist (P0/P1/P2 findings). Optional scope: api, frontend, shared, or all.
agent: formforge-auditor
---

Run the full FormForge audit checklist. Scope: $ARGUMENTS

If no scope is provided, run all sections (backend, frontend, shared
packages). If a scope is given, run only that section:

- `api` or `backend` → apps/api only
- `web` or `frontend` → apps/web only
- `shared` → packages/shared + packages/db only
- `all` or no argument → everything

Produce the structured P0/P1/P2 report with file_path:line_number
citations for every finding. List verified-clean categories at the end.
