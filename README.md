# PASSASSIST National — Assignment Package

## What this package contains
- `documentation/PASSASSIST_National_Assignment_Report.docx` — structured assignment report draft.
- `documentation/PASSASSIST_Cybersecurity_GDPR_RBAC.xlsx` — GDPR planning checklist, classification matrix, RBAC matrix, metric definitions and test plan.
- `data/synthetic_passport_operations.csv` — 365 days of synthetic demonstration data for 12 service locations.
- `ai/train_models.py` — time-based training/evaluation for demand and backlog regression models.
- `ai/model_evaluation_results.csv` — evaluation results generated from the included synthetic data.
- `blockchain/audit_chain_demo.py` — hash-linked audit event demonstration and tamper detection.
- `database/schema.sql` — PostgreSQL relational schema starter.
- `backend/main.py` — local FastAPI demonstration API serving synthetic aggregates only.
- `tests/test_blockchain.py` — small integrity tests.

## Critical data warning
The CSV and all derived statistics are **synthetic demonstration data**. They are not official Ministry of Home Affairs statistics and must not be presented as real. The API is not connected to government systems. No citizen personal data is included.

## Run
1. Install Python 3.10+.
2. `pip install -r requirements.txt`
3. `python ai/train_models.py`
4. `python blockchain/audit_chain_demo.py`
5. `uvicorn backend.main:app --reload`
6. Visit `http://127.0.0.1:8000/docs`

## Important unfinished production work
This is a coursework package and implementation foundation, not a complete deployed government system. Before production: implement proper authentication and backend RBAC, security administration, migrations and database provisioning, privacy/legal review, penetration testing, accessibility testing, secure hosting, backups, monitoring, and authorised Ministry integration. The Floot app must be completed and separately deployed; this ZIP does not include a Floot project export.

## Student tasks
- Fill in your details in the report.
- Run every included script and capture your own output screenshots.
- Verify current official requirements, fees and office contacts.
- Explain the model metrics and blockchain limitations in your own words.
- Confirm assignment-specific requirements with your lecturer.


## Phase 1, Step 2 — Public screens
- Added public welcome, About Us, services, sign-in and create-account screens.
- Sign-in and account creation are visual prototype forms only; no credentials are transmitted or stored.
- Supabase authentication and database access are planned for Phase 2.
- The existing citizen portal demo files are preserved.


## Phase 2 — Supabase authentication and profiles
- `PHASE2_SETUP.md` explains how to create/configure the Supabase project.
- `frontend/supabase-config.js` holds the browser Project URL and publishable/anon key placeholders only.
- `database/supabase_phase2_profiles.sql` creates the profile table, citizen-default trigger and RLS policies.
- Email/password sign-up, sign-in, session restore and sign-out are connected in the frontend once configured.
- Do not put service-role keys or database passwords in frontend files.
