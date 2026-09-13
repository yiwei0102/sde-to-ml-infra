from pathlib import Path

import joblib
import numpy as np
from sklearn.metrics import (
    accuracy_score,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)

from train import generate_data


MODEL_PATH = (
    Path(__file__).parent
    / "models"
    / "logistic_regression.joblib"
)


def evaluate_at_threshold(y_true, probabilities, threshold):
    predictions = (probabilities >= threshold).astype(int)

    print(f"\nThreshold = {threshold}")
    print("-" * 30)

    print(
        "Precision:",
        round(precision_score(y_true, predictions, zero_division=0), 4),
    )

    print(
        "Recall:",
        round(recall_score(y_true, predictions, zero_division=0), 4),
    )

    print(
        "F1:",
        round(f1_score(y_true, predictions, zero_division=0), 4),
    )

    print(
        "Accuracy:",
        round(accuracy_score(y_true, predictions), 4),
    )


def main():
    model = joblib.load(MODEL_PATH)

    print(f"Loaded model from: {MODEL_PATH}")

    df = generate_data(
        n_samples=3000,
        random_state=123,
    )

    X = df.drop(columns=["clicked"])
    y = df["clicked"]

    probabilities = model.predict_proba(X)[:, 1]

    print(
        "\nROC-AUC:",
        round(roc_auc_score(y, probabilities), 4),
    )

    for threshold in [0.1, 0.2, 0.3, 0.5]:
        evaluate_at_threshold(
            y,
            probabilities,
            threshold,
        )


if __name__ == "__main__":
    main()