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

## Implemented: Task 1

A single Next.js App Router application with TypeScript and React. Tailwind CSS provides styling; shadcn/ui primitives provide basic controls. The server page renders a client dashboard. Local fixtures and Zod schemas live in `06-ai-frontier-radar/src/lib/`; no backend API route exists yet.

Flow: topic + inclusive date range → input validation → local fixture filtering → finding cards, evidence details and proposed experiments. Dates are ISO calendar dates; filtering does not depend on local timezone. An empty topic is invalid. Empty results and invalid ranges have explicit UI states.

Fixture records have stable IDs, category, title, summary, publication date, topic keywords, source URL and an evidence excerpt. Source references are hand-curated demo material, not a production evidence-verification system. Interpretations and experiments are explicitly labeled. Nothing is sent to an external service by the application.

## Approved, not implemented

Server route → bounded discovery (hosted search + arXiv API) → source retrieval and normalization → date filtering/deduplication → structured LLM synthesis referencing source IDs → evidence validation → UI/report export.

Planned interfaces: source records own canonical URL, title, publication/revision/retrieval dates and evidence excerpts; findings reference registered source IDs and carry claim support status. Reports record model ID, prompt version and schema version. Unknown publication dates are excluded from strict date results and disclosed. A reachable URL alone does not prove claim support.

Use the official OpenAI JavaScript SDK and Responses API after API documentation, account access, model compatibility and spending limits are verified. `OPENAI_MODEL=gpt-6.1-sol` is requested configuration, not verified API availability. No SDK or key is needed for Task 1.

## Operations

Run commands from `06-ai-frontier-radar/`; its npm lockfile pins installed dependencies. Keys belong in ignored `06-ai-frontier-radar/.env.local`, never client/public variables. No database, authentication, worker, provider framework, or persistence. System fonts avoid build-time font downloads. Vitest covers data contracts/filtering; Playwright covers browser interactions. Public deployment requires review of access and spending controls and host request limits.
