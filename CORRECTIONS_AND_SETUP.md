# PASSASSIST National — refinement notes

## What was improved

- Repaired the Lesotho coat-of-arms asset path. The previous `coat-of-arms-lesotho.svg` file contained HTML markup instead of SVG artwork; it now contains the actual SVG asset used by the portal.
- Applied a consistent Lesotho-inspired palette (blue, white and green) to the citizen portal, officer workspace and restricted security administration dashboard.
- Added the coat of arms to the public portal, citizen workspace, officer workspace and security administration header.
- Connected the portal and security administration workspace with clear navigation links. The security administration link still requires an authorised administrator account; a link does not grant privileges.
- Improved dashboard spacing, cards, forms, tables and small-screen layout.
- Made the security administration page fail clearly when the Supabase browser library/configuration is unavailable, rather than throwing an early JavaScript reference error.
- Removed the bundled local virtual environment and Python cache files. Install dependencies from `requirements.txt` on the target computer instead.

## Run locally (Windows PowerShell)

```powershell
py -m venv .venv
.venv\Scripts\Activate.ps1
python -m pip install --upgrade pip
pip install -r requirements.txt
uvicorn backend.main:app --reload
```

Open `http://127.0.0.1:8000` for PASSASSIST National and `http://127.0.0.1:8000/security-admin` for the restricted security administration dashboard.

## Important integration and deployment notes

- The security administration dashboard obtains application/staff/audit information through the protected Supabase RPC functions in the SQL migrations. Its AI planning panel uses the local FastAPI `/api/technology` endpoint.
- Apply the SQL migrations described in `README.md` and `PHASE2_SETUP.md` to the configured Supabase project before expecting live staff, application and audit records.
- The configured Supabase URL and browser publishable/anon key are client-side values. Never put a Supabase `service_role` key, database password or other secret in frontend files.
- Confirm administrator UUIDs and role assignments through the documented protected database process. Do not weaken row-level security to make the dashboard appear populated.
- The bundled operations CSV and AI figures are illustrative planning data, not official Ministry statistics. Office addresses and opening hours remain unverified where stated in the interface.
- This package is a project prototype; it is not connected to Ministry production systems. Production passport processing, payment, biometric, identity and issuance integration requires formal Ministry approval and secure interfaces.

## Checks performed for this package

- Python syntax compilation of `backend/main.py`.
- JavaScript syntax checks for the citizen application and security administration scripts.
- FastAPI smoke tests for `/health`, `/`, `/security-admin`, `/admin`, `/api/overview`, `/api/offices`, `/api/regions`, `/api/analytics`, `/api/technology` and the coat-of-arms static asset.

Live Supabase sign-in, database RPC permissions and deployed-host configuration cannot be verified from this offline package check. Complete those checks in the target Supabase/hosting environment with authorised test accounts.


## BIDT3110 payment and separate-domain notes
- Passport payment sandbox: see PAYMENT_SANDBOX_AND_LIVE_GATEWAY.md. It uses M1.00 test transactions only; no funds are collected.
- Deploy security administration on a dedicated approved subdomain with separate DNS/reverse-proxy routing, HTTPS and administrator-only controls. /security-admin is only the local route.
- The local SHA-256 event chain is tamper-evident but is not a distributed multi-node blockchain.
