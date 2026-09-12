from sklearn.datasets import load_breast_cancer
from sklearn.linear_model import LogisticRegression
from sklearn.metrics import accuracy_score, classification_report
from sklearn.model_selection import train_test_split
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler


# 1. Load dataset
X, y = load_breast_cancer(return_X_y=True)

print("Dataset shape:", X.shape)
print("Labels shape:", y.shape)


# 2. Split into training and test sets
X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.2,
    random_state=42,
    stratify=y,
)

print("Training samples:", len(X_train))
print("Test samples:", len(X_test))


# 3. Build the ML pipeline
model = make_pipeline(
    StandardScaler(),
    LogisticRegression(max_iter=1000),
)


# 4. Train
model.fit(X_train, y_train)


# 5. Inference
predictions = model.predict(X_test)


# 6. Evaluation
accuracy = accuracy_score(y_test, predictions)

print(f"\nAccuracy: {accuracy:.4f}")
print("\nClassification report:")
print(classification_report(y_test, predictions))