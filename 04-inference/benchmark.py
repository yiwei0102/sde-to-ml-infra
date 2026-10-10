import argparse
import csv
import sys
import time
from pathlib import Path

import torch

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / '03-transformer'))
from mini_gpt import MiniGPT


def sync(device):
    if device.type == 'cuda':
        torch.cuda.synchronize()
    elif device.type == 'mps':
        torch.mps.synchronize()


def timed(fn, device):
    sync(device)
    start = time.perf_counter()
    result = fn()
    sync(device)
    return result, (time.perf_counter() - start) * 1000


@torch.inference_mode()
def run(model, prompt, output_tokens, use_cache, device):
    if use_cache:
        (logits, cache), prefill_ms = timed(lambda: model(prompt, use_cache=True), device)
    else:
        logits, prefill_ms = timed(lambda: model(prompt), device)
        cache = None
    next_token = logits[:, -1, :].argmax(-1, keepdim=True)
    history = prompt
    decode_ms = []
    # Time only model calls; no sampling/tokenization/network overhead.
    for i in range(output_tokens - 1):
        if use_cache:
            (logits, cache), ms = timed(lambda: model(next_token, cache=cache, use_cache=True), device)
        else:
            history = torch.cat([history, next_token], dim=1)
            logits, ms = timed(lambda: model(history), device)
        decode_ms.append(ms)
        next_token = logits[:, -1, :].argmax(-1, keepdim=True)
    return prefill_ms, decode_ms


def main():
    p = argparse.ArgumentParser()
    p.add_argument('--device', choices=['cpu', 'mps', 'cuda'], default='cpu')
    p.add_argument('--runs', type=int, default=3)
    args = p.parse_args()
    device = torch.device(args.device)
    torch.manual_seed(42)
    model = MiniGPT(vocab_size=256, max_seq_len=2048, hidden_size=128, num_heads=4, num_layers=4).to(device).eval()
    rows = []
    for prompt_len in [128,256,512,1024]:
        prompt = torch.randint(0, 256, (1, prompt_len), device=device)
        for use_cache in [False, True]:
            # warm up device and kernels; don't record warmup
            run(model, prompt, 16, use_cache, device)
            for trial in range(args.runs):
                prefill_ms, decode_ms = run(model, prompt, 16, use_cache, device)
                rows.append({
                    'device': args.device, 'prompt_tokens': prompt_len,
                    'output_tokens': 16, 'cache': use_cache, 'trial': trial,
                    'prefill_ms': round(prefill_ms, 3),
                    'decode_mean_ms': round(sum(decode_ms) / len(decode_ms), 3),
                    'total_model_ms': round(prefill_ms + sum(decode_ms), 3),
                })
                print(rows[-1])
    out = Path(__file__).with_name('results.csv')
    with out.open('w', newline='') as f:
        writer = csv.DictWriter(f, fieldnames=rows[0].keys())
        writer.writeheader()
        writer.writerows(rows)
    print(f'Wrote {out}')


if __name__ == '__main__':
    main()
