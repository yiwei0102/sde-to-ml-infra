# MiniGPT: Decoder-only Transformer with KV Cache

A small PyTorch decoder-only Transformer built to understand causal attention and validate incremental inference. This is an educational implementation, not a production serving engine.

## Architecture

`token IDs → token + learned absolute position embeddings → N pre-norm Transformer blocks → final LayerNorm → LM head → logits`

Each block: `x = x + attention(norm1(x))`, followed by `x = x + MLP(norm2(x))`.

## Tensor shapes

| Tensor | Shape |
| --- | --- |
| Hidden states | `[B, T, C]` |
| Q/K/V split into heads | `[B, H, T, D]`, `D=C/H` |
| Full attention scores | `[B, H, T, T]` |
| Cached decoding scores (one new token) | `[B, H, 1, T_total]` |
| LM logits | `[B, T, vocab_size]` |

## KV cache

Each layer stores its own `(K, V)` tensors. Prefill creates the cache; subsequent calls append new K/V along the sequence axis while computing Q only for new tokens. Absolute position IDs are offset by the cached sequence length. The causal mask accounts for the offset and also supports multiple new tokens in one cached call.

**Trade-off:** KV caching avoids repeated historical projections and block computations, but cache memory grows with sequence length, concurrency, and layer count. This simple implementation uses `torch.cat` for clarity; it does not implement memory-efficient paged allocation, eviction, or production scheduling.

## Run

Requires Python and PyTorch.

```bash
python mini_gpt.py
python -m unittest -v test_kv_cache.py
```

## Correctness checks

- Token-by-token cached inference matches a full forward pass.
- Prefill followed by multi-token cached decode matches a full forward pass.
- The original training path still supports backpropagation.
- Inputs beyond the configured maximum sequence length are rejected.

Numerical comparisons use floating-point tolerances (`atol=1e-5`, `rtol=1e-5`).

## Scope and next steps

This uses learned absolute positional embeddings and standard multi-head attention. It does **not** implement RoPE, GQA, continuous batching, PagedAttention, quantization, or GPU benchmarking. Those belong to the inference/serving phase.
