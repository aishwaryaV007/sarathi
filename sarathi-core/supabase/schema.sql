-- ============================================================================
-- Sarathi database schema (Supabase / Postgres)
-- Run this in the Supabase dashboard → SQL Editor → New query → Run.
-- Auth (auth.users) is provided by Supabase; we reference it.
-- ============================================================================

-- 1. User profile (extends Supabase auth.users)
create table if not exists profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  email text,
  created_at timestamptz default now()
);

-- 2. Document vault — one row per uploaded document, reused across applications
create table if not exists documents (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  doc_type text not null,            -- 'PAN' | 'Aadhaar' | 'Bank account' | 'Premises proof' | ...
  file_path text,                    -- path in Supabase Storage bucket 'documents'
  status text default 'verified',    -- 'verified' | 'pending'
  created_at timestamptz default now(),
  unique (user_id, doc_type)
);

-- 3. Business projects the user is setting up
create table if not exists projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  description text,
  business_type text,
  city text,
  state text,
  investment_lakh numeric,
  workers int,
  uses_power boolean,
  handles_food boolean,
  uses_groundwater boolean,
  premises text,
  entity_type text,
  created_at timestamptz default now()
);

-- 4. Applications — one row per approval the user has applied for
create table if not exists applications (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  approval_id text not null,         -- matches catalog.json id, e.g. 'cte'
  approval_name text not null,
  department text,
  status text default 'under_review',-- 'under_review' | 'approved' | 'action_needed'
  sla_deadline timestamptz,
  submitted_at timestamptz default now()
);

-- ----------------------------------------------------------------------------
-- Row Level Security: each user sees only their own rows.
-- ----------------------------------------------------------------------------
alter table profiles      enable row level security;
alter table documents     enable row level security;
alter table projects      enable row level security;
alter table applications  enable row level security;

create policy "own profile"      on profiles     for all using (auth.uid() = id)       with check (auth.uid() = id);
create policy "own documents"    on documents    for all using (auth.uid() = user_id)  with check (auth.uid() = user_id);
create policy "own projects"     on projects     for all using (auth.uid() = user_id)  with check (auth.uid() = user_id);
create policy "own applications" on applications for all using (auth.uid() = user_id)  with check (auth.uid() = user_id);

-- ----------------------------------------------------------------------------
-- Storage bucket for documents (run once; or create in dashboard → Storage).
-- ----------------------------------------------------------------------------
insert into storage.buckets (id, name, public)
values ('documents', 'documents', false)
on conflict (id) do nothing;
