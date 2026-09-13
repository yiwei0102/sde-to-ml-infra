import torch


w = torch.tensor(
    2.0,
    requires_grad=True,
)

x = torch.tensor(3.0)
target = torch.tensor(12.0)

optimizer = torch.optim.SGD(
    [w],
    lr=0.01,
)


for step in range(20):

    prediction = w * x

    loss = (prediction - target) ** 2

    optimizer.zero_grad()

    loss.backward()

    optimizer.step()

    print(
        f"step={step:02d} "
        f"w={w.item():.4f} "
        f"loss={loss.item():.4f}"
    )