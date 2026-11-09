"""PASSASSIST National service API.

The operational planning dataset is illustrative and is not sourced from Ministry systems.
"""
from pathlib import Path
import pandas as pd
from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles
from fastapi.responses import FileResponse, RedirectResponse
from pydantic import BaseModel, Field
import sqlite3, uuid, hashlib, json, os
from datetime import datetime, timezone

BASE_DIR = Path(__file__).resolve().parents[1]
DATA = BASE_DIR / "data" / "synthetic_passport_operations.csv"
FRONTEND = BASE_DIR / "frontend"
ADMIN = BASE_DIR / "admin"

app = FastAPI(title="PASSASSIST National API", version="1.0.0")

class Health(BaseModel):
    status: str
    data_source: str

def read_data():
    return pd.read_csv(DATA, parse_dates=["date"]).sort_values("date")

@app.get("/health", response_model=Health)
def health():
    return Health(status="ok", data_source="illustrative planning dataset")

@app.get("/api/overview")
def overview():
    df = read_data()
    return {
        "applications_received": int(df["applications_received"].sum()),
        "applications_processed": int(df["applications_processed"].sum()),
        "applications_approved": int(df["applications_approved"].sum()),
        "passports_printed": int(df["passports_printed"].sum()),
        "passports_collected": int(df["passports_collected"].sum()),
        "latest_date": str(df["date"].max().date()),
        "reporting_days": int(df["date"].nunique()),
        "office_count": int(df["office"].nunique())
    }

@app.get("/api/offices")
def offices():
    df = read_data()

    grouped = df.groupby(["district", "office"], as_index=False).agg(
        applications_received=("applications_received", "sum"),
        applications_processed=("applications_processed", "sum"),
        passports_printed=("passports_printed", "sum"),
        passports_collected=("passports_collected", "sum"),
        outstanding_backlog=("outstanding_backlog", "last")
    )

    office_contacts = {
        "Berea": {
            "phone": "+266 22500215"
        },
        "Butha-Buthe": {
            "phone": "+266 22460230"
        },
        "Botha-Bothe": {
            "phone": "+266 22460230"
        },
        "Leribe": {
            "phone": "+266 22400341"
        },
        "Mafeteng": {
            "phone": "+266 22700250"
        },
        "Maseru": {
            "phone": "+266 22327142",
            "additional_phone": "+266 22316618",
            "additional_contact": "Director's Office"
        },
        "Mohale's Hoek": {
            "phone": "+266 22785312"
        },
        "Mokhotlong": {
            "phone": "+266 22920227"
        },
        "Qacha's Nek": {
            "phone": "+266 22950225"
        },
        "Quthing": {
            "phone": "+266 22750214"
        },
        "Thaba-Tseka": {
            "phone": "+266 22900250"
        }
    }

    records = grouped.to_dict(orient="records")

    for record in records:
        district = record["district"]
        contact = office_contacts.get(district, {})

        record["phone"] = contact.get("phone")
        record["additional_phone"] = contact.get("additional_phone")
        record["additional_contact"] = contact.get("additional_contact")

        # These details must be confirmed by the Ministry.
        record["address"] = "To be verified with the Ministry of Home Affairs"
        record["opening_hours"] = "To be confirmed"
        record["services"] = [
            "Passport application enquiries",
            "Passport document guidance",
            "Application support"
        ]
        record["information_status"] = "Contact details supplied for directory; address and hours unverified"

    return {"offices": records}

@app.get("/api/regions")
def regions():
    df = read_data()
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
    return {"region_note": "Proposed planning groupings; confirm with the Ministry", "regions": grouped.to_dict(orient="records")}

@app.get("/api/analytics")
def analytics():
    df = read_data()
    df["period_day"] = df["date"].dt.strftime("%Y-%m-%d")
    df["period_month"] = df["date"].dt.strftime("%Y-%m")
    df["period_year"] = df["date"].dt.strftime("%Y")
    metrics = {
        "applications_received": ("applications_received", "sum"),
        "applications_processed": ("applications_processed", "sum"),
        "passports_printed": ("passports_printed", "sum"),
        "passports_collected": ("passports_collected", "sum")
    }
    daily = df.groupby("period_day", as_index=False).agg(**metrics).rename(columns={"period_day": "period"})
    monthly = df.groupby("period_month", as_index=False).agg(**metrics).rename(columns={"period_month": "period"})
    yearly = df.groupby("period_year", as_index=False).agg(**metrics).rename(columns={"period_year": "period"})
    return {"daily": daily.to_dict(orient="records"), "monthly": monthly.to_dict(orient="records"), "yearly": yearly.to_dict(orient="records")}

