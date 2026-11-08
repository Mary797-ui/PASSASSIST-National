# PASSASSIST National – Integrated Demonstration Roadmap

## Included in this package
- Existing citizen registration/sign-in and citizen application foundation.
- Existing officer workspace and protected officer-context RPC integration.
- Security administrator page embedded inside main application navigation at **Security administration**; `/admin` remains available for compatibility.
- National synthetic-data overview, office and proposed planning-region summaries.
- AI training/evaluation scripts and baseline forecast endpoint using synthetic data.
- Hash-linked audit demonstration and administrator verification interface.
- Lesotho-inspired blue, white, green and black styling, plus a coat-of-arms image reference.
- Registration network-error handling with more actionable feedback.

## Stages and status
### Stage 1 – Citizen digital services (prototype foundation)
Account creation/sign-in, draft application workflow, tracking foundation, checklists, office directory and new/replacement selection are present. Uploaded-document storage, document quality screening, appointment booking, payment and full previous-passport history still require database schema, secure storage policies and UI/API implementation.

### Stage 2 – Office operations (partial foundation)
Officer login and office queue/processing foundation exist. Production queue scheduling, appointment capacity, official document verification, biometric capture integration, production inventory and collection scheduling require further implementation and authorised Ministry workflows.

### Stage 3 – National intelligence (demonstration foundation)
Synthetic operational dataset, office/regional aggregates, forecast baseline and AI training/evaluation artefacts exist. All figures must remain labelled synthetic until authorised Ministry data is integrated and models are validated on representative data.

### Stage 4 – Ministry partnership / production readiness (not live)
This package is not connected to National Identity and Civil Registration, Ministry passport systems, government payment providers, official biometric systems or passport production systems. These require formal Ministry approval, documented APIs, security review, data-sharing agreements, privacy impact assessment, penetration testing, hosting and disaster recovery.

## Biometric and document safety
- Future supporting files must use private, access-controlled storage, never public buckets.
- Official photographs and fingerprints should be captured at authorised enrolment centres using certified devices and Ministry-approved procedures. This prototype does not capture or store fingerprints.
- Do not store biometric templates, passport images or identity documents on a public blockchain. Keep only non-identifying integrity metadata in an audit mechanism.

## Supabase configuration
The existing `frontend/supabase-config.js` is preserved. It contains the browser publishable/anon key only. Never put a service-role key or database password in frontend files. The administrator iframe shares the same-origin browser session and still calls protected administrator RPCs. A visible navigation item is not an access-control boundary; Supabase functions and RLS must enforce permissions.

## Before a government pilot
1. Confirm legal requirements, fees, office directory and service rules with the Ministry.
2. Complete database migrations and RLS tests for every table and storage bucket.
3. Implement document upload, previous passport records and appointment capacity with audit events.
4. Add MFA for privileged staff and session/device controls.
5. Conduct independent privacy, security, accessibility and performance assessments.
6. Pilot with synthetic data first, then a Ministry-authorised limited pilot.
