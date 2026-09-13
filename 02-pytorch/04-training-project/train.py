import torch
from torch.utils.data import DataLoader, TensorDataset, random_split
import torch.nn as nn


class NeuralNetwork(nn.Module):

    def __init__(self):
        super().__init__()

        self.network = nn.Sequential(
            nn.Linear(1, 16),
            nn.ReLU(),
            nn.Linear(16, 1),
        )

    def forward(self, x):
        return self.network(x)

x = torch.linspace(
    -5,
    5,
    200,
).reshape(-1, 1)

y = x ** 2

dataset = TensorDataset(
    x,
    y,
)
# train / validation / test
train_size = 160
val_size = 40

train_dataset, val_dataset = random_split(
    dataset,
    [train_size, val_size],
)
train_loader = DataLoader(
    train_dataset,
    batch_size=32,
    shuffle=True,
)

val_loader = DataLoader(
    val_dataset,
    batch_size=32,
    shuffle=False,
)

model = NeuralNetwork()

loss_fn = nn.MSELoss()

optimizer = torch.optim.Adam(
    model.parameters(),
    lr=0.01,
)
best_val_loss = float("inf")
for epoch in range(100):

    # train mode
    model.train()

    train_loss = 0.0

    for batch_x, batch_y in train_loader:

        prediction = model(batch_x)

        loss = loss_fn(
            prediction,
            batch_y,
        )

        optimizer.zero_grad()

        loss.backward()

        optimizer.step()

        train_loss += loss.item()

    train_loss /= len(train_loader)

    # eval
    model.eval()

    val_loss = 0.0

    with torch.no_grad():

        for batch_x, batch_y in val_loader:

            prediction = model(batch_x)

            loss = loss_fn(
                prediction,
                batch_y,
            )

            val_loss += loss.item()

            # best loss checkpoint
            if val_loss < best_val_loss:
                best_val_loss = val_loss
                torch.save(
                    model.state_dict(),
                    "best_model.pt",
                )

    val_loss /= len(val_loader)

    # print results
    if epoch % 10 == 0:

        print(
            f"epoch={epoch:03d} "
            f"train_loss={train_loss:.4f} "
            f"val_loss={val_loss:.4f}"
        )

# final best loss
print("best loss is ", best_val_loss)