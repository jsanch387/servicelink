-- Pending team invites (email + hashed link). Member row is created only after accept.
-- Authenticated clients are SELECT only (shop owner). Writes use the service role.

create table if not exists public.team_invites (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.business_profiles(id) on delete cascade,
  email text not null,
  link_token_hash text not null unique,
  status text not null default 'pending',
  invited_by uuid not null references auth.users(id) on delete cascade,
  accepted_user_id uuid references auth.users(id) on delete set null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint team_invites_status_check
    check (status in ('pending', 'accepted', 'revoked', 'expired')),
  constraint team_invites_email_not_blank
    check (length(trim(email)) > 0)
);

create unique index if not exists team_invites_pending_email_per_business
  on public.team_invites (business_id, email)
  where status = 'pending';

create index if not exists team_invites_business_id_idx
  on public.team_invites (business_id);

drop trigger if exists team_invites_set_updated_at on public.team_invites;
create trigger team_invites_set_updated_at
  before update on public.team_invites
  for each row
  execute function public.set_updated_at();

alter table public.team_invites enable row level security;

drop policy if exists team_invites_owner_select on public.team_invites;
create policy team_invites_owner_select
  on public.team_invites
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.business_profiles bp
      where bp.id = team_invites.business_id
        and bp.profile_id = auth.uid()
    )
  );

revoke all on table public.team_invites from anon, authenticated;
grant select on table public.team_invites to authenticated;
