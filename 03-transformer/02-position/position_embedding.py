import torch
import torch.nn as nn


batch_size = 2
seq_len = 3
embedding_dim = 4
vocab_size = 10


token_embedding = nn.Embedding(
    vocab_size,
    embedding_dim,
)

position_embedding = nn.Embedding(
    seq_len,
    embedding_dim,
)


token_ids = torch.tensor([
    [2, 5, 1],
    [7, 3, 9],
])


token_vectors = token_embedding(token_ids)

positions = torch.arange(seq_len)

position_vectors = position_embedding(positions)


print("token vectors:", token_vectors.shape)
print("positions:", positions.shape)
print("position vectors:", position_vectors.shape)
print(token_embedding)
print(position_embedding)