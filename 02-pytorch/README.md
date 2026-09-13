# Week 2 — PyTorch & Deep Learning Fundamentals

## Goal

Learn the core PyTorch abstractions behind neural network training and build a complete mini training pipeline.

## What I Learned

### Tensor Fundamentals

* Tensor shapes, dtypes, and devices
* Matrix multiplication and reshaping
* Moving tensors between CPU and accelerators
* FP32 vs FP16 memory usage
* Why neural networks rely heavily on matrix operations

### Autograd

PyTorch automatically tracks operations involving tensors with `requires_grad=True`.

A basic training step follows:

```text
Forward
→ Loss
→ Backward
→ Gradient
→ Parameter Update
```

`loss.backward()` computes gradients for model parameters, while the optimizer uses those gradients to update the parameters.

Gradients accumulate by default in PyTorch, so they must be cleared between training steps.

### Optimizers

I implemented parameter updates manually and then replaced them with PyTorch optimizers.

```python
optimizer.zero_grad()
loss.backward()
optimizer.step()
```

I experimented with different learning rates and observed that:

* A very small learning rate converges slowly.
* A larger learning rate can converge faster.
* A learning rate that is too large can overshoot or diverge.

### Neural Networks

I built a small neural network:

```text
Input
→ Linear
→ ReLU
→ Linear
→ Output
```

Stacking only linear layers still produces a linear transformation. Activation functions such as ReLU introduce nonlinearity and allow neural networks to learn nonlinear relationships.

The network successfully learned an approximation of:

```text
y = x²
```

### Dataset, DataLoader, Batch, and Epoch

I used PyTorch `Dataset` and `DataLoader` to implement mini-batch training.

Key concepts:

* **Batch:** a subset of training samples processed in one training step
* **Epoch:** one complete pass through the training dataset
* **DataLoader:** creates and optionally shuffles mini-batches

Smaller batches produced more frequent but noisier parameter updates, while larger batches produced more stable gradients but fewer updates per epoch.

### Training and Validation

I split the dataset into training and validation sets.

Training uses:

```text
model.train()
→ forward
→ loss
→ backward
→ optimizer.step()
```

Validation uses:

```text
model.eval()
→ torch.no_grad()
→ forward
→ validation loss
```

Validation data is not used to update model parameters and helps measure generalization.

### Checkpointing

I saved the model with the best validation loss using:

```python
torch.save(model.state_dict(), "best_model.pt")
```

This avoids selecting a model only because it achieved a low training loss.

## Key Takeaways

The core PyTorch training pipeline is:

```text
Dataset
→ DataLoader
→ Batch
→ Model
→ Forward
→ Loss
→ Backward
→ Gradients
→ Optimizer
→ Parameter Update
→ Validation
→ Checkpoint
```

These same abstractions scale from small neural networks to much larger deep learning and LLM systems.
