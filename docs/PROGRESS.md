# Progress

Scope: AI Frontier Radar (`06-ai-frontier-radar/`) and its repository-level context. Other numbered projects are not assessed here.

Last updated: 2026-10-24 (America/Los_Angeles).

## Current milestone

Tasks 1–4 are complete. Task 4 uses conservative extractive source attribution, not general semantic entailment or independent fact checking. Stop for review before Tasks 5–6. No paid model calls are authorized or made.

## Implemented

- Next.js 16.4.2, React 19.3, TypeScript, Tailwind CSS 4 with PostCSS; selected shadcn/ui Button/Input/Badge primitives.
- Responsive research page, native date inputs, topic/date validation, inclusive local keyword filtering, category filters, empty state and reset.
- Three hand-curated historical fixtures with version-specific arXiv links and first-publication dates. Demo labels, expandable source paraphrases/limitations, editorial interpretations, and unexecuted experiment proposals.
- Zod query/fixture contracts; Vitest processing tests and desktop/mobile Playwright coverage.
- Placeholder-only `06-ai-frontier-radar/.env.example`: requested `OPENAI_MODEL=gpt-6.1-sol` and API key placeholder. No real credentials. The Task 3 SDK integration is described below.
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
- Public-source retrieval exists behind a separate endpoint; the UI remains fixture-only. Reference-ID validation and structured synthesis are implemented in the opt-in backend. Task 4 adds conservative source-sentence attribution; general paraphrase entailment, independent truth verification, report export and persistence remain unimplemented.
- Official model docs confirm the requested model supports structured outputs/Responses. Account access, billing, latency and generation quality remain unverified; the user has required mocked model tests only, with no paid calls.
- Browser coverage is Chromium desktop/mobile emulation; Safari/Firefox have not been tested.
- Public hosting, access and spending controls remain undecided.

## Next steps — require review

1. Review Task 4 against baseline `6da72b0`, starting at `enforceEvidence` and its adversarial tests; see `docs/CODE_REVIEW.md`.
2. Only after approval, begin Task 5 live UI integration, retaining a no-spend demo/test path.
3. Task 6: demo hardening and deployment decisions. Keep model calls mocked; do not assume account access or real generation quality was verified.

## Task 1 changed-file inventory

Context paths below are repository-root-relative. App, check, and configuration paths below are relative to `06-ai-frontier-radar/`.

- Context: `AGENTS.md`, `CLAUDE.md`, `docs/PROJECT.md`, `docs/ARCHITECTURE.md`, `docs/DECISIONS.md`, `docs/PROGRESS.md`, `06-ai-frontier-radar/README.md`.
- App: `src/app/{layout.tsx,page.tsx,globals.css,icon.svg}`, `src/components/radar-dashboard.tsx`, `src/components/ui/{button.tsx,input.tsx,badge.tsx}`, `src/lib/{research.ts,utils.ts}`.
- Checks: `tests/research.test.ts`, `e2e/research.spec.ts`, `vitest.config.mts`, `playwright.config.ts`.
- Configuration: `.env.example`, `.gitignore`, `package.json`, `package-lock.json`, `components.json`, `eslint.config.mjs`, `next.config.ts`, `postcss.config.mjs`, `tsconfig.json`.

## Task 2 implementation

- Added `06-ai-frontier-radar/src/lib/sources/normalize.ts` and `retrieve.ts`, plus `src/app/api/sources/route.ts` (last path relative to the application root).
- Public arXiv/OpenAI feeds, normalized evidence/provenance, separate publication/revision/retrieval dates, stable IDs, deduplication, inclusive filtering, bounded output and counted omissions.
- Fixed upstream URLs, redirect rejection, timeout/body limits, process-local arXiv cooldown, partial-failure reporting and invalid-input responses. No credentials, paid services or synthesis.
- Deterministic processing/retrieval/route tests use synthetic XML and mocked network responses; no fabricated test records are presented as real research.
- Live module smoke: both providers returned `ok`; observed a large RSS feed, prompting an explicit ten-result-per-provider output cap. Actual publication and canonical URL metadata were returned; full articles were not downloaded.
- Task 1 commits `9268d06` and `45c6d29` were pushed successfully to `origin/codex/frontier-radar-task-1` after the user confirmed the exact repository destination.

