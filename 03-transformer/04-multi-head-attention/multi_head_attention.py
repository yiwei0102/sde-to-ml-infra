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
            

torch.manual_seed(42)

X = torch.randn(
    2,  # batch
    4,  # seq
    8,  # hidden
)

attention = MultiHeadAttention(
    hidden_size=8,
    num_heads=2,
)

output, weights = attention(X)

print("Input:")
print(X.shape)

print("\nAttention weights:")
print(weights.shape)

print("\nHead 0:")
print(weights[0, 0])

print("\nHead 1:")
print(weights[0, 1])

print("\nOutput:")
print(output.shape)