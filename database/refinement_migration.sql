-- PASSASSIST National refinement migration
-- Run once in Supabase SQL Editor for the existing project.
-- This migration adds citizen-owned preparation progress, private document metadata,
-- a private Storage bucket, and previous-passport details on application drafts.
-- It does not disable or weaken existing RLS policies.

alter table public.applications
  add column if not exists previous_passport_details jsonb not null default '{}'::jsonb;

create table if not exists public.citizen_preparation_checklists (
  user_id uuid not null references auth.users(id) on delete cascade,
  applicant_category text not null check (applicant_category in ('adult','minor')),
  application_type text not null check (application_type in ('new','replacement')),
  checked_items jsonb not null default '[]'::jsonb,
  updated_at timestamptz not null default now(),
  primary key (user_id, applicant_category, application_type)
);

alter table public.citizen_preparation_checklists enable row level security;
grant select, insert, update, delete on public.citizen_preparation_checklists to authenticated;

drop policy if exists "Citizens manage their own preparation checklists"
  on public.citizen_preparation_checklists;
create policy "Citizens manage their own preparation checklists"
  on public.citizen_preparation_checklists
  for all to authenticated
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create table if not exists public.citizen_documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  document_type text not null,
  file_name text not null,
  file_path text not null unique,
  mime_type text not null check (mime_type in ('application/pdf','image/jpeg','image/png')),
  file_size bigint not null check (file_size > 0 and file_size <= 5242880),
  created_at timestamptz not null default now()
);

alter table public.citizen_documents enable row level security;
grant select, insert, delete on public.citizen_documents to authenticated;

drop policy if exists "Citizens read their own document metadata" on public.citizen_documents;
create policy "Citizens read their own document metadata"
  on public.citizen_documents for select to authenticated
  using (auth.uid() = user_id);

drop policy if exists "Citizens add their own document metadata" on public.citizen_documents;
create policy "Citizens add their own document metadata"
  on public.citizen_documents for insert to authenticated
  with check (auth.uid() = user_id);

drop policy if exists "Citizens delete their own document metadata" on public.citizen_documents;
create policy "Citizens delete their own document metadata"
  on public.citizen_documents for delete to authenticated
  using (auth.uid() = user_id);

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'citizen-documents',
  'citizen-documents',
  false,
  5242880,
  array['application/pdf','image/jpeg','image/png']
)
on conflict (id) do update
set public = false,
    file_size_limit = 5242880,
    allowed_mime_types = array['application/pdf','image/jpeg','image/png'];

drop policy if exists "Citizens upload to their own private folder" on storage.objects;
create policy "Citizens upload to their own private folder"
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'citizen-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Citizens read their own private documents" on storage.objects;
create policy "Citizens read their own private documents"
  on storage.objects for select to authenticated
  using (
    bucket_id = 'citizen-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

drop policy if exists "Citizens delete their own private documents" on storage.objects;
create policy "Citizens delete their own private documents"
  on storage.objects for delete to authenticated
  using (
    bucket_id = 'citizen-documents'
    and (storage.foldername(name))[1] = auth.uid()::text
  );

-- Keep the previous-passport fields as JSONB on the application record.
-- Citizen RLS on public.applications remains responsible for ownership.
