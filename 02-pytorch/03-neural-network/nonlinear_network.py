import torch
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

model = NeuralNetwork()

loss_fn = nn.MSELoss()

optimizer = torch.optim.Adam(
    model.parameters(),
    lr=0.01,
)


for epoch in range(1000):

    prediction = model(x)

    loss = loss_fn(
        prediction,
        y,
    )

    optimizer.zero_grad()

    loss.backward()

    optimizer.step()

    if epoch % 100 == 0:
        print(
            f"epoch={epoch:04d} "
            f"loss={loss.item():.4f}"
        )

test_x = torch.tensor([
    [-4.0],
    [-2.0],
    [0.0],
    [2.0],
    [4.0],
])


with torch.no_grad():
    test_prediction = model(test_x)


print("\nPredictions:")

for input_value, predicted_value in zip(
    test_x,
    test_prediction,
):
    print(
        f"x={input_value.item():.1f} "
        f"predicted={predicted_value.item():.2f} "
        f"expected={input_value.item() ** 2:.2f}"
    )