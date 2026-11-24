-- One Google Business connection per ServiceLink business.
-- Tokens stay server-only: RLS on, no policies, grants limited to service_role.
-- Already applied in production. Safe to re-run.

create table if not exists public.google_business_connections (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null unique references public.business_profiles (id) on delete cascade,
  google_account_name text,
  google_location_name text,
  google_location_title text,
  refresh_token text not null,
  access_token text,
  access_token_expires_at timestamptz,
  scopes text not null default 'https://www.googleapis.com/auth/business.manage',
  connected_at timestamptz not null default now(),
  last_synced_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.google_business_connections enable row level security;

revoke all on table public.google_business_connections from public, anon, authenticated;
grant all on table public.google_business_connections to service_role;
