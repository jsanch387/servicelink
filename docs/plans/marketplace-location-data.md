# Marketplace Location Data Plan

Status: Draft  
Current priority: Collect business service areas (web + mobile)  
Last updated: July 20, 2026

## Goal

Build location data correctly from the beginning so customers can find mobile
detailers that actually serve their area.

The current version should stay focused:

- Businesses choose where they provide mobile service.
- Businesses choose how far they are willing to travel.
- Customers search by city, neighborhood, ZIP, or address.
- Saving location data does not automatically publish a marketplace listing.

## What is already working

- Marketplace landing + search UI (`/marketplace`)
- City / ZIP text search against existing `service_area` / `business_zip`
- Results cards → public booking profile
- MapTiler autocomplete + radius UI (web modal, localStorage only)

## Next moves (bring this to life)

### Ship now — Collect location (tomorrow)

This is the highest-leverage move. Without saved service areas, there is no
real marketplace network.

1. Create `business_service_areas` (PostGIS + RLS).
2. Persist modal confirm to the database (replace localStorage).
3. Require service area on every login / dashboard entry until saved.
4. Ship the same required flow on the mobile app.
5. Prefill / edit when a primary service area already exists.

Outcome: every returning business adds a searchable coverage center + radius.

### Next after collection — Make search use real coverage

Keep marketplace UI light. Improve matching once we have data.

1. Geocode customer search (city / ZIP / address) → point.
2. Match businesses whose service radius contains that point.
3. Sort by distance (closest first), then rating / reviews.
4. Show distance on result cards (e.g. “4.2 mi”).

Do not block shipping collection on these search upgrades.

### Later (still light) — Customer discovery upgrades

Only after we have enough businesses with locations:

1. “Use my current location” (browser geolocation → reverse geocode → search).
2. Marketplace opt-in (separate from location completeness).
3. Richer cards: photos, starting price, response time / availability signal.
4. Result actions: View profile, See photos, Call / text.

### Future (not V1)

- Map view with coverage markers (never expose mobile home coords)
- Multiple service areas / neighborhoods
- Shop / branch physical locations table
- Date availability filter
- Instant book vs request
- Activity-based listing pause / reconfirm

## Why marketplace feels “the same” right now

Search still uses free-text city/ZIP matching. The new location modal does not
write to the database yet, so marketplace results cannot use radius data.
Collection first → matching second.

## Core distinction

We have two different location concepts.

### Mobile service areas

A service area describes where a business wants customers. It is not the
business owner's home or physical location.

Examples:

- Austin with a 25-mile radius
- North Austin with a 15-mile radius
- Pflugerville with a 20-mile radius

This is the current priority.

### Physical business locations

A physical location is a shop or branch that customers can visit. It may have a
public address and an exact map pin.

This is a later feature, but the data model must leave room for it.

## Proposed tables

### `business_service_areas`

Mobile coverage areas.

Suggested data:

- `id`
- `business_profile_id`
- `label` — for example, Austin, TX
- `city`
- `state_code`
- `postal_code` — optional
- `country_code`
- `center` — PostGIS geographic point
- `radius_miles`
- `place_type` — city, neighborhood, ZIP, or address
- `provider` — MapTiler
- `provider_place_id`
- `is_primary`
- `is_active`
- `verified_at`
- `created_at`
- `updated_at`

V1 should support one primary service area per business. The table should allow
multiple rows later without a redesign.

### `business_locations`

Future customer-visitable shops and branches.

Suggested data:

- `id`
- `business_profile_id`
- `location_kind` — shop or branch
- Full normalized address
- Exact PostGIS geographic point
- `customer_visitable`
- `address_public`
- `is_primary`
- `is_active`
- MapTiler provider metadata
- Verification timestamps

This table must not be used for mobile owners' home addresses.

## Mobile business flow

1. Ask: “Where do you serve?”
2. Let the business select a city, neighborhood, ZIP, or address.
3. Capture the normalized MapTiler result and coordinates.
4. Ask for travel distance.
5. Preview the result:
   “Customers within 25 miles of Austin, TX can find your business.”
