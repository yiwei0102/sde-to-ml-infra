"""Benchmark an OpenAI-compatible vLLM chat server with concurrent streaming requests.

Run from the GPU pod, where the server is available at http://127.0.0.1:8000/v1.
Requires: pip install openai
"""
import argparse
import asyncio
import csv
import statistics
import time
from pathlib import Path

from openai import AsyncOpenAI

PROMPTS = [
    "Explain how a Transformer KV cache speeds up autoregressive decoding. Focus on attention keys and values.",
    "Explain continuous batching in LLM inference serving and why it improves GPU utilization.",
    "Describe the difference between prefill and decode in Transformer inference.",
    "Explain how paged KV cache allocation reduces memory fragmentation in LLM serving.",
]


def percentile(values, p):
    if not values:
        return float("nan")
    ordered = sorted(values)
    pos = (len(ordered) - 1) * p / 100
    low = int(pos)
    high = min(low + 1, len(ordered) - 1)
    return ordered[low] + (ordered[high] - ordered[low]) * (pos - low)


async def one_request(client, model, index, max_tokens):
    start = time.perf_counter()
    first_content = None
    content_events = []
    usage = None
    error = ""
    try:
        stream = await client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": PROMPTS[index % len(PROMPTS)]}],
            max_tokens=max_tokens,
            temperature=0,
            stream=True,
            stream_options={"include_usage": True},
        )
        async for chunk in stream:
            if chunk.usage is not None:
                usage = chunk.usage
            for choice in chunk.choices:
                if choice.delta.content:
                    now = time.perf_counter()
                    if first_content is None:
                        first_content = now
                    content_events.append(now)
    except Exception as exc:
        error = f"{type(exc).__name__}: {exc}"
    end = time.perf_counter()
    output_tokens = usage.completion_tokens if usage else None
    # Event gaps are only a rough streaming proxy: one event may contain multiple tokens.
    gaps_ms = [(b - a) * 1000 for a, b in zip(content_events, content_events[1:])]
    return {
        "request_id": index,
        "success": not bool(error) and first_content is not None,
        "error": error,
        "ttft_ms": (first_content - start) * 1000 if first_content else None,
        "e2e_ms": (end - start) * 1000,
        "output_tokens": output_tokens,
        "content_events": len(content_events),
        "mean_content_event_gap_ms": statistics.mean(gaps_ms) if gaps_ms else None,
    }


async def run_level(client, model, concurrency, requests, max_tokens):
    semaphore = asyncio.Semaphore(concurrency)
    async def limited(i):
        async with semaphore:
            return await one_request(client, model, i, max_tokens)
    start = time.perf_counter()
    rows = await asyncio.gather(*(limited(i) for i in range(requests)))
    wall = time.perf_counter() - start
    good = [r for r in rows if r["success"]]
    ttfts = [r["ttft_ms"] for r in good]
    e2es = [r["e2e_ms"] for r in good]
    known_tokens = [r["output_tokens"] for r in good if r["output_tokens"] is not None]
    return {
        "concurrency": concurrency,
        "requests": requests,
        "successes": len(good),
        "failures": requests - len(good),
        "wall_seconds": round(wall, 3),
        "requests_per_sec": round(len(good) / wall, 3),
        "output_tokens_per_sec": round(sum(known_tokens) / wall, 3) if len(known_tokens) == len(good) and good else "",
        "mean_ttft_ms": round(statistics.mean(ttfts), 2) if ttfts else "",
        "p95_ttft_ms": round(percentile(ttfts, 95), 2) if ttfts else "",
        "p95_e2e_ms": round(percentile(e2es, 95), 2) if e2es else "",
    }, rows


async def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--base-url", default="http://127.0.0.1:8000/v1")
    parser.add_argument("--model", default="Qwen/Qwen2.5-0.5B-Instruct")
    parser.add_argument("--concurrency", default="1,2,4,8,16")
    parser.add_argument("--requests-per-level", type=int, default=32)
    parser.add_argument("--max-tokens", type=int, default=128)
    parser.add_argument("--output", default="results.csv")
    args = parser.parse_args()
    levels = [int(x) for x in args.concurrency.split(",")]
    if not levels or min(levels) < 1 or args.requests_per_level < 1 or args.max_tokens < 1:
        parser.error("concurrency, requests-per-level, and max-tokens must be positive")
    client = AsyncOpenAI(base_url=args.base_url, api_key="EMPTY", timeout=180.0, max_retries=0)
    summaries = []
    try:
        for level in levels:
            summary, rows = await run_level(client, args.model, level, args.requests_per_level, args.max_tokens)
            summaries.append(summary)
            print(summary, flush=True)
            for r in rows:
                if r["error"]:
                    print(f"  request {r['request_id']} failed: {r['error']}", flush=True)
    finally:
        await client.close()
    output = Path(args.output)
    output.parent.mkdir(parents=True, exist_ok=True)
    with output.open("w", newline="") as f:
        writer = csv.DictWriter(f, fieldnames=list(summaries[0]))
        writer.writeheader()
        writer.writerows(summaries)
    print(f"Saved {output.resolve()}")
    print("Note: TTFT is client-observed; this benchmark does not report true token-level TPOT.")


if __name__ == "__main__":
    asyncio.run(main())
