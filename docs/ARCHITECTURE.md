# Repository architecture

## Layout and boundaries

```text
sde-to-ml-infra/
├── AGENTS.md                 # Canonical repository agent instructions
├── CLAUDE.md                 # Claude entry point referencing AGENTS.md
├── docs/                     # Shared context; current detailed scope is Frontier Radar
├── 01-ml-refresh/            # ML training/evaluation exercises
├── 02-pytorch/               # Tensor, autograd, and neural-network exercises
├── 03-transformer/           # Mini GPT and KV-cache exercises
├── 04-inference/             # Inference and batching benchmarks
├── 05-vllm-serving/          # vLLM client/benchmark exercises
├── 06-serving-gateway/       # Separate Python serving gateway project
└── 06-ai-frontier-radar/     # Independent Next.js application
    ├── src/app/              # App Router entry points and styles
    ├── src/components/       # Dashboard and UI primitives
    ├── src/lib/              # Fixture contracts and filtering
    ├── tests/                # Vitest processing tests
    ├── e2e/                  # Playwright browser tests
    ├── package.json
    └── README.md             # Application setup and verification
```

There is no root Next.js app, shared package workspace, or runtime coupling between the learning projects and Frontier Radar. Root-level documentation does not move application code or dependencies. Existing Python projects retain their own architectures. The sections below describe AI Frontier Radar only.

## Implemented: dashboard (Task 1)

A single Next.js App Router application with TypeScript and React. Tailwind CSS provides styling; shadcn/ui primitives provide basic controls. The server page renders a client dashboard. Local fixtures and Zod schemas live in `06-ai-frontier-radar/src/lib/`; the separate Task 2 source endpoint is described below.

Flow: topic + inclusive date range → input validation → local fixture filtering → finding cards, evidence details and proposed experiments. Dates are ISO calendar dates; filtering does not depend on local timezone. An empty topic is invalid. Empty results and invalid ranges have explicit UI states.

Fixture records have stable IDs, category, title, summary, publication date, topic keywords, source URL and an evidence excerpt. Source references are hand-curated demo material, not a production evidence-verification system. Interpretations and experiments are explicitly labeled. The fixture dashboard sends nothing to external services; the source endpoint contacts the two providers only when invoked.

## Implemented: source retrieval (Task 2)

`POST /api/sources` accepts `{ topic, start, end }` using the shared input schema. The server route in `06-ai-frontier-radar/src/app/api/sources/route.ts` calls `src/lib/sources/{normalize,retrieve}.ts` (these two module paths are relative to the application root). Responses contain query, retrieval timestamp, normalized sources, provider statuses, counted exclusions and coverage limitations. Invalid/oversized input returns 400; complete provider failure returns 503; partial success returns 200 with explicit unavailable statuses. Responses are not cached.

Public retrieval only: arXiv Atom API (ten newest candidates, literal terms and submitted-date filter) plus the official OpenAI news RSS feed (local literal-term/date filtering). Return at most ten matches per provider and disclose result-limit omissions. This is bounded discovery, not exhaustive historical search. Paid hosted search remains deferred. The current feed may omit older articles or descriptions; invalid entries are counted rather than invented.

Source interface: stable ID, provider, title, version-specific URL where available, canonical URL, publication date, revision date, retrieval timestamp, authors and evidence `{ text, kind, url }`. Evidence consists of normalized author abstract/feed-description text, not fetched article/PDF content or verified factual claims. There is no generated significance or experiment output. arXiv IDs deduplicate versions; official URLs remove fragments/tracking parameters. Publication dates drive filtering; unknown dates are excluded and counted. Duplicate arXiv records prefer the latest revision.

Established `fast-xml-parser` parses bounded XML; malformed XML, DTD/entity declarations, unexpected formats and arXiv error feeds fail explicitly. Only fixed HTTPS upstream endpoints are fetched; article URLs must match provider hosts and path formats and are not followed. Fetches reject redirects, time out after twelve seconds and cap each body at 2 MB. Requests cap JSON bodies at 4096 bytes. A process-local arXiv guard enforces one connection and three seconds between calls; multi-instance public deployment requires a coordinated limiter before enabling the endpoint. No workers, persistence, credentials or authentication were introduced.

## Approved, not implemented

Implemented source retrieval/normalization → future structured LLM synthesis referencing source IDs → evidence validation → live UI/report export. Paid hosted search and broader official-source coverage remain planned.

Planned interfaces: source records own canonical URL, title, publication/revision/retrieval dates and evidence excerpts; findings reference registered source IDs and carry claim support status. Reports record model ID, prompt version and schema version. Unknown publication dates are excluded from strict date results and disclosed. A reachable URL alone does not prove claim support.

Use the official OpenAI JavaScript SDK and Responses API after API documentation, account access, model compatibility and spending limits are verified. `OPENAI_MODEL=gpt-6.1-sol` is requested configuration, not verified API availability. No LLM SDK or key is needed for Tasks 1–2.

## Operations

Run commands from `06-ai-frontier-radar/`; its npm lockfile pins installed dependencies. Keys belong in ignored `06-ai-frontier-radar/.env.local`, never client/public variables. No database, authentication, worker, provider framework, or persistence. System fonts avoid build-time font downloads. Vitest covers data contracts/filtering; Playwright covers browser interactions. Public deployment requires review of access and spending controls and host request limits.
