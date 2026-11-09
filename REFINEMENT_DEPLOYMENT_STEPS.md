# PASSASSIST National — refinement and re-hosting guide

## Before you test the new features

1. Keep a backup of your current project folder.
2. Extract this ZIP into a new folder first.
3. Copy the refined project files into your existing Git project folder, overwriting matching files. Keep the existing `.git` directory and do not upload your `venv` folder.
4. Before applying SQL, inspect existing policies for `public.applications`, `public.citizen_documents`, `public.citizen_preparation_checklists` and `storage.objects`. Do not proceed if an existing broad Storage policy grants public or cross-user access; review it first.
5. Back up the Supabase project, then open SQL Editor and run `database/refinement_migration.sql` once. Do not run the generic `database/schema.sql` against the existing project.
6. In Supabase Storage, confirm the `citizen-documents` bucket is private and that object policies restrict access to the authenticated user's own folder.
6. In Supabase Authentication → URL Configuration, add both:
   - `http://127.0.0.1:8000`
   - `https://passassist-national.onrender.com`
   as allowed redirect URLs. Set the deployed site URL appropriately.
7. For account-verification emails, configure a verified SMTP provider in Supabase Auth → SMTP Settings. Supabase's built-in email provider has rate limits. Do not repeatedly retry registration.
8. Test with your existing citizen, officer, supervisor and security administrator accounts.

## Local test

```powershell
pip install -r requirements.txt
python ai/train_models.py
python -m uvicorn backend.main:app --reload
```

Open `http://127.0.0.1:8000`.

## Role separation tests

- Citizen sign-in opens only the citizen workspace.
- Officer sign-in opens the assigned-office officer workspace.
- Security administrator sign-in redirects to `/security-admin`.
- A citizen account visiting `/security-admin` must be denied.
- The security administrator page must not display the citizen application workspace.

## Citizen document tests

- Change applicant category and application type; confirm checklist changes.
- Tick some items and press **Save progress**.
- Refresh or sign out and back in; confirm the saved checklist is restored.
- Use a harmless dummy PDF, JPG or PNG file no larger than 5 MB; do not upload real identity cards, birth certificates or passports for coursework testing.
- Confirm it appears in the citizen's private document vault and opens through a short-lived signed URL.
- Sign in as a different citizen; confirm the first citizen's document list and files are inaccessible.

## Previous passport tests

Create or edit a replacement application and confirm these fields appear:
- Passport number
- Date of issue
- Date of expiry
- Place of issue
- File number
- Diplomatic/official passport details available / not available
- Previously applied but not issued: yes / no

Save a draft, reopen it and verify the values remain.

## Re-host

Once local and Supabase tests pass:

```powershell
git status
git add .
git commit -m "Refine PASSASSIST National workflows"
git push
```

Render should deploy the new GitHub commit automatically. Check the Render deploy logs and retest the public URL.

## Important limitations

The compact operational dataset is illustrative planning data, not official Ministry statistics. The AI model is a planning aid, not an automated passport decision-maker. Hash-linked audit records are tamper-evident, not a decentralised public blockchain. Official passport submission, payments, biometrics, appointments, issuance and live Ministry data require formal authorisation and integration.