@app.get("/api/technology")
def technology():
    metrics_path = BASE_DIR / "ai" / "model_evaluation_results.csv"
    model_metrics = pd.read_csv(metrics_path).round(3).to_dict(orient="records") if metrics_path.exists() else []
    df = read_data()
    # The source has one row per office per day. Aggregate by date first so a
    # 30-day estimate uses 30 national daily totals, not merely 30 office rows.
    daily_national = df.groupby("date", as_index=False).agg(
        applications_received=("applications_received", "sum"),
        outstanding_backlog=("outstanding_backlog", "sum")
    ).sort_values("date").tail(30)
    return {
        "ai": {
            "model_metrics": model_metrics,
            "forecast_next_30_days_received": int(round(daily_national["applications_received"].mean() * 30)),
            "forecast_daily_backlog_average": round(float(daily_national["outstanding_backlog"].mean()), 1),
            "training_note": "Chronological holdout evaluation on the included illustrative planning dataset; estimates are not official forecasts."
        },
        "blockchain": {
            "design": "SHA-256 hash-linked application status events",
            "privacy_rule": "No personal information or document contents are included in audit hashes.",
            "audit_model": "Tamper-evident audit chain"
        }
    }

@app.get("/security-admin", include_in_schema=False)
@app.get("/admin", include_in_schema=False)
def admin_portal():
    return FileResponse(ADMIN / "index.html")

@app.get("/", include_in_schema=False)
def home():
    return FileResponse(FRONTEND / "index.html")

app.mount("/static", StaticFiles(directory=FRONTEND), name="static")


# Coursework payment sandbox: test transactions only; no funds are collected.
PAYMENT_DB = BASE_DIR / "data" / "passassist_demo_payments.sqlite3"
PAYMENT_MODE = os.getenv("PASSASSIST_PAYMENT_MODE", "demo").lower()
DEMO_AMOUNT = 1.00  # M1.00 is a test value, NOT an official passport fee.

class PaymentCreate(BaseModel):
    application_reference: str = Field(min_length=3, max_length=80, pattern=r"^[A-Za-z0-9_-]+$")
    method: str = Field(pattern=r"^(mobile_money|card)$")
    amount: float = Field(gt=0, le=100000, allow_inf_nan=False)

def payment_db():
    conn = sqlite3.connect(PAYMENT_DB)
    conn.row_factory = sqlite3.Row
    return conn

def init_payment_db():
    PAYMENT_DB.parent.mkdir(parents=True, exist_ok=True)
    with payment_db() as conn:
        conn.execute("""CREATE TABLE IF NOT EXISTS demo_payments(
          payment_id TEXT PRIMARY KEY, application_reference TEXT NOT NULL,
          amount REAL NOT NULL CHECK(amount>0), currency TEXT NOT NULL,
          method TEXT NOT NULL, status TEXT NOT NULL, provider_reference TEXT,
          created_at TEXT NOT NULL, paid_at TEXT)""")
        conn.execute("""CREATE TABLE IF NOT EXISTS payment_audit_chain(
          event_index INTEGER PRIMARY KEY AUTOINCREMENT, event_json TEXT NOT NULL,
          previous_hash TEXT NOT NULL, event_hash TEXT NOT NULL UNIQUE)""")

def append_payment_event(conn, event):
    previous=conn.execute("SELECT event_hash FROM payment_audit_chain ORDER BY event_index DESC LIMIT 1").fetchone()
    prev=previous["event_hash"] if previous else "0"*64
    payload=json.dumps(event,sort_keys=True,separators=(",",":"))
    digest=hashlib.sha256((prev+payload).encode()).hexdigest()
    conn.execute("INSERT INTO payment_audit_chain(event_json,previous_hash,event_hash) VALUES(?,?,?)",(payload,prev,digest))

