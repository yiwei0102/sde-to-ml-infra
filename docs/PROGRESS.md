# Progress

Scope: AI Frontier Radar (`06-ai-frontier-radar/`) and its repository-level context. Other numbered projects are not assessed here.

Last updated: 2026-10-21 (America/Los_Angeles).

## Current milestone

Task 1: application foundation and polished fixture dashboard completed. Stop here for user review. Tasks 2–6 are not authorized or started.

## Implemented

- Next.js 16.4.2, React 19.3, TypeScript, Tailwind CSS 4 with PostCSS; selected shadcn/ui Button/Input/Badge primitives.
- Responsive research page, native date inputs, topic/date validation, inclusive local keyword filtering, category filters, empty state and reset.
- Three hand-curated historical fixtures with version-specific arXiv links and first-publication dates. Demo labels, expandable source paraphrases/limitations, editorial interpretations, and unexecuted experiment proposals.
- Zod query/fixture contracts; Vitest processing tests and desktop/mobile Playwright coverage.
- Placeholder-only `06-ai-frontier-radar/.env.example`: requested `OPENAI_MODEL=gpt-6.1-sol` and API key placeholder. No API integration or real credentials.
- Canonical AGENTS.md, Claude entry point, product/architecture/decision/progress documents, and local setup README.

## Root-context relocation completed

Moved `AGENTS.md`, `CLAUDE.md`, and this `docs/` set to the repository root per user direction. Replaced root AGENTS.md with scoped repository/application rules while preserving its complete Git checkpoint policy. Corrected architecture paths and README entry points. Application code and dependencies remain in `06-ai-frontier-radar/`; no Tasks 2–6 work was started.

Relocation validation: local Markdown links checked across eight files, old nested context paths confirmed absent, and staged diff whitespace checks passed. This documentation-only change did not rerun application checks; the results below belong to the Task 1 implementation milestone.

## Task 1 implementation verification

- Lint, TypeScript check and webpack production build passed.
- Seven Vitest tests passed: input/date validation, fixture contract, topic matching, sort order, inclusive boundaries, empty results, stable date rendering and non-mutation.
- Two Playwright tests passed (desktop and mobile Chromium): filtering, source disclosure/link, validation, empty results, reset, no horizontal overflow and no external application requests.
- Desktop/mobile screenshots visually inspected. Screenshots and browser reports are ignored generated artifacts.
- Production dependency audit: zero advisories. Full audit: five high-severity entries in the development-only eslint-config-next → fast-glob → micromatch → braces chain. Registry currently offers braces 3.0.3; suggested automatic remediation downgrades the Next lint config to 14.x. No incompatible downgrade applied. Recheck when patched upstream packages are available; do not pass untrusted glob patterns to lint tooling.

## Known limits and open decisions

- Fixture search is simple case-insensitive keyword matching over three historical papers, not semantic search or current research coverage.
- No live retrieval, automated citation/support verification, LLM synthesis, report export or persistence exists.
- Requested model ID remains unverified for API availability and required capabilities. Confirm official API documentation, account access and spending limit before live integration.
- Browser coverage is Chromium desktop/mobile emulation; Safari/Firefox have not been tested.
- Public hosting, access and spending controls remain undecided.

## Next steps — require review

1. Review Task 1 UI, documentation and fixture behavior.
2. If approved, begin Task 2: source discovery/retrieval, date normalization and deduplication, with deterministic failure-path tests.
3. Later tasks: structured synthesis, evidence enforcement, live UI integration and demo hardening. Obtain provider/model/budget approval before paid calls.

## Task 1 changed-file inventory

Context paths below are repository-root-relative. App, check, and configuration paths below are relative to `06-ai-frontier-radar/`.

- Context: `AGENTS.md`, `CLAUDE.md`, `docs/PROJECT.md`, `docs/ARCHITECTURE.md`, `docs/DECISIONS.md`, `docs/PROGRESS.md`, `06-ai-frontier-radar/README.md`.
- App: `src/app/{layout.tsx,page.tsx,globals.css,icon.svg}`, `src/components/radar-dashboard.tsx`, `src/components/ui/{button.tsx,input.tsx,badge.tsx}`, `src/lib/{research.ts,utils.ts}`.
- Checks: `tests/research.test.ts`, `e2e/research.spec.ts`, `vitest.config.mts`, `playwright.config.ts`.
- Configuration: `.env.example`, `.gitignore`, `package.json`, `package-lock.json`, `components.json`, `eslint.config.mjs`, `next.config.ts`, `postcss.config.mjs`, `tsconfig.json`.
