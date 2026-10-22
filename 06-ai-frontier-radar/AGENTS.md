# AI Frontier Radar: agent instructions

Read this file, `docs/PROJECT.md`, `docs/ARCHITECTURE.md`, `docs/DECISIONS.md`, and `docs/PROGRESS.md` at the start of a session. Parent repository instructions also apply. `CLAUDE.md` points here; keep this file canonical.

- Ship a working, polished product. Prefer established SDKs and libraries; avoid unnecessary abstractions.
- Keep one Next.js + TypeScript application. Add Python only with clear value and approval.
- Do not add a database, authentication, background workers, or complex agent frameworks without demonstrated need and user approval.
- Work incrementally. Stop for approval before the next major task and before significant scope or architecture changes. Current authorization: Task 1 only.
- Never commit secrets or credentials. Keep keys server-side in ignored environment files; `.env.example` contains placeholders only.
- Preserve source provenance. Distinguish source evidence, model interpretation, proposed experiments, and unsupported claims. Never invent citations or dates.
- Clearly label fixtures as demo data. Do not imply retrieval, generation, or verification occurred when it did not.
- Run relevant tests, lint, typecheck, and build after meaningful changes. Test important processing and failure paths.
- Update `docs/DECISIONS.md` for significant decisions, `docs/ARCHITECTURE.md` for material architecture changes, and `docs/PROGRESS.md` after milestones. Record actual changes; distinguish implemented, planned, and unverified work. Avoid conversation logs and duplicated rules.
- Follow the parent Git checkpoint policy: inspect status, branch, remotes and diffs; stage only relevant verified work; commit and push meaningful milestones to the expected remote. Never force-push. Report commit/branch, push status, unrelated changes and blockers.
