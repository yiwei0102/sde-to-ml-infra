# Decisions

## 2026-10-21 — Single TypeScript application

Accepted: Next.js App Router + React + TypeScript; Tailwind and selective shadcn/ui controls. A separate Python backend was considered but adds deployment and interface overhead without MVP value.

## 2026-10-21 — Evidence before synthesis

Accepted architecture: retrieve and normalize sources before generating findings. Models reference source IDs; application records own URLs/dates. One-shot free-form research was rejected because citations and support must be independently testable. Implementation is deferred beyond Task 1.

## 2026-10-21 — Fixture-only first milestone

Accepted: realistic, explicitly labeled, hand-curated historical fixtures with local topic/date filtering. No paid APIs, SDK integration, or network retrieval. `.env.example` records the requested `gpt-6.1-sol` model; availability/compatibility remains unverified. Live integration requires later approval and a spending limit.

## 2026-10-21 — Minimal operational scope

Accepted: no persistence, authentication, workers, or agent framework. JSON export is planned later. These facilities require demonstrated need and approval. Reports will retain model/prompt/schema metadata for future evaluation rather than introducing a comparison framework now.

## 2026-10-21 — Canonical project memory

Accepted: AGENTS.md holds durable rules, CLAUDE.md references it, and focused product/architecture/decision/progress documents preserve project state without duplicating instructions.

## 2026-10-21 — npm and local fonts

Use the scaffold's npm lockfile instead of introducing pnpm tooling to an empty project. Use system fonts for reliable builds without external font requests. Test fixture processing with Vitest and browser behavior with Playwright.

## 2026-10-21 — Build compatibility

Use Next.js's webpack path and Tailwind's standard PostCSS plugin. The generated Turbopack CSS loader failed while spawning a process that binds a local port in this environment; the webpack production build succeeds. Remove the shadcn CLI from application dependencies after generating the three needed primitives. It is not required at runtime.
