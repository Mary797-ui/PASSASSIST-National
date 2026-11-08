"""
PASSASSIST National demonstration forecasting.
CSV data is synthetic; it is NOT Ministry of Home Affairs data.
Run from project root: python ai/train_models.py
"""
from pathlib import Path
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.preprocessing import OneHotEncoder, StandardScaler
from sklearn.pipeline import Pipeline
from sklearn.impute import SimpleImputer
from sklearn.ensemble import RandomForestRegressor
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

ROOT = Path(__file__).resolve().parents[1]
df = pd.read_csv(ROOT / "data" / "synthetic_passport_operations.csv", parse_dates=["date"])
df = df.sort_values(["office", "date"]).reset_index(drop=True)
df["backlog_start"] = df.groupby("office")["outstanding_backlog"].shift(1)
df["previous_day_received"] = df.groupby("office")["applications_received"].shift(1)
df["previous_day_processed"] = df.groupby("office")["applications_processed"].shift(1)
df[["backlog_start", "previous_day_received", "previous_day_processed"]] = (
    df[["backlog_start", "previous_day_received", "previous_day_processed"]].fillna(0)
)
df = df.sort_values(["date", "office"]).reset_index(drop=True)

dates = sorted(df["date"].unique())
cut_date = dates[int(len(dates) * 0.8)]
train_mask = df["date"] < cut_date
test_mask = ~train_mask

specs = {
    "applications_received": [
        "district", "office", "day_of_week", "month", "day_of_year", "office_capacity_per_day"
    ],
    "outstanding_backlog": [
        "district", "office", "day_of_week", "month", "day_of_year",
        "office_capacity_per_day", "backlog_start",
        "previous_day_received", "previous_day_processed"
    ]
}
results = []
for target, features in specs.items():
    categorical = ["district", "office"]
    numeric = [c for c in features if c not in categorical]
    X_train, X_test = df.loc[train_mask, features], df.loc[test_mask, features]
    y_train, y_test = df.loc[train_mask, target], df.loc[test_mask, target]
    models = [
        ("Linear Regression", LinearRegression()),
        ("Random Forest", RandomForestRegressor(
            n_estimators=160, max_depth=14, min_samples_leaf=2,
            random_state=42, n_jobs=-1
        ))
    ]
    for name, estimator in models:
        prep = ColumnTransformer([
            ("categorical", OneHotEncoder(handle_unknown="ignore"), categorical),
            ("numeric", Pipeline([
                ("imputer", SimpleImputer(strategy="median")),
                ("scaler", StandardScaler())
            ]), numeric)
        ])
        model = Pipeline([("preprocess", prep), ("model", estimator)])
        model.fit(X_train, y_train)
        prediction = model.predict(X_test)
        results.append({
            "Target": target, "Model": name,
            "MAE": mean_absolute_error(y_test, prediction),
            "RMSE": mean_squared_error(y_test, prediction) ** 0.5,
            "R_squared": r2_score(y_test, prediction),
            "Training_rows": len(X_train), "Testing_rows": len(X_test),
            "Split_method": f"Chronological date holdout; test starts {pd.Timestamp(cut_date).date()}"
        })
out = pd.DataFrame(results)
out.to_csv(ROOT / "ai" / "model_evaluation_results.csv", index=False)
print(out.to_string(index=False))
print("Reminder: these results are from synthetic data only.")
