import numpy as np
import pandas as pd
from pathlib import Path

import joblib

from sklearn.compose import ColumnTransformer
from sklearn.ensemble import RandomForestClassifier
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import (
    accuracy_score,
    f1_score,
    precision_score,
    recall_score,
    roc_auc_score,
)
from sklearn.model_selection import train_test_split
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder, StandardScaler


def generate_data(n_samples=10_000, random_state=42):
    rng = np.random.default_rng(random_state)

    data = pd.DataFrame(
        {
            "user_age": rng.integers(18, 65, size=n_samples),
            "historical_ctr": rng.uniform(0.01, 0.30, size=n_samples),
            "ad_position": rng.integers(1, 6, size=n_samples),
            "device": rng.choice(["mobile", "desktop", "tablet"], size=n_samples),
            "country": rng.choice(["US", "CA", "UK"], size=n_samples),
        }
    )

    score = (
        -3.0
        + 6.0 * data["historical_ctr"]
        - 0.25 * data["ad_position"]
        + 0.4 * (data["device"] == "mobile").astype(float)
        + 0.2 * (data["country"] == "US").astype(float)
    )

    probability = 1 / (1 + np.exp(-score))

    data["clicked"] = rng.binomial(1, probability)

    return data


def evaluate_model(name, model, X_test, y_test):
    probabilities = model.predict_proba(X_test)[:, 1]
    predictions = (probabilities >= 0.5).astype(int)

    print(f"\n{name}")
    print("-" * len(name))
    print("Accuracy :", round(accuracy_score(y_test, predictions), 4))
    print("Precision:", round(precision_score(y_test, predictions), 4))
    print("Recall   :", round(recall_score(y_test, predictions), 4))
    print("F1       :", round(f1_score(y_test, predictions), 4))
    print("ROC-AUC  :", round(roc_auc_score(y_test, probabilities), 4))


def main():
    df = generate_data()

    X = df.drop(columns=["clicked"])
    y = df["clicked"]

    X_train, X_test, y_train, y_test = train_test_split(
        X,
        y,
        test_size=0.2,
        random_state=42,
        stratify=y,
    )

    numeric_features = [
        "user_age",
        "historical_ctr",
        "ad_position",
    ]

    categorical_features = [
        "device",
        "country",
    ]

    preprocessing = ColumnTransformer(
        transformers=[
            ("numeric", StandardScaler(), numeric_features),
            (
                "categorical",
                OneHotEncoder(handle_unknown="ignore"),
                categorical_features,
            ),
        ]
    )

    logistic_model = Pipeline(
        steps=[
            ("preprocessing", preprocessing),
            ("model", LogisticRegression(max_iter=1000)),
        ]
    )

    logistic_model.fit(X_train, y_train)
    # save training results
    model_dir = Path(__file__).parent / "models"
    model_dir.mkdir(exist_ok=True)
    model_path = model_dir / "logistic_regression.joblib"
    joblib.dump(logistic_model, model_path)
    print(f"\nSaved model to: {model_path}")

    evaluate_model(
        "Logistic Regression",
        logistic_model,
        X_test,
        y_test,
    )

    random_forest_model = Pipeline(
        steps=[
            ("preprocessing", preprocessing),
            (
                "model",
                RandomForestClassifier(
                    n_estimators=100,
                    random_state=42,
                ),
            ),
        ]
    )

    random_forest_model.fit(X_train, y_train)

    evaluate_model(
        "Random Forest",
        random_forest_model,
        X_test,
        y_test,
    )

    print("\nPositive rate:", round(y.mean(), 4))


if __name__ == "__main__":
    main()