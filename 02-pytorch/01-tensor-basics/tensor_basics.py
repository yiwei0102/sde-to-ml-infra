import torch

# tensor
x = torch.tensor([
    [1.0, 2.0, 3.0],
    [4.0, 5.0, 6.0],
])

print("x:")
print(x)

print("\nshape:")
print(x.shape)

print("\ndtype:")
print(x.dtype)

print("\ndim:")
print(x.ndim)

a = torch.tensor([
    [1.0, 2.0],
    [3.0, 4.0],
])

b = torch.tensor([
    [5.0, 6.0],
    [7.0, 8.0],
])

# operations 
# focus on @
print("\na + b:")
print(a + b)

print("\na * b:")
print(a * b)

print("\na @ b:")
print(a @ b)

x = torch.arange(12)

print("\noriginal:")
print(x)
print(x.shape)

x = x.reshape(3, 4)

print("\nreshaped:")
print(x)
print(x.shape)

# CPU / GPU / MPS
if torch.backends.mps.is_available():
    device = torch.device("mps")
else:
    device = torch.device("cpu")

print("\ndevice:", device)

x = torch.randn(1000, 1000)

print("before:", x.device)

x = x.to(device)

print("after:", x.device)

# dtype
x_fp32 = torch.randn(
    1000,
    1000,
    dtype=torch.float32,
)

x_fp16 = x_fp32.to(torch.float16)

print("\nFP32:")
print(x_fp32.dtype)
print(
    "memory:",
    x_fp32.numel() * x_fp32.element_size(),
    "bytes",
)

print("\nFP16:")
print(x_fp16.dtype)
print(
    "memory:",
    x_fp16.numel() * x_fp16.element_size(),
    "bytes",
)