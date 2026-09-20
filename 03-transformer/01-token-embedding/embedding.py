import torch
import torch.nn as nn


vocab_size = 10
embedding_dim = 4

embedding = nn.Embedding(
    num_embeddings=vocab_size,
    embedding_dim=embedding_dim,
)


token_ids = torch.tensor([
    2,
    5,
    1,
])


vectors = embedding(token_ids)


print("Token IDs:")
print(token_ids)

print("\nToken IDs shape:")
print(token_ids.shape)

print("\nEmbeddings:")
print(vectors)

print("\nEmbedding shape:")
print(vectors.shape)

print("\nEmbedding weight shape:")
print(embedding.weight.shape)