-- Imported Google Business Profile reviews. Separate from invite-backed public.reviews.
-- Already applied in production. Safe to re-run.

create table if not exists public.google_reviews (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references public.business_profiles (id) on delete cascade,
  provider_review_id text not null,
  rating smallint not null check (rating >= 1 and rating <= 5),
  body text not null default '',
  author_display_name text not null,
  author_photo_url text,
  is_anonymous boolean not null default false,
  provider_create_time timestamptz not null,
  provider_update_time timestamptz,
  owner_reply_body text,
  owner_replied_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (business_id, provider_review_id)
);

create index if not exists google_reviews_business_created_idx
  on public.google_reviews (business_id, provider_create_time desc);

alter table public.google_reviews enable row level security;

revoke all on table public.google_reviews from public, anon, authenticated;
grant all on table public.google_reviews to service_role;
