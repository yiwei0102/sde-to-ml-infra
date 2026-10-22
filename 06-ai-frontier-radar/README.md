# AI Frontier Radar

An evidence-first AI research dashboard for developers. **Task 1 is a fixture-only demo:** no paid APIs, source retrieval, model generation, or persistence.

## Run locally

Requires Node.js 24 LTS and npm (the lockfile is committed).

```sh
npm ci
npm run dev
```

Open http://localhost:3000. Explore the historical demo collection with topic and inclusive date filters. Try `language models`, `agents`, or `inference`; use Oct 2022–Jul 2023. Category buttons and expandable source evidence work locally.

No environment file is needed. `.env.example` documents future server-side configuration with placeholders; never put credentials in public variables or commit `.env.local`. The requested model identifier is not yet verified for API access.

## Checks

```sh
npm run lint
npm run typecheck
npm test
npm run build
npx playwright install chromium
npm run test:e2e
```

Playwright starts the production server on port 3000, which must be free. It checks desktop/mobile interactions, empty and validation states, source links, no horizontal overflow, and no external application requests.

## Project memory

Start with [root AGENTS.md](../AGENTS.md), then [Product](../docs/PROJECT.md), [Architecture](../docs/ARCHITECTURE.md), [Decisions](../docs/DECISIONS.md), and [Progress](../docs/PROGRESS.md). Claude Code enters through [root CLAUDE.md](../CLAUDE.md).

## Fixtures and limitations

Three manually curated historical papers: [Llama 2](https://arxiv.org/abs/2307.09288v1), [GPT-4 technical report](https://arxiv.org/abs/2303.08774v1), and [ReAct](https://arxiv.org/abs/2210.03629v1). Dates reflect first publication; links pin the original versions. Summaries are paraphrases. Significance is editorial interpretation; experiments are unexecuted proposals. No automated citation verification is implemented. Keyword matching is deliberately simple and coverage is limited to these fixtures.

Tasks 2–6 require review before implementation. Live retrieval and synthesis must preserve source provenance and distinguish evidence from interpretation.
