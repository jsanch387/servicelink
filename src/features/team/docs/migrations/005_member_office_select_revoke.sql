-- Members keep SELECT on the job board (bookings + shop hours/services).
-- Drop SELECT on owner-office tables: CRM, quotes, reviews.
-- Job contact (name / phone / address) lives on the booking row.

drop policy if exists customers_member_select on public.customers;
drop policy if exists quotes_member_select on public.quotes;
drop policy if exists quote_public_links_member_select on public.quote_public_links;
drop policy if exists quote_outbound_events_member_select on public.quote_outbound_events;
drop policy if exists reviews_member_select on public.reviews;
drop policy if exists review_invites_member_select on public.review_invites;
