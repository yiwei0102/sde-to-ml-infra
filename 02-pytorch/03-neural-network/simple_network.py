import torch
import torch.nn as nn


class SimpleNetwork(nn.Module):

    def __init__(self):
        super().__init__()

        self.linear = nn.Linear(
            in_features=1,
            out_features=1,
        )

    def forward(self, x):
        return self.linear(x)


x = torch.tensor([
    [1.0],
    [2.0],
    [3.0],
    [4.0],
])

y = torch.tensor([
    [4.0],
    [8.0],
    [12.0],
    [16.0],
])


model = SimpleNetwork()

loss_fn = nn.MSELoss()

optimizer = torch.optim.SGD(
    model.parameters(),
    lr=0.01,
)


for epoch in range(200):

    # Forward
    prediction = model(x)

    # Loss
    loss = loss_fn(
        prediction,
        y,
    )

    # Clear old gradients
    optimizer.zero_grad()

    # Backward
    loss.backward()

    # Update parameters
    optimizer.step()

    if epoch % 20 == 0:
        print(
            f"epoch={epoch:03d} "
            f"loss={loss.item():.4f}"
        )


print("\nLearned parameters:")

for name, parameter in model.named_parameters():
    print(
        name,
        parameter.data,
    )