6. Save or update the primary service-area row.

The selected point represents the center of coverage, not a claimed physical
business address.

## Customer search behavior

### Exact address or ZIP search

- Geocode the query into a point.
- Find service areas whose radius contains that point.
- Sort eligible businesses using coverage, distance, rating, and review count.

### City or neighborhood search

A broad place search should not rely only on the city-center point.

For example, searching Austin should include businesses serving North Austin,
East Austin, Pflugerville, and nearby areas when their coverage intersects the
Austin search area.

MapTiler's selected place ID, bounding box, and eventual place geometry can be
used to determine this broader intersection.

## Future marketplace map

### Mobile businesses

- Never display a home address or imply that the service-area center is a shop.
- Label markers as mobile service or “serves this area.”
- Use coverage circles or service-area markers.
- Cluster overlapping markers.
- Do not generate fake physical locations merely to separate pins.

### Shops

- Show an exact pin only when customers can visit.
- Clearly distinguish shop pins from mobile-service coverage.
- A business using both modes may have a shop pin and a mobile coverage area.

## Privacy and security requirements

- Do not store mobile home addresses unless a future feature truly requires it.
- Never return private coordinates or addresses from public marketplace APIs.
- Keep physical location records protected by owner-only RLS.
- Public marketplace responses must return only explicitly approved fields.
- Validate coordinates, radius, place type, and provider IDs on the server.
- Location completeness and marketplace opt-in must remain separate.
- Updating a service area must not automatically publish a business.

## Database preparation

- Enable PostGIS.
- Add a GiST index to service-area center points.
- Add database constraints for valid radii and normalized state/country codes.
- Add owner-only RLS policies.
- Add a server endpoint that validates and upserts the primary service area.
- Stop using free-text `service_area` as the long-term search source.
- Keep existing location fields temporarily for migration compatibility.

## Current V1 scope

- One mobile service area per business
- City, neighborhood, ZIP, or address selection
- Radius-based coverage
- Database persistence
- Business update flow
- Customer point search
- Existing marketplace eligibility rules

## Deferred customer experience notes

Keep V1 light. Capture these for later product work:

- “Use my location” on marketplace search
- Distance-to-customer on result cards
- View profile / See photos / Call (or text) actions on cards
- Starting price and photo strip on cards
- Availability / next open slot signal
- Marketplace map (coverage, not home pins)
- Date filter on search
- Marketplace listing opt-in + verified / Pro trust badges
- Listing pause when inactive for too long

## Deferred location / map features

- Multiple service areas
- Customer-facing map
- Custom polygons or drawn service boundaries
- Multiple shops and branches
- Shop-specific hours
- Service-specific coverage areas
- Automatic travel-time calculations
- Traffic-aware matching

## Open questions for later

- Should free businesses be allowed to save multiple service areas?
- How many service areas should Pro businesses receive?
- Should a business be able to choose a neighborhood without selecting a city?
- Should service radius be capped differently by business type?
- Should customers searching a city see all intersecting coverage areas or only
  businesses covering the city center?
- How should overlapping mobile markers appear on the map?
- Should mobile map results display coverage circles by default or only when a
  result is selected?
- How often should businesses reconfirm their service areas?
- Should inactive businesses be automatically paused from marketplace search?
- How do we handle businesses serving areas across state lines?
- When should a home-based garage count as a customer-visitable shop?
- What warning and consent are required before publishing a shop address?
- Should businesses be able to hide a shop address while still accepting
  appointments there?
- Do different services need different travel radii later?

## Recommended implementation order

1. Create `business_service_areas` + PostGIS.
2. Save the existing modal selection to the database (web).
3. Require location on login / dashboard until complete.
4. Ship the same required collect-location flow on mobile.
5. Allow businesses to edit their service area later.
6. Replace city/free-text marketplace matching with PostGIS radius matching.
7. Show distance on marketplace result cards.
8. Add “Use my location” for customers.
9. Add marketplace opt-in separately.
10. Add richer cards / map / shops later.
