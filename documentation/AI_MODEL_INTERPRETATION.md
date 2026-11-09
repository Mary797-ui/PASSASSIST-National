# AI model evaluation — PASSASSIST

## Objective and dataset
The model estimates passport-office application demand and outstanding backlog to support workload and staffing planning. `data/synthetic_passport_operations.csv` is a synthetic coursework dataset, not official Ministry data.

## Algorithms
- Linear Regression: interpretable baseline for approximately linear relationships.
- Random Forest Regression: ensemble of decision trees that can learn non-linear patterns.

## Accuracy / evaluation
Run `python ai/train_models.py`. The script uses a chronological holdout (earlier dates train; later dates test) and reports MAE, RMSE and R-squared.
- MAE: average absolute error in number of applications.
- RMSE: error in applications with larger errors penalised more heavily.
- R-squared: share of target variation explained on the held-out sample; it can be negative.
R-squared is not a percentage accuracy score. Compare all metrics and targets.

## Saturation / limits
The script compares 20, 50, 100, 160 and 250 Random Forest trees and writes `ai/random_forest_saturation.csv`, including MAE, RMSE, R-squared and runtime. A plateau where more trees add runtime but barely improve held-out error indicates diminishing returns/saturation. Linear Regression may underfit non-linear patterns; deeper forests may overfit. Do not claim a saturation point until the generated experiment is reviewed.

## Dashboard and safeguards
The existing national dashboard exposes a 30-day illustrative demand estimate, average backlog and model metrics through `/api/technology`. These are planning aids, not official forecasts. AI must not approve or reject passport applications.


## Observed results from the included synthetic dataset
The reproducible run in this package produced the following held-out Random Forest results:
- Applications received: MAE 3.76, RMSE 5.89, R-squared 0.923.
- Outstanding backlog: MAE 0.056, RMSE 0.346, R-squared -0.099.

The negative backlog R-squared means the model did not explain backlog variation well on this holdout; do not rely on that backlog forecast for operational decisions. The applications-received result is promising only for this synthetic dataset and needs validation on authorised, representative Ministry data before any real use.

The tree-count experiment showed very small changes in applications-received error from 20 to 250 trees while runtime increased. This suggests diminishing returns beyond the lower tree counts on this dataset; it is not a universal saturation threshold.
