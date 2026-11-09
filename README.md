# PASSASSIST National

A national passport preparation and service coordination platform for Lesotho.

## Main capabilities

- Citizen account registration and sign-in through Supabase Auth.
- Citizen application drafts, status tracking and collection acknowledgement.
- Preparation checklist progress saved to the citizen's account.
- Private supporting-document uploads using a private Supabase Storage bucket.
- Previous-passport details for replacement applications.
- Passport office directory and national planning reports.
- AI demand/workload model evaluation and planning indicators.
- Security administration in a separate restricted workspace.
- Office officer workspace with role- and office-scoped processing.
- Hash-linked application status audit events.
- Citizen passport payment sandbox with transaction history and SHA-256 payment audit events.

## Project structure

- `frontend/` — citizen-facing website and client-side workflows.
- `admin/` — separate security administration workspace.
- `backend/` — FastAPI service and reporting endpoints.
- `database/refinement_migration.sql` — one-time Supabase database and Storage setup for the new features.
- `data/synthetic_passport_operations.csv` — compact 90-day illustrative planning dataset for 10 offices.
- `ai/` — model training and evaluation.
- `blockchain/` — SHA-256 hash-linked audit-chain example.
- `documentation/` — assignment report and security/GDPR planning workbook.

## Run locally

```powershell
python -m venv venv
venv\Scripts\Activate.ps1
pip install -r requirements.txt
python ai/train_models.py
uvicorn backend.main:app --reload
```

Open `http://127.0.0.1:8000`.

## One-time Supabase setup

1. Open the existing Supabase project.
2. Open SQL Editor.
3. Run `database/refinement_migration.sql` once.
4. Confirm the `citizen-documents` Storage bucket is private.
5. In Authentication → URL Configuration, add the deployed Render URL to Site URL and Redirect URLs.
6. For reliable email verification, configure a verified SMTP provider in Supabase Auth → SMTP Settings. The built-in email provider has sending/rate limits. Do not repeatedly submit sign-up requests when a rate-limit message appears.
7. Existing citizens should sign in with their current accounts. Do not create duplicate accounts to work around email limits.

The SQL migration adds a private storage bucket and owner-only row-level policies. It does not weaken existing application or staff policies. Citizens can only read their own uploaded documents. Security administrator access continues to be checked through protected Supabase RPC functions.

## Separate security administration

- Citizen website: `/`
- Security administration: `/security-admin` (alias: `/admin`)
- Office officer workspace: entered after an authorised officer signs in through the citizen sign-in screen.

Security administrators who sign in through the public sign-in form are redirected to `/security-admin` after the protected administrator RPC confirms their access. An ordinary citizen cannot enter the security workspace by changing a browser URL.

## Previous passport details

Replacement applications include passport number, issue date, expiry date, place of issue, file number, diplomatic/official passport status, and whether an earlier application was not issued. The fields are stored in `applications.previous_passport_details` after the SQL migration is applied.

## Data and technology notes

The included 90-day operations dataset is illustrative planning data, not official Ministry statistics. It is deliberately smaller to make daily, monthly and yearly comparisons easier to interpret. The AI models are planning aids and do not decide passport eligibility or approve applications.

The audit design uses SHA-256 hash-linked status metadata to make unauthorised changes detectable. It is tamper-evident, not a decentralised public blockchain. Passport scans, identity numbers and other personal information must never be written into audit hashes.

The system is not connected to Ministry production systems. Official submission, payments, biometric enrolment, appointments, issuance and live government records require formal authorisation and integration.

## Re-hosting updates

After applying the SQL migration and testing locally:

```powershell
git add .
git commit -m "Refine PASSASSIST National workflows"
git push
```

Render is connected to the GitHub repository and should deploy the pushed commit automatically.


## Passport payments
See `PAYMENT_SANDBOX_AND_LIVE_GATEWAY.md`. Citizens may enter an LSL amount for a test transaction; it is test-only, not an official passport fee; real payment collection is disabled pending Ministry approval and an authorised provider integration.

## BIDT3110 evidence
See `documentation/PASSASSIST_National_Assignment_Report.docx`, `documentation/PASSASSIST_Cybersecurity_GDPR_RBAC.xlsx` and `documentation/AI_MODEL_INTERPRETATION.md`.
