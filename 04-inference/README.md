# LLM Inference Benchmark

## Objective

Measure how KV caching affects autoregressive decoding latency as prompt length increases.

## Setup

- Model: Custom decoder-only MiniGPT from Week 3
- Backend: Apple Silicon MPS
- Prompt lengths: 128, 256, 512, 1024 tokens
- Generated tokens: 16
- Trials: 3 per configuration
- Comparison: Full-prefix recomputation vs. KV-cached decoding

## Results

| Prompt tokens | No Cache (ms/token) | KV Cache (ms/token) | Speedup |
|---|---:|---:|---:|
| 128 | 3.41 | 3.52 | 0.97x |
| 256 | 3.69 | 3.63 | 1.02x |
| 512 | 5.20 | 3.40 | 1.53x |
| 1024 | 11.56 | 3.71 | 3.11x |

## Key Findings

1. **KV caching becomes more beneficial with longer contexts.** At 1024 prompt tokens, cached decoding achieved approximately 3.11x lower mean per-token execution time.
2. **Small workloads are dominated by overhead.** At 128 and 256 tokens, the differences were small relative to trial-to-trial variation.
3. **KV caching primarily optimizes decode, not prefill.** Prefill still processes the prompt to construct the initial KV cache.
4. **Performance is workload- and hardware-dependent.** These results describe a small custom model on Apple Silicon MPS, not production LLM serving on NVIDIA GPUs.

## Limitations

- Only three trials per configuration
- Small model and short generation length
- No concurrent requests or dynamic batching
- No network, tokenization, or sampling overhead
- MPS timing accuracy depends on correct device synchronization
- GPU memory consumption was not measured

## Next Steps

Investigate how batching, concurrency, and KV-cache memory consumption affect inference throughput and latency.