import torch

w = torch.tensor(2.0, requires_grad=True)
x = torch.tensor(3.0)
target = torch.tensor(12.0)

learning_rate = 0.1

for step in range(20):
    prediction = w * x
    loss = (prediction - target) ** 2

    loss.backward()

    with torch.no_grad():
        w -= learning_rate * w.grad

    # very important
    w.grad.zero_()

    print(
        f"step={step:02d} "
        f"w={w.item():.4f} "
        f"prediction={prediction.item():.4f} "
        f"loss={loss.item():.4f}"
    )