### Task 2 verification

- Lint, typecheck, production webpack build and all 25 unit/route tests passed. Both desktop/mobile Playwright regression tests passed; dashboard fixture behavior is unchanged.
- Real production HTTP smoke: invalid date request returned 400; public-source query returned 200 with `Cache-Control: no-store`, both providers `ok`, ten arXiv records and ten OpenAI records. Result-limit omissions were counted. No paid APIs were called.
- Important coverage: provenance/version normalization, separate date fields, invalid/missing dates, inclusive boundaries, topic matching, duplicate versions/tracking links, output limits, malformed/unsafe XML, off-domain links, upstream errors/timeouts, cooldown, streamed byte limits, request validation and partial/total failure status.
- Current limits: abstract/feed evidence only; no full-text fetch or semantic relevance; ten arXiv candidates may miss other matches; current RSS is not a historical archive. Rate limiting is process-local. Public deployment remains unapproved.
- Added dependencies/configuration: `fast-xml-parser` in application package/lockfile and the Vitest source alias for route tests. Added `tests/sources.test.ts` and `tests/sources-route.test.ts`. Root context and the application README now describe Task 2.

## Task 3 implementation and verification

- Added application modules `src/lib/synthesis/{schema,synthesize}.ts`, `src/lib/research-run.ts` and `src/app/api/research/route.ts`. Added official `openai` SDK and `server-only` guard; no credentials committed.
- Added three test files for SDK parsing/request configuration, orchestration and route behavior. Source retrieval's limitation text now scopes its no-synthesis statement to that stage.
- Strict structured findings, bounded evidence input, source-ID integrity, honest unverified/unsupported claim labels, experiment/interpretation labels, model/prompt/schema/usage metadata and retained source results on failure.
- No database/auth/workers/framework. Dashboard unchanged and still demo-only. User subsequently selected mocked tests only; no paid calls have been made. Account compatibility and live research quality remain unverified.
- Lint, typecheck, production build and 41 tests passed. Both desktop/mobile browser regressions passed. A real production HTTP request with synthesis explicitly disabled returned 503, `Cache-Control: no-store`, and `error.code=disabled`. The production dependency audit reported zero advisories; the known five lint-tooling advisory entries remain development-only. No live model output or paid verification is claimed.
- Added `docs/CODE_REVIEW.md`: full-stack explanation, implemented vs planned data flow, Task 3 core map and review exercises. Baseline commit: `21387ce`.

## Task 4 implementation

- Added application module `src/lib/synthesis/evidence.ts` and `tests/evidence.test.ts`. Updated generated schema/prompt to require per-source evidence quotes and wired the pure policy after SDK parsing. Changed only three production synthesis files; API routes and browser UI are unchanged.
- Accepted claims must exactly reproduce a full source sentence from the actual supplied evidence. URLs/dates come from registered source records. Output distinguishes source-reported claims, unsupported/withheld diagnostics, and unverified interpretation/proposals. This does not claim arbitrary semantic entailment or factual truth.
- Tests include real IDs with false claims, changed numbers/negation, paraphrases, invented quotes, foreign-source quotes, clipped/unsupplied evidence, missing/duplicate citations, unknown IDs, narrative citation injection, mixed valid/unsupported claims and empty output.
- Lint, typecheck, production build and 56 unit/SDK tests passed. Model HTTP transport remains mocked. Both desktop/mobile Playwright regressions passed; the fixture UI is unchanged. No paid calls were made.
- Review baseline: `6da72b0`; branch `codex/frontier-radar-task-4`. Tasks 5–6 remain unstarted.
