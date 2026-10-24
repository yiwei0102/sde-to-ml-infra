# AI Frontier Radar

An evidence-first AI research dashboard for developers. **The dashboard is a fixture-only demo.** The backend provides public-source retrieval and disabled-by-default structured synthesis. No paid verification calls have been made; there is no persistence.

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

Tasks 5–6 require review before implementation. Live retrieval and synthesis must preserve source provenance and distinguish evidence from interpretation.


## Public-source endpoint (Task 2)

With the app running, invoke the source-only endpoint:

```sh
curl http://localhost:3000/api/sources \
  -H 'Content-Type: application/json' \
  -d '{"topic":"language models","start":"2023-01-01","end":"2023-12-31"}'
```

This contacts public arXiv and OpenAI RSS endpoints. No keys or paid APIs are used. It returns normalized source metadata and abstract/feed evidence, provider status, counted exclusions and limitations; it does not generate findings or change the demo dashboard. A provider can be unavailable while the other returns results. Both unavailable returns HTTP 503; invalid input returns 400.

Coverage is bounded to ten arXiv candidates and the current official feed, with at most ten returned records per provider. Older coverage is not guaranteed. Unknown dates and malformed records are excluded explicitly. Repeated requests within arXiv's three-second cooldown may return partial results. The limiter is process-local: do not deploy multiple instances without coordinating the provider rate limit. The source endpoint is intended for local review; public hosting controls remain a later milestone.


## Structured research endpoint (Task 3)

`POST /api/research` uses the same query body as `/api/sources`, then performs one structured OpenAI synthesis request if explicitly enabled. It defaults to HTTP 503 with `error.code=disabled`; a valid server-side key/model and `ENABLE_LLM_SYNTHESIS=true` are required to enable spending. `.env.example` contains placeholders only. No paid verification has been performed.

The configured example remains `gpt-6.1-sol`. Its official documentation lists structured-output support; account-specific access remains untested. The endpoint accepts at most 4096 request bytes, bounds source excerpts/output tokens, disables automatic retries, and retains sources if the model fails. These limits are not a dollar budget guarantee. Do not expose it publicly before reviewing access/spending controls.

Findings reference server-owned source IDs. Task 4 accepts exact full source-sentence claims as **source-reported**, with citation metadata from retrieved records. Missing/mismatched quotes and paraphrases are withheld with unsupported reasons; findings with no accepted claims are omitted. Source attribution does not establish factual truth or general entailment. Interpretations and unexecuted experiments remain unverified and labeled separately. Task 5 live UI integration is not implemented. The existing dashboard stays demo-only and does not call this endpoint.

See [the code-review and data-flow guide](../docs/CODE_REVIEW.md) for a core-file map, diagrams and a step-by-step review exercise. Task 3 baseline commit: `21387ce`.


## Evidence policy (Task 4)

Prompt/schema `research-v2` requires claim evidence as `{ sourceId, quote }`. Policy `extractive-v1` checks a complete original sentence (at least 20 characters), exact claim/quote equality after whitespace/Unicode normalization, and membership in the evidence actually supplied to the model. It preserves case, numbers, punctuation and negation. Every cited source needs exactly one matching quote. Input clipping/omissions remain disclosed; model-authored citation links are rejected by recognized URL/DOI/Markdown patterns.

Inspect `synthesis.evidenceValidation` for accepted counts, withheld claims/findings and reasons. A generated report can contain zero accepted findings. Citation context helps human review; no independent fact-checking or general semantic entailment is claimed. English sentence segmentation and a conservative extractive policy intentionally reduce recall. The UI remains fixture-only, synthesis defaults off, and model verification remains mocked only. See the Task 4 section of [the review guide](../docs/CODE_REVIEW.md).
