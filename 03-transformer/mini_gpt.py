import math
import torch
import torch.nn as nn
import torch.nn.functional as F


class MultiHeadAttention(nn.Module):
    def __init__(self, hidden_size, num_heads):
        super().__init__()
        assert hidden_size % num_heads == 0
        self.hidden_size = hidden_size
        self.num_heads = num_heads
        self.head_dim = hidden_size // num_heads
        self.Wq = nn.Linear(hidden_size, hidden_size, bias=False)
        self.Wk = nn.Linear(hidden_size, hidden_size, bias=False)
        self.Wv = nn.Linear(hidden_size, hidden_size, bias=False)
        self.Wo = nn.Linear(hidden_size, hidden_size, bias=False)

    def split_heads(self, x):
        batch_size, seq_len, _ = x.shape
        return x.reshape(batch_size, seq_len, self.num_heads, self.head_dim).transpose(1, 2)

    def forward(self, x, cache=None):
        batch_size, seq_len, _ = x.shape
        q = self.split_heads(self.Wq(x))
        k = self.split_heads(self.Wk(x))
        v = self.split_heads(self.Wv(x))

        past_len = 0
        if cache is not None:
            past_k, past_v = cache
            past_len = past_k.size(2)
            k = torch.cat([past_k, k], dim=2)
            v = torch.cat([past_v, v], dim=2)

        new_cache = (k, v)
        scores = (q @ k.transpose(-2, -1)) / math.sqrt(self.head_dim)

        # Supports full-sequence prefill and multi-token cached decoding.
        query_positions = past_len + torch.arange(seq_len, device=x.device)
        key_positions = torch.arange(past_len + seq_len, device=x.device)
        mask = key_positions.unsqueeze(0) > query_positions.unsqueeze(1)
        scores = scores.masked_fill(mask, float('-inf'))

        weights = F.softmax(scores, dim=-1)
        output = weights @ v
        output = output.transpose(1, 2).contiguous().reshape(batch_size, seq_len, self.hidden_size)
        return self.Wo(output), weights, new_cache


class FeedForward(nn.Module):
    def __init__(self, hidden_size):
        super().__init__()
        self.network = nn.Sequential(
            nn.Linear(hidden_size, 4 * hidden_size),
            nn.GELU(),
            nn.Linear(4 * hidden_size, hidden_size),
        )

    def forward(self, x):
        return self.network(x)


class TransformerBlock(nn.Module):
    def __init__(self, hidden_size, num_heads):
        super().__init__()
        self.norm1 = nn.LayerNorm(hidden_size)
        self.attention = MultiHeadAttention(hidden_size, num_heads)
        self.norm2 = nn.LayerNorm(hidden_size)
        self.feed_forward = FeedForward(hidden_size)

    def forward(self, x, cache=None):
        attention_output, _, new_cache = self.attention(self.norm1(x), cache=cache)
        x = x + attention_output
        x = x + self.feed_forward(self.norm2(x))
        return x, new_cache


class MiniGPT(nn.Module):
    def __init__(self, vocab_size, max_seq_len, hidden_size, num_heads, num_layers):
        super().__init__()
        self.max_seq_len = max_seq_len
        self.token_embedding = nn.Embedding(vocab_size, hidden_size)
        self.position_embedding = nn.Embedding(max_seq_len, hidden_size)
        self.blocks = nn.ModuleList([
            TransformerBlock(hidden_size, num_heads) for _ in range(num_layers)
        ])
        self.final_norm = nn.LayerNorm(hidden_size)
        self.lm_head = nn.Linear(hidden_size, vocab_size)

    def forward(self, token_ids, cache=None, use_cache=False):
        batch_size, seq_len = token_ids.shape
        if cache is not None and len(cache) != len(self.blocks):
            raise ValueError('cache must contain one (K,V) pair per Transformer block')
        past_len = 0 if cache is None else cache[0][0].size(2)
        if past_len + seq_len > self.max_seq_len:
            raise ValueError('sequence exceeds max_seq_len')

        x = self.token_embedding(token_ids)
        positions = torch.arange(past_len, past_len + seq_len, device=token_ids.device)
        x = x + self.position_embedding(positions)

        new_caches = []
        for layer_idx, block in enumerate(self.blocks):
            layer_cache = None if cache is None else cache[layer_idx]
            x, new_layer_cache = block(x, cache=layer_cache)
            if use_cache:
                new_caches.append(new_layer_cache)

        logits = self.lm_head(self.final_norm(x))
        return (logits, new_caches) if use_cache else logits


def demo_train():
    torch.manual_seed(42)
    model = MiniGPT(vocab_size=20, max_seq_len=32, hidden_size=8, num_heads=2, num_layers=2)
    tokens = torch.tensor([[1, 5, 3, 7, 9], [2, 4, 9, 6, 8]])
    optimizer = torch.optim.AdamW(model.parameters(), lr=1e-3)
    loss_fn = nn.CrossEntropyLoss()
    before = model.token_embedding.weight.detach().clone()

    model.train()
    for step in range(200):
        inputs, targets = tokens[:, :-1], tokens[:, 1:]
        logits = model(inputs)
        loss = loss_fn(logits.reshape(-1, logits.size(-1)), targets.reshape(-1))
        optimizer.zero_grad()
        loss.backward()
        optimizer.step()
        if step % 20 == 0 or step == 199:
            print(f'step={step:03d} loss={loss.item():.4f}')

    after = model.token_embedding.weight.detach()
    print('Embedding changed:', not torch.equal(before, after))


if __name__ == '__main__':
    demo_train()
