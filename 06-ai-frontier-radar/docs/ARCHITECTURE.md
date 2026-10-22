# Architecture

## Implemented: Task 1

A single Next.js App Router application with TypeScript and React. Tailwind CSS provides styling; shadcn/ui primitives provide basic controls. The server page renders a client dashboard. Local fixtures and Zod schemas live in `src/lib`; no backend API route exists yet.

Flow: topic + inclusive date range → input validation → local fixture filtering → finding cards, evidence details and proposed experiments. Dates are ISO calendar dates; filtering does not depend on local timezone. An empty topic is invalid. Empty results and invalid ranges have explicit UI states.

Fixture records have stable IDs, category, title, summary, publication date, topic keywords, source URL and an evidence excerpt. Source references are hand-curated demo material, not a production evidence-verification system. Interpretations and experiments are explicitly labeled. Nothing is sent to an external service by the application.

## Approved, not implemented

Server route → bounded discovery (hosted search + arXiv API) → source retrieval and normalization → date filtering/deduplication → structured LLM synthesis referencing source IDs → evidence validation → UI/report export.

Planned interfaces: source records own canonical URL, title, publication/revision/retrieval dates and evidence excerpts; findings reference registered source IDs and carry claim support status. Reports record model ID, prompt version and schema version. Unknown publication dates are excluded from strict date results and disclosed. A reachable URL alone does not prove claim support.

Use the official OpenAI JavaScript SDK and Responses API after API documentation, account access, model compatibility and spending limits are verified. `OPENAI_MODEL=gpt-6.1-sol` is requested configuration, not verified API availability. No SDK or key is needed for Task 1.

## Operations

npm lockfile pins installed dependencies. Keys belong in ignored `.env.local`, never client/public variables. No database, authentication, worker, provider framework, or persistence. System fonts avoid build-time font downloads. Vitest covers data contracts/filtering; Playwright covers browser interactions. Public deployment requires review of access and spending controls and host request limits.
