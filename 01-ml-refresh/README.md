
# ML Refresh

## Model Selection Cheatsheet

| Problem | Model | Why |
|---|---|---|
| Continuous prediction | Linear Regression | Simple interpretable baseline |
| Binary classification | Logistic Regression | Simple probabilistic classifier |
| Nonlinear tabular data | Decision Tree | Learns thresholds and feature interactions |
| Stronger tree baseline | Random Forest | Reduces variance through bagging |
| High-performance tabular ML | XGBoost | Sequentially corrects previous errors |
| Similarity-based prediction | KNN | Predicts from nearby samples |
| Maximum-margin classification | SVM | Strong classifier for some small/high-dimensional datasets |
| Clustering | K-Means | Finds groups without labels |
| Dimensionality reduction | PCA | Compresses correlated high-dimensional features |

## Key Takeaways

- Start with a simple baseline before increasing model complexity.
- Model choice depends on the structure of the data and the business problem.
- Accuracy alone can be misleading for imbalanced classification.
- Model score and product decision are different concepts.
- Threshold selection depends on business trade-offs.
- ROC-AUC measures discrimination/ranking ability across thresholds.
- More complex models are not automatically better.