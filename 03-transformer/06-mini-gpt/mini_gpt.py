import torch
import torch.nn as nn
import math
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

        batch_size, seq_len, hidden_size = x.shape

        x = x.reshape(
            batch_size,
            seq_len,
            self.num_heads,
            self.head_dim,
        )

        x = x.transpose(1, 2)

        return x

    def forward(self, X):
        batch_size, seq_len, _ = X.shape

        # 1. Q / K / V projections
        Q = self.Wq(X)
        K = self.Wk(X)
        V = self.Wv(X)

        # 2. Split into heads
        Q = self.split_heads(Q)
        K = self.split_heads(K)
        V = self.split_heads(V)

        # 3. Attention scores
        scores = Q @ K.transpose(-2, -1)

        # 4. Scale
        scores = scores / math.sqrt(self.head_dim)

        # 5. Causal mask
        mask = torch.triu(
            torch.ones(
                seq_len,
                seq_len,
                device=X.device,
                dtype=torch.bool,
            ),
            diagonal=1,
        )

        scores = scores.masked_fill(
            mask,
            float("-inf"),
        )

        # 6. Attention weights
        attention_weights = F.softmax(
            scores,
            dim=-1,
        )

        # 7. Weighted Values
        output = attention_weights @ V

        # 8. Combine heads
        output = output.transpose(1, 2)

        output = output.reshape(
            batch_size,
            seq_len,
            self.hidden_size,
        )

        # 9. Mix heads
        output = self.Wo(output)

        return output, attention_weights
            
class FeedForward(nn.Module):

    def __init__(self, hidden_size):
        super().__init__()

        self.network = nn.Sequential(
            nn.Linear(
                hidden_size,
                hidden_size * 4,
            ),
            nn.GELU(),
            nn.Linear(
                hidden_size * 4,
                hidden_size,
            ),
        )

    def forward(self, x):
        return self.network(x)

class TransformerBlock(nn.Module):

    def __init__(self, hidden_size, num_heads):
        super().__init__()

        self.norm1 = nn.LayerNorm(hidden_size)

        self.attention = MultiHeadAttention(
            hidden_size,
            num_heads,
        )

        self.norm2 = nn.LayerNorm(hidden_size)

        self.feed_forward = FeedForward(
            hidden_size,
        )

    def forward(self, x):

        # Attention + residual
        normalized_x = self.norm1(x)

        attention_output, _ = self.attention(
            normalized_x
        )

        x = x + attention_output

        # FeedForward + residual
        normalized_x = self.norm2(x)

        ff_output = self.feed_forward(
            normalized_x
        )

        x = x + ff_output

        return x

class MiniGPT(nn.Module):


    def __init__(
        self,
        vocab_size,
        max_seq_len,
        hidden_size,
        num_heads,
        num_layers,
    ):
        super().__init__()

        self.token_embedding = nn.Embedding(
            vocab_size,
            hidden_size,
        )

        self.position_embedding = nn.Embedding(
            max_seq_len,
            hidden_size,
        )

        self.blocks = nn.ModuleList([
            TransformerBlock(
                hidden_size,
                num_heads,
            )
            for _ in range(num_layers)
        ])

        self.final_norm = nn.LayerNorm(
            hidden_size
        )

        self.lm_head = nn.Linear(
            hidden_size,
            vocab_size,
        )
    def forward(self, token_ids):
        batch_size, seq_len = token_ids.shape

        # Token embeddings
        x = self.token_embedding(token_ids)

        # Position embeddings
        positions = torch.arange(
            seq_len,
            device=token_ids.device,
        )

        x = x + self.position_embedding(positions)

        # Transformer blocks
        for block in self.blocks:
            x = block(x)

        # Final normalization
        x = self.final_norm(x)

        # Predict vocabulary scores
        logits = self.lm_head(x)

        return logits


torch.manual_seed(42)

model = MiniGPT(
    vocab_size=20,
    max_seq_len=32,
    hidden_size=8,
    num_heads=2,
    num_layers=2,
)

tokens = torch.tensor([
    [1, 5, 3, 7, 9],
    [2, 4, 9, 6, 8],
])
optimizer = torch.optim.AdamW(
    model.parameters(),
    lr=1e-3,
)

loss_fn = nn.CrossEntropyLoss()
before = model.token_embedding.weight.detach().clone()

for step in range(200):

    inputs = tokens[:, :-1]
    targets = tokens[:, 1:]

    # Forward
    logits = model(inputs)

    # [batch, seq, vocab]
    # →
    # [batch * seq, vocab]
    logits = logits.reshape(
        -1,
        logits.size(-1),
    )

    targets = targets.reshape(-1)

    # Loss
    loss = loss_fn(
        logits,
        targets,
    )

    # Backward
    optimizer.zero_grad()
    loss.backward()
    optimizer.step()

    if step % 20 == 0:
        print(
            f"step={step:03d} "
            f"loss={loss.item():.4f}"
        )
after = model.token_embedding.weight.detach().clone()

print(
    "Embedding changed:",
    not torch.equal(before, after)
)