-- Active teammates can SELECT the owner's shop work tables.
-- Writes stay owner-only. The account owner is not in business_members.

create or replace function public.auth_is_active_business_member(p_business_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (
    select 1
    from public.business_members bm
    where bm.business_id = p_business_id
      and bm.user_id = auth.uid()
      and bm.status = 'active'
  );
$$;

revoke all on function public.auth_is_active_business_member(uuid) from public;
grant execute on function public.auth_is_active_business_member(uuid) to authenticated;

drop policy if exists business_profiles_member_select on public.business_profiles;
create policy business_profiles_member_select
  on public.business_profiles
  for select
  to authenticated
  using (public.auth_is_active_business_member(id));

drop policy if exists bookings_member_select on public.bookings;
create policy bookings_member_select
  on public.bookings
  for select
  to authenticated
  using (public.auth_is_active_business_member(business_id));

drop policy if exists booking_requests_member_select on public.booking_requests;
create policy booking_requests_member_select
  on public.booking_requests
  for select
  to authenticated
  using (public.auth_is_active_business_member(business_id));

drop policy if exists customers_member_select on public.customers;
create policy customers_member_select
  on public.customers
  for select
  to authenticated
  using (public.auth_is_active_business_member(business_id));

drop policy if exists quotes_member_select on public.quotes;
create policy quotes_member_select
  on public.quotes
  for select
  to authenticated
  using (public.auth_is_active_business_member(business_id));

drop policy if exists quote_public_links_member_select on public.quote_public_links;
create policy quote_public_links_member_select
  on public.quote_public_links
  for select
  to authenticated
  using (
    exists (
      select 1
      from public.quotes q
      where q.id = quote_public_links.quote_id
        and public.auth_is_active_business_member(q.business_id)
    )
  );

drop policy if exists quote_outbound_events_member_select on public.quote_outbound_events;
create policy quote_outbound_events_member_select
  on public.quote_outbound_events
  for select
  to authenticated
  using (public.auth_is_active_business_member(business_id));

drop policy if exists reviews_member_select on public.reviews;
create policy reviews_member_select
  on public.reviews
  for select
  to authenticated
  using (public.auth_is_active_business_member(business_id));

drop policy if exists review_invites_member_select on public.review_invites;
create policy review_invites_member_select
  on public.review_invites
  for select
  to authenticated
  using (public.auth_is_active_business_member(business_id));

drop policy if exists business_availability_member_select on public.business_availability;
create policy business_availability_member_select
  on public.business_availability
  for select
  to authenticated
  using (public.auth_is_active_business_member(business_id));

drop policy if exists business_services_member_select on public.business_services;
create policy business_services_member_select
  on public.business_services
  for select
  to authenticated
  using (public.auth_is_active_business_member(business_id));

drop policy if exists business_images_member_select on public.business_images;
create policy business_images_member_select
  on public.business_images
  for select
  to authenticated
  using (public.auth_is_active_business_member(business_id));

drop policy if exists business_service_areas_member_select on public.business_service_areas;
create policy business_service_areas_member_select
  on public.business_service_areas
  for select
  to authenticated
  using (public.auth_is_active_business_member(business_profile_id));

drop policy if exists maintenance_enrollments_member_select on public.maintenance_enrollments;
create policy maintenance_enrollments_member_select
  on public.maintenance_enrollments
  for select
  to authenticated
  using (public.auth_is_active_business_member(business_id));

drop policy if exists public_analytics_events_member_select on public.public_analytics_events;
create policy public_analytics_events_member_select
  on public.public_analytics_events
  for select
  to authenticated
  using (public.auth_is_active_business_member(business_profile_id));
