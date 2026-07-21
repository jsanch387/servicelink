# Marketplace Location Data Plan

Status: Draft  
Current priority: Mobile detailing services  
Last updated: July 17, 2026

## Goal

Build location data correctly from the beginning so customers can find mobile
detailers that actually serve their area.

The current version should stay focused:

- Businesses choose where they provide mobile service.
- Businesses choose how far they are willing to travel.
- Customers search by city, neighborhood, ZIP, or address.
- Saving location data does not automatically publish a marketplace listing.

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

## Deferred

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

1. Create `business_service_areas`.
2. Save the existing modal selection to the database.
3. Load saved data when the dashboard opens.
4. Allow businesses to edit their service area.
5. Replace city/free-text marketplace matching with PostGIS radius matching.
6. Add marketplace opt-in separately.
7. Add broad city/neighborhood intersection search.
8. Design physical shop locations and map presentation later.
