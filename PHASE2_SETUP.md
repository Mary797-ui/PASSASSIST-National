# PASSASSIST National — Phase 2 setup: online database and real login

This phase connects the public registration and sign-in forms to Supabase Auth and a hosted PostgreSQL profile table.

## Before starting
- Create a Supabase project using an account you are permitted to use. If needed, ask your lecturer or parent/guardian to help supervise account setup.
- Use fictional test details while developing. Do not enter real passport numbers, identity numbers, document scans or sensitive citizen information.
- Do not share passwords, database passwords, secret keys or screenshots containing them.

## Step 1 — Create the Supabase project
1. Visit https://supabase.com/ and sign in.
2. Create a new project named `PASSASSIST-National`.
3. Choose the Free plan if it is available for your account.
4. Choose a strong database password and store it privately. It is NOT the same as a citizen's PASSASSIST password.
5. Choose a region close to Lesotho if one is offered (for example, South Africa if available).
6. Wait until the project finishes provisioning.

Free-plan limits and availability can change. A free project may pause after inactivity and has limited storage/usage; it is suitable for a coursework prototype, not a guaranteed production government service.

## Step 2 — Enable email authentication
1. In the Supabase project, open Authentication.
2. Open Sign In / Providers (the exact menu wording may vary).
3. Make sure Email is enabled.
4. Keep email verification enabled for the prototype.
5. In Authentication URL Configuration, set the Site URL to:
   `http://127.0.0.1:8000`
6. Add this Redirect URL if the dashboard asks for it:
   `http://127.0.0.1:8000/**`

## Step 3 — Create the profiles table and security policies
1. Open SQL Editor in the Supabase dashboard.
2. Create a new query.
3. Open `database/supabase_phase2_profiles.sql` in VS Code.
4. Copy the entire SQL file into the SQL Editor.
5. Run it.
6. Confirm the result shows the `profiles` table and `rowsecurity = true`.

This script:
- creates one profile for each new Auth user;
- assigns the role `citizen` by default;
- allows a signed-in user to read only their own profile;
- allows a signed-in user to update only their own name and phone columns;
- does not let a citizen change their role.

## Step 4 — Add the public project settings to the website
1. In Supabase, open Project Settings > API (or the project's Connect/API settings).
2. Copy the Project URL.
3. Copy the publishable key. If the project only shows the older `anon` public key, use that.
4. In VS Code, open `frontend/supabase-config.js`.
5. Replace the two placeholder values:

   `PASTE_YOUR_SUPABASE_PROJECT_URL_HERE`

   `PASTE_YOUR_SUPABASE_PUBLISHABLE_OR_ANON_KEY_HERE`

6. Save the file.

IMPORTANT:
- The publishable/anon key is designed for use in a browser, but it is safe only when Row Level Security and policies are correctly configured.
- NEVER put the `service_role` key, secret API key, or database password in `supabase-config.js`, HTML, JavaScript, screenshots or a public repository.
- Never send your keys or passwords to ChatGPT.

## Step 5 — Run PASSASSIST locally
Open the VS Code terminal in the project root (the folder containing `backend`, `frontend`, and `requirements.txt`).

Activate your virtual environment if you already created it:
- Windows PowerShell: `venv\\Scripts\\activate`

Start the app:
`uvicorn backend.main:app --reload`

Open:
`http://127.0.0.1:8000/`

The browser must have an internet connection to load Supabase's JavaScript library and connect to your project.

## Step 6 — Test with a fictional account
1. Select Create account.
2. Use a test name, a test email address you can access, and a test password.
3. Submit the form.
4. If email verification is enabled, open the verification email.
5. Return to PASSASSIST and sign in.
6. Confirm the citizen portal opens and shows your profile name.
7. Select Sign out and confirm the public welcome page returns.
8. In Supabase Table Editor, open `profiles` and confirm the test user's role is `citizen`.

Do not use a real citizen's personal information during this coursework test.

## Troubleshooting
- "Supabase is not configured": check that both values in `supabase-config.js` are replaced and saved.
- "Invalid API key": copy the publishable/anon key from the correct project.
- "Email not confirmed": open the verification message, then sign in again.
- "relation profiles does not exist": run the SQL script.
- Profile query permission error: check that the SQL script ran successfully and RLS is enabled.
- Browser does not connect: check internet access and the browser console (F12 > Console).

## What is and is not completed
Completed by this code package:
- real Supabase email/password sign-up and sign-in integration;
- session persistence and sign-out;
- automatic citizen profile creation;
- Row Level Security on the profile table;
- public sign-up cannot select an administrator role.

Not yet completed:
- application records and passport process tables;
- officer/manager/admin accounts and approval workflow;
- role-based module permissions for all application modules;
- real Home Affairs integration;
- production hosting, privacy review, backup and security testing.

Those are addressed in later phases. The current application data dashboard still uses the synthetic coursework CSV until Phase 3/5 connects real authorised records.


## Refinement setup — private documents and saved checklists

Run `database/refinement_migration.sql` once in the existing Supabase SQL Editor. It creates:
- `citizen_preparation_checklists` with owner-only RLS;
- `citizen_documents` metadata with owner-only RLS;
- a private `citizen-documents` Storage bucket with owner-folder policies;
- `applications.previous_passport_details` for replacement passport fields.

Do not make the storage bucket public. The browser uses the publishable/anon key; RLS and Storage policies enforce ownership.

## Email verification and rate limits

Supabase's built-in email service has sending limits. A frontend code change cannot bypass those provider limits. For reliable account verification, configure a verified SMTP provider under Authentication → SMTP Settings, then add the deployed site URL under Authentication → URL Configuration. Use existing test accounts for sign-in tests and avoid repeated sign-up attempts when the service reports a rate limit.
