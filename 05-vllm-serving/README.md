# Week 5 — vLLM Serving Benchmark

## Objective

Deploy a real LLM inference server using vLLM on an NVIDIA GPU and evaluate how request concurrency affects throughput and latency.

## Environment

- GPU: NVIDIA RTX 4090
- Inference engine: vLLM 0.31.0
- Model: Qwen/Qwen2.5-0.5B-Instruct
- API: OpenAI-compatible Chat Completions API
- Workload: 32 requests per concurrency level, maximum 128 output tokens
- Concurrency levels: 1, 2, 4, 8, 16

## Results

| Concurrency | Requests/s | Output Tokens/s | p95 TTFT (ms) | p95 E2E (ms) |
|---|---:|---:|---:|---:|
| 1 | 4.08 | 522 | 24.16 | 249.35 |
| 2 | 7.23 | 925 | 27.19 | 279.83 |
| 4 | 14.54 | 1,861 | 30.73 | 282.34 |
| 8 | 27.50 | 3,520 | 35.63 | 293.05 |
| 16 | 48.87 | 6,255 | 55.41 | 331.31 |

All 160 requests completed successfully.

## Key Findings

1. Aggregate generation throughput increased approximately 12x when concurrency increased from 1 to 16.
2. p95 time to first token increased from 24.16 ms to 55.41 ms.
3. p95 end-to-end latency increased approximately 33%, substantially less than the throughput improvement.
4. Higher concurrency improved serving efficiency for this workload, but also increased user-facing latency.

## Serving Insights

- Continuous batching enables an inference engine to share GPU execution across active requests.
- Throughput and latency must be evaluated together.
- The optimal concurrency level depends on workload characteristics and latency SLOs.
- GPU memory and KV-cache capacity constrain the number of requests that can be scheduled simultaneously.

## Limitations

- The model is relatively small (0.5B parameters).
- Each configuration contains only 32 requests, limiting the statistical reliability of p95 estimates.
- TTFT is measured from the client, not directly inside the GPU execution engine.
- Exact token-level TPOT was not measured.
- The experiment does not establish the maximum sustainable serving capacity.
- Larger models, longer contexts, and realistic request arrival distributions may produce different scaling behavior.

## Next Steps

Investigate PagedAttention, KV-cache block allocation, continuous batching scheduling, and quantization trade-offs.