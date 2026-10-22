# Repository and product context

## Repository scope

`sde-to-ml-infra` is a portfolio and learning repository spanning ML foundations, PyTorch, transformers, inference, vLLM serving, and application projects. Numbered directories are independent projects, not services in a single deployed system. Their local READMEs remain the source for project-specific setup. This shared document set currently tracks AI Frontier Radar in detail; it does not claim the other projects were audited or completed.

## Active product: AI Frontier Radar

Application root: `06-ai-frontier-radar/`. Repository instructions and project memory live at the repository root.

AI Frontier Radar helps developers and AI/ML infrastructure engineers turn fast-moving AI releases and research into evidence-backed engineering experiments. It is a portfolio-quality product, optimized for a polished working demo.

## MVP

Users enter a research topic and date range. The completed MVP will retrieve relevant primary sources, use a current LLM to generate structured findings, and display source URLs, publication dates, technical significance, evidence limitations, and suggested experiments. Unsupported claims must be explicit; citations must never be fabricated.

Initial coverage: author-published arXiv papers and curated official lab blogs, documentation, and project releases. Coverage is bounded, not exhaustive. Publication, revision, and retrieval dates have different meanings.

## Non-goals

No accounts, database, saved history, background monitoring, scheduled jobs, complex agent orchestration, or live model comparisons. Comparisons and evaluations are future workflows. No Python service without clear value and approval.

## Success criteria

- Responsive, accessible topic/date input and readable findings with clear demo/live state.
- Future live findings resolve citations to retrieved source records and expose evidence limitations.
- Important processing logic has deterministic tests; lint, typecheck, tests and production build pass.
- Local setup is documented and secrets stay outside Git.
- Architecture preserves model/prompt/schema metadata for future comparisons.

## Current delivery

Task 1 is a local fixture experience only. It performs no retrieval, paid API calls, or LLM generation. Review is required before Task 2.
