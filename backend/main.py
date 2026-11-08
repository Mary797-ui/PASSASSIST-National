"""PASSASSIST National student demo API and local static website.
All operational records served here are synthetic demonstration data.
This application is not connected to Ministry systems and is not production-ready.
"""
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse
from pydantic import BaseModel
from pathlib import Path
import pandas as pd

BASE_DIR = Path(__file__).resolve().parents[1]
DATA = BASE_DIR / "data" / "synthetic_passport_operations.csv"
FRONTEND = BASE_DIR / "frontend"
ADMIN = BASE_DIR / "admin"

app = FastAPI(title="PASSASSIST National Demo API", version="0.2.0")

class Health(BaseModel):
    status: str
    data_mode: str

@app.get("/health", response_model=Health)
def health():
    return Health(status="ok", data_mode="synthetic demonstration data")

@app.get("/api/overview")
def overview():
    df = pd.read_csv(DATA)
    return {
        "data_mode": "SYNTHETIC DEMONSTRATION DATA",
        "applications_received": int(df["applications_received"].sum()),
        "applications_processed": int(df["applications_processed"].sum()),
        "applications_approved": int(df["applications_approved"].sum()),
        "passports_printed": int(df["passports_printed"].sum()),
        "passports_collected": int(df["passports_collected"].sum()),
        "latest_date": str(df["date"].max())
    }

@app.get("/api/offices")
def offices():
    df = pd.read_csv(DATA)
    grouped = df.groupby(["district", "office"], as_index=False).agg(
        applications_received=("applications_received", "sum"),
        passports_printed=("passports_printed", "sum"),
        outstanding_backlog=("outstanding_backlog", "last")
    )
    return {"data_mode": "SYNTHETIC DEMONSTRATION DATA", "offices": grouped.to_dict(orient="records")}

@app.get("/api/regions")
def regions():
    """Planning-region aggregates from synthetic coursework data only."""
    df = pd.read_csv(DATA)
    # Proposed planning groupings for the prototype; Ministry confirmation is required.
    north = {"Berea", "Leribe", "Botha-Bothe"}
    east = {"Mokhotlong", "Thaba-Tseka", "Qacha's Nek"}
    south = {"Quthing", "Mohale's Hoek"}
    def region(district):
        if district in north: return "North"
        if district in east: return "East"
        if district in south: return "South"
        return "West"
    df["planning_region"] = df["district"].map(region)
    grouped = df.groupby("planning_region", as_index=False).agg(
        applications_received=("applications_received", "sum"),
        applications_processed=("applications_processed", "sum"),
        applications_approved=("applications_approved", "sum"),
        passports_printed=("passports_printed", "sum"),
        passports_collected=("passports_collected", "sum"),
        outstanding_backlog=("outstanding_backlog", "last")
    )
    return {"data_mode": "SYNTHETIC DEMONSTRATION DATA", "region_note": "Proposed planning groupings; confirm with Ministry", "regions": grouped.to_dict(orient="records")}

@app.get("/api/forecast")
def forecast():
    """Simple 30-day baseline projection; ML model evaluation is in ai/model_evaluation_results.csv."""
    df = pd.read_csv(DATA, parse_dates=["date"]).sort_values("date")
    recent = df[df["date"] >= (df["date"].max() - pd.Timedelta(days=29))]
    metrics_path = BASE_DIR / "ai" / "model_evaluation_results.csv"
    model_metrics = []
    if metrics_path.exists():
        model_metrics = pd.read_csv(metrics_path).round(3).to_dict(orient="records")
    return {
        "data_mode": "SYNTHETIC DEMONSTRATION DATA",
        "method": "30-day moving-average baseline projection (not an operational forecast)",
        "forecast_next_30_days_received": int(round(recent["applications_received"].mean() * 30)),
        "forecast_daily_backlog_average": round(float(recent["outstanding_backlog"].mean()), 1),
        "model_evaluation": model_metrics,
        "training_evaluation_file": "ai/model_evaluation_results.csv"
    }


@app.get("/api/analytics")
def analytics():
    """Daily, monthly and yearly passport operations analytics using synthetic data."""
    df = pd.read_csv(DATA, parse_dates=["date"])

    def summarize(grouped):
        return grouped.agg(
            applications_received=("applications_received", "sum"),
            applications_processed=("applications_processed", "sum"),
            applications_approved=("applications_approved", "sum"),
            passports_printed=("passports_printed", "sum"),
            passports_collected=("passports_collected", "sum")
        ).reset_index().to_dict(orient="records")

    daily = summarize(
        df.groupby(df["date"].dt.strftime("%Y-%m-%d"))
    )

    monthly = summarize(
        df.groupby(df["date"].dt.strftime("%Y-%m"))
    )

    yearly = summarize(
        df.groupby(df["date"].dt.strftime("%Y"))
    )

    return {
        "data_mode": "SYNTHETIC DEMONSTRATION DATA",
        "daily": daily,
        "monthly": monthly,
        "yearly": yearly
    }


@app.get("/admin", include_in_schema=False)
def admin_portal():
    return FileResponse(ADMIN / "index.html")

@app.get("/", include_in_schema=False)
def home():
    return FileResponse(FRONTEND / "index.html")

app.mount("/static", StaticFiles(directory=FRONTEND), name="static")
