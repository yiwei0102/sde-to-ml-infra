# Decisions

Scope: AI Frontier Radar unless a decision explicitly concerns the whole repository. Application paths are prefixed with `06-ai-frontier-radar/`.

## 2026-10-21 — Single TypeScript application

Accepted: Next.js App Router + React + TypeScript; Tailwind and selective shadcn/ui controls. A separate Python backend was considered but adds deployment and interface overhead without MVP value.

## 2026-10-21 — Evidence before synthesis

Accepted architecture: retrieve and normalize sources before generating findings. Models reference source IDs; application records own URLs/dates. One-shot free-form research was rejected because citations and support must be independently testable. Implementation is deferred beyond Task 1.

## 2026-10-21 — Fixture-only first milestone

Accepted: realistic, explicitly labeled, hand-curated historical fixtures with local topic/date filtering. No paid APIs, SDK integration, or network retrieval. `06-ai-frontier-radar/.env.example` records the requested `gpt-6.1-sol` model; availability/compatibility remains unverified. Live integration requires later approval and a spending limit.

## 2026-10-21 — Minimal operational scope

Accepted: no persistence, authentication, workers, or agent framework. JSON export is planned later. These facilities require demonstrated need and approval. Reports will retain model/prompt/schema metadata for future evaluation rather than introducing a comparison framework now.

## 2026-10-21 — Canonical project memory

Accepted: AGENTS.md holds durable rules, CLAUDE.md references it, and focused product/architecture/decision/progress documents preserve project state without duplicating instructions.

## 2026-10-21 — npm and local fonts

Use the scaffold's npm lockfile instead of introducing pnpm tooling to an empty project. Use system fonts for reliable builds without external font requests. Test fixture processing with Vitest and browser behavior with Playwright.

## 2026-10-21 — Build compatibility

Use Next.js's webpack path and Tailwind's standard PostCSS plugin. The generated Turbopack CSS loader failed while spawning a process that binds a local port in this environment; the webpack production build succeeds. Remove the shadcn CLI from application dependencies after generating the three needed primitives. It is not required at runtime.

## 2026-10-21 — Root-level repository context

User-directed: move the canonical `AGENTS.md`, `CLAUDE.md`, and `docs/` from the Frontier Radar application to the `sde-to-ml-infra` repository root; replace the previous root AGENTS.md while retaining its Git checkpoint policy. A nested document set was considered but rejected because root entry points should orient agents across the repository. Shared documents distinguish the independent learning projects from the active Next.js product. Keep application code, dependencies, environment template, tests and run commands in `06-ai-frontier-radar/`; update README links rather than maintaining duplicate context files.

## 2026-10-21 — Task 2 public-source retrieval

User approved proceeding to Task 2. Use the public arXiv Atom API and official OpenAI RSS feed, parsed with `fast-xml-parser`; do not require paid hosted search or API credentials yet. This delivers a testable retrieval contract without starting synthesis. Keep the dashboard fixture-only until later integration. Feed metadata is evidence material, not independent claim verification or article full text.

Use fixed endpoints, bounded streams/timeouts, conservative official-link validation, publication-date filtering, stable-ID deduplication, provider-specific failure status, counted exclusions and ten returned records per provider. Unknown dates are excluded rather than inferred. A process-local arXiv cooldown suffices for the local single-process demo; coordinated deployment-wide rate limiting must precede public multi-instance hosting.

References verified: [arXiv API manual](https://info.arxiv.org/help/api/user-manual.html), [arXiv API terms/rate limits](https://info.arxiv.org/help/api/tou.html), [official OpenAI RSS](https://openai.com/news/rss.xml), [XML parser](https://github.com/NaturalIntelligence/fast-xml-parser). A live smoke test returned successful statuses from both public providers. No paid API was called.
