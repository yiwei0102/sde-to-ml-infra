# Coding-agent instructions: sde-to-ml-infra

This repository contains independent ML learning projects and portfolio applications. Read this file, then `docs/PROJECT.md`, `docs/ARCHITECTURE.md`, `docs/DECISIONS.md`, and `docs/PROGRESS.md` at session start. All paths in these documents are repository-root-relative unless explicitly stated otherwise. `CLAUDE.md` references this canonical file.

## Repository rules

- Prioritize a working, polished product. Prefer established SDKs and libraries over commodity reinvention; avoid unnecessary abstractions.
- Work incrementally. Obtain approval before the next major task or significant scope/architecture changes. Consult `docs/PROGRESS.md` for the current authorized milestone.
- Never add a database, authentication, background workers, or complex agent frameworks without demonstrated need and approval.
- Never commit secrets or credentials. Keep API keys server-side in ignored environment files; examples contain placeholders only.
- Run relevant tests, lint, typecheck, and build after meaningful implementation changes, using the affected project's tools. For documentation-only changes, validate links, paths, and diffs. Test important processing and failure paths.
- Update `docs/DECISIONS.md` for significant decisions, `docs/ARCHITECTURE.md` for material architecture changes, and `docs/PROGRESS.md` after milestones. Scope entries to the affected project, distinguish completed/planned/unverified work, and avoid conversation logs or duplicate rules.
- Preserve unrelated working changes. Each numbered project has its own dependencies and execution commands; do not assume a shared application or runtime.

## AI Frontier Radar (`06-ai-frontier-radar/`)

- Keep a single Next.js + TypeScript application in this directory. Add Python only with clear value and approval; this restriction does not apply to existing Python learning projects.
- Preserve source provenance. Distinguish source evidence, model interpretation, proposed experiments, and unsupported claims. Never invent citations or dates.
- Label fixtures as demo data. Do not imply retrieval, generation, or verification occurred when it did not.
- Tasks 1 and 2 are authorized. Stop for review before Tasks 3–6. No paid API integration is authorized yet.
- Run application commands from `06-ai-frontier-radar/`; see its README for setup and checks. Its `.env.example` is a placeholder, not a verified model integration.

### Intelligent Git Checkpointing

You are responsible for proactively managing Git checkpoints during development. Do not wait for the user to remind you to commit or push.

Use engineering judgment rather than a fixed schedule or a certain number of conversations.

**When to consider committing and pushing:**

- A meaningful feature, milestone, or bug fix is complete and verified.
- A coherent set of changes is ready to be reviewed or resumed later.
- A significant, potentially risky refactor is about to begin and the current state is stable.
- A development session or task is ending, and meaningful verified changes remain uncommitted.
- Important project documentation has changed alongside a completed milestone.

**Before committing:**

1. Inspect `git status`, the current branch, remote configuration, and relevant diffs.
2. Ensure there are no secrets, credentials, generated artifacts, or unrelated changes included.
3. Run appropriate validation (tests, lint, build) based on the changes.
4. Stage only files relevant to the completed work.
5. Write a concise, descriptive commit message.

**Push behavior:**

- When a meaningful checkpoint is ready and the correct remote/branch is configured, proactively push it without requiring a separate reminder.
- For an initial push, confirm the intended repository and remote if they are ambiguous.
- Never force-push, rewrite shared history, or push to an unexpected remote.
- If authentication, branch protection, missing remotes, or other issues prevent a push, report the blocker clearly.
- Never claim a push succeeded without checking its result.

**Avoid excessive Git activity:**

- Do not create meaningless commits for every minor edit.
- Do not commit incomplete or failing work as though it were finished.
- Preserve useful intermediate work safely when needed, but clearly distinguish it from a validated milestone.

**Communication:**

At the end of each meaningful task, briefly report:

- Whether changes were committed and pushed.
- The commit hash and branch, when applicable.
- Any pending uncommitted changes or Git blockers.

Git checkpointing is part of completing an engineering task, not a separate activity that the user must request.
