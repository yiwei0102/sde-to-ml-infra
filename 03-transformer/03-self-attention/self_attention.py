import math
import torch
import torch.nn as nn
import torch.nn.functional as F


class SelfAttention(nn.Module):

    def __init__(self, hidden_size):
        super().__init__()

        self.hidden_size = hidden_size

        self.Wq = nn.Linear(hidden_size, hidden_size, bias=False)
        self.Wk = nn.Linear(hidden_size, hidden_size, bias=False)
        self.Wv = nn.Linear(hidden_size, hidden_size, bias=False)

    def forward(self, X):

        Q = self.Wq(X)
        K = self.Wk(X)
        V = self.Wv(X)

        scores = Q @ K.transpose(-2, -1)

        scores = scores / math.sqrt(self.hidden_size)
        seq_len = X.shape[-2]
        mask = torch.triu(
            torch.ones(
                seq_len,
                seq_len,
                device=X.device,
                dtype=torch.bool,
            ),
            diagonal=1,
        )
        scores = scores.masked_fill(mask, float("-inf"))

        attention_weights = F.softmax(scores, dim=-1)

        output = attention_weights @ V

        return output, attention_weights


torch.manual_seed(42)

X = torch.randn(
    2,   # batch
    4,   # sequence
    8,   # hidden
)

attention = SelfAttention(hidden_size=8)

output, weights = attention(X)

print("X shape:")
print(X.shape)

print("\nAttention weights shape:")
print(weights.shape)

print("\nAttention weights for batch 0:")
print(weights[0])

print("\nOutput shape:")
print(output.shape)