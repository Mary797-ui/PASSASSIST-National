# Passport payment sandbox and live gateway

## Local coursework demo
The citizen portal now includes Passport payments. It stores local test transactions in `data/passassist_demo_payments.sqlite3`.
- Test value is Citizens can enter a test amount in LSL (M0.01–M100,000.00); it is not an official passport fee.
- Mobile-money and card options are simulations.
- Simulated confirmation records PAID in the sandbox only. No money is transferred.
- No card PAN, CVV, mobile-money PIN or password is collected.

Start the system:
```powershell
.\venv\Scripts\Activate.ps1
pip install -r requirements.txt
python ai/train_models.py
uvicorn backend.main:app --reload
```
Open http://127.0.0.1:8000, sign in to the citizen portal, and select Passport payments.

## API
- GET /api/payments/config
- POST /api/payments with `{"application_reference":"DEMO-APP-001","method":"mobile_money","amount":75.50}`
- POST /api/payments/{payment_id}/confirm
- GET /api/payments?application_reference=DEMO-APP-001
- GET /api/blockchain/verify
- GET /api/blockchain/events

## Real payment integration is not enabled
Before collecting actual fees: obtain Ministry/finance approval; confirm official fee schedule and refund policy; onboard with an authorised provider; use provider-hosted checkout/tokenisation; keep credentials server-side; verify signed callbacks/webhooks, amount, currency and application reference; enforce idempotency and reconciliation; apply database RLS; and complete security/privacy testing. Do not mark an application paid until a verified provider callback and reconciliation succeed.

Set `PASSASSIST_PAYMENT_MODE` to a non-demo value to disable sandbox creation/confirmation. This does not activate live payments; a provider adapter must be implemented first.
