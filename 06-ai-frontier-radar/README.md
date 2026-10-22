# AI Frontier Radar

An evidence-first AI research dashboard for developers. **The dashboard is a fixture-only demo.** Task 2 adds a separate public-source retrieval endpoint; no paid APIs, model generation, or persistence.

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

Tasks 3–6 require review before implementation. Live retrieval and synthesis must preserve source provenance and distinguish evidence from interpretation.


## Public-source endpoint (Task 2)

With the app running, invoke the source-only endpoint:

```sh
curl http://localhost:3000/api/sources \
  -H 'Content-Type: application/json' \
  -d '{"topic":"language models","start":"2023-01-01","end":"2023-12-31"}'
```

This contacts public arXiv and OpenAI RSS endpoints. No keys or paid APIs are used. It returns normalized source metadata and abstract/feed evidence, provider status, counted exclusions and limitations; it does not generate findings or change the demo dashboard. A provider can be unavailable while the other returns results. Both unavailable returns HTTP 503; invalid input returns 400.

Coverage is bounded to ten arXiv candidates and the current official feed, with at most ten returned records per provider. Older coverage is not guaranteed. Unknown dates and malformed records are excluded explicitly. Repeated requests within arXiv's three-second cooldown may return partial results. The limiter is process-local: do not deploy multiple instances without coordinating the provider rate limit. The source endpoint is intended for local review; public hosting controls remain a later milestone.
