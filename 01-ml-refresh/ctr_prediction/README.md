# CTR Prediction

## Goal

This project is a quick refresh of core ML concepts through an end-to-end binary classification workflow on a synthetic CTR dataset.

The main goals are to:

1. Refresh the basic ML workflow, including data generation, preprocessing, model training, prediction, and evaluation.
2. Understand how Accuracy, Precision, Recall, F1, and ROC-AUC measure different aspects of model performance.
3. Experiment with different classification thresholds and understand the Precision–Recall trade-off.
4. Understand the difference between model scores and downstream product decisions.

## Dataset

I generated 10,000 synthetic samples representing ad impressions.

Each sample contains five features:

* `user_age`
* `historical_ctr`
* `ad_position`
* `device`
* `country`

The target variable is `clicked`, representing whether the user clicked the ad.

The model predicts:

`P(clicked = 1 | features)`

The dataset is intentionally imbalanced, with positive samples representing only a small fraction of all impressions.

## Models

I used Logistic Regression as the primary model because this is a binary classification problem and I want the model to produce a probability-like score for each sample.

I also trained a Random Forest as a comparison baseline.

For this synthetic dataset, the underlying click probability is generated from a linear combination of features followed by a sigmoid function, so Logistic Regression is also structurally well matched to the data-generation process.

## Evaluation

The Logistic Regression model achieved an ROC-AUC of approximately **0.67**.

An ROC-AUC above 0.5 indicates that the model has learned useful signal and can distinguish positive samples from negative samples better than random ranking. However, its discrimination ability is still limited.

One important observation is that **accuracy is misleading for this dataset because the classes are imbalanced**.

At a threshold of 0.5, the model predicts no positive samples and still achieves approximately **91.9% accuracy**. Despite the high accuracy, recall is zero, meaning the model fails to identify any actual clicks.

This demonstrates why accuracy alone is often insufficient for evaluating imbalanced classification problems.

### Precision and Recall

As the classification threshold increases, the model becomes more conservative about predicting a sample as positive.

In this experiment:

* Lower thresholds produce higher recall because more samples are classified as positive.
* Higher thresholds generally increase precision because the model requires stronger confidence before predicting a positive.
* However, higher thresholds also reduce recall because more true positives are missed.

At thresholds of 0.4 and 0.5, no samples receive a sufficiently high score to be classified as positive. As a result, both precision and recall become zero.

This does not necessarily mean that the model failed to learn useful patterns. It means that the model's predicted score distribution does not reach those thresholds for this evaluation dataset.

## Threshold Experiment

The threshold is not a parameter learned during model training. It is a downstream decision parameter that can be selected based on validation results and business requirements.

For example:

* If missing a positive case is very costly, recall may be prioritized and a lower threshold may be appropriate.
* If false positives are very costly, precision may be prioritized and a higher threshold may be appropriate.
* If precision and recall are similarly important, F1 can provide a useful summary metric.

Therefore, there is no universally optimal classification threshold.

## What I Learned

### 1. Accuracy can be misleading

For imbalanced datasets, a model can achieve high accuracy simply by predicting the majority class.

A model with ~92% accuracy can still be useless if its recall for the positive class is zero.

### 2. Precision and recall depend on the decision threshold

Lowering the threshold generally increases recall but introduces more false positives, reducing precision.

Increasing the threshold makes positive predictions more selective, which can improve precision while reducing recall.

### 3. ROC-AUC evaluates ranking ability across thresholds

Unlike precision, recall, F1, and accuracy at a specific threshold, ROC-AUC evaluates how well the model ranks positive samples above negative samples across possible thresholds.

Therefore, it is useful for evaluating the model's overall discrimination ability independently of one specific decision threshold.

### 4. Model scores and product decisions are different

The model produces a score or estimated probability.

A downstream system decides how to use that score:

`features → model → score → business decision`

For binary classification, the decision might involve a threshold.

For ranking systems such as ad ranking, a fixed threshold may not be necessary at all. The system can instead rank candidate ads by their predicted scores and select the top candidates.

### 5. Model improvement requires diagnosis

Poor metrics do not automatically imply that a more complex model or more training data is required.

Possible causes include weak features, noisy labels, insufficient data, model assumptions, class imbalance, calibration, or an inappropriate evaluation objective.

The bottleneck should be diagnosed before deciding how to improve the system.

## Appendix: Experiment Results

| Threshold | Precision | Recall |     F1 | Accuracy |
| --------: | --------: | -----: | -----: | -------: |
|      0.05 |    0.1039 | 0.8238 | 0.1845 |   0.4077 |
|      0.10 |    0.1420 | 0.4918 | 0.2204 |   0.7170 |
|      0.15 |    0.1939 | 0.2623 | 0.2230 |   0.8513 |
|      0.20 |    0.2308 | 0.0984 | 0.1379 |   0.9000 |
|      0.30 |    0.5000 | 0.0082 | 0.0161 |   0.9187 |
|      0.40 |    0.0000 | 0.0000 | 0.0000 |   0.9187 |
|      0.50 |    0.0000 | 0.0000 | 0.0000 |   0.9187 |

**ROC-AUC: 0.6691**