def verify_payment_events(conn):
    prev="0"*64
    for row in conn.execute("SELECT * FROM payment_audit_chain ORDER BY event_index"):
        digest=hashlib.sha256((prev+row["event_json"]).encode()).hexdigest()
        if row["previous_hash"]!=prev or row["event_hash"]!=digest: return False
        prev=row["event_hash"]
    return True

init_payment_db()

@app.get("/api/payments/config")
def payment_config():
    return {"mode":PAYMENT_MODE,"currency":"LSL","demo_amount":DEMO_AMOUNT,
            "live_payments_enabled":False,
            "notice":"Coursework sandbox only. Entered amount is for demonstration and is not an official passport fee."}

@app.post("/api/payments")
def create_payment(payload: PaymentCreate):
    if PAYMENT_MODE!="demo":
        from fastapi import HTTPException
        raise HTTPException(status_code=503,detail="Live payment provider is not configured.")
    pid=str(uuid.uuid4()); now=datetime.now(timezone.utc).isoformat()
    with payment_db() as conn:
        conn.execute("INSERT INTO demo_payments VALUES(?,?,?,?,?,?,?,?,?)",
          (pid,payload.application_reference,round(payload.amount,2),"LSL",payload.method,"PENDING",None,now,None))
        append_payment_event(conn,{"event_type":"DEMO_PAYMENT_CREATED","payment_id":pid,
          "application_reference":payload.application_reference,"amount":round(payload.amount,2),
          "currency":"LSL","method":payload.method,"occurred_at":now})
        row=conn.execute("SELECT * FROM demo_payments WHERE payment_id=?",(pid,)).fetchone()
    return {"payment":dict(row),"demo_only":True}

@app.post("/api/payments/{payment_id}/confirm")
def confirm_payment(payment_id:str):
    if PAYMENT_MODE!="demo":
        from fastapi import HTTPException
        raise HTTPException(status_code=503,detail="Live payment provider is not configured.")
    with payment_db() as conn:
        row=conn.execute("SELECT * FROM demo_payments WHERE payment_id=?",(payment_id,)).fetchone()
        if not row:
            from fastapi import HTTPException
            raise HTTPException(status_code=404,detail="Payment reference not found.")
        if row["status"]=="PAID":
            return {"payment":dict(row),"demo_only":True,"message":"Already confirmed in the sandbox."}
        now=datetime.now(timezone.utc).isoformat(); provider="SANDBOX-"+payment_id[:8].upper()
        conn.execute("UPDATE demo_payments SET status='PAID',provider_reference=?,paid_at=? WHERE payment_id=?",(provider,now,payment_id))
        append_payment_event(conn,{"event_type":"DEMO_PAYMENT_CONFIRMED","payment_id":payment_id,
          "application_reference":row["application_reference"],"provider_reference":provider,"occurred_at":now})
        updated=conn.execute("SELECT * FROM demo_payments WHERE payment_id=?",(payment_id,)).fetchone()
    return {"payment":dict(updated),"demo_only":True,"message":"Sandbox transaction recorded; no money was transferred."}

@app.get("/api/payments")
def payment_history(application_reference:str|None=None):
    with payment_db() as conn:
        rows=(conn.execute("SELECT * FROM demo_payments WHERE application_reference=? ORDER BY created_at DESC",(application_reference,)).fetchall()
              if application_reference else conn.execute("SELECT * FROM demo_payments ORDER BY created_at DESC LIMIT 100").fetchall())
    return {"payments":[dict(r) for r in rows],"demo_only":True}

@app.get("/api/blockchain/verify")
def verify_payment_ledger():
    with payment_db() as conn:
        valid=verify_payment_events(conn)
        count=conn.execute("SELECT COUNT(*) n FROM payment_audit_chain").fetchone()["n"]
    return {"valid":valid,"events":count,"ledger":"Local SHA-256 tamper-evident chain",
            "distributed_network":False,
            "note":"A multi-node permissioned blockchain with independent validators is required for production consensus."}

@app.get("/api/blockchain/events")
def payment_ledger_events():
    with payment_db() as conn:
        rows=conn.execute("SELECT * FROM payment_audit_chain ORDER BY event_index DESC LIMIT 100").fetchall()
    return {"events":[{"index":r["event_index"],"event":json.loads(r["event_json"]),
      "previous_hash":r["previous_hash"],"hash":r["event_hash"]} for r in rows]}
