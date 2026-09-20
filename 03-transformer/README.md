# Transformer From Scratch

A from-scratch implementation of a decoder-only Transformer using PyTorch primitives.

## Progress

- [x] Token embeddings
- [x] Positional embeddings
- [x] Scaled dot-product self-attention
- [x] Causal masking
- [x] Multi-head attention
- [x] Feed-forward network
- [x] Residual connections and LayerNorm
- [x] Transformer block
- [x] MiniGPT forward pass
- [x] Next-token training with shifted labels
- [ ] Autoregressive generation
- [ ] KV cache

## Training Sanity Check

A tiny dataset was intentionally overfit to verify the end-to-end training pipeline.

- Initial loss: ~2.99
- Loss after 180 steps: ~0.57
- Verified that token embeddings were updated during training