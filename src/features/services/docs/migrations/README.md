# Services — Supabase migrations

**Production safety:** These scripts only **add nullable columns**. They do not update, delete, or backfill existing data.

## Run order (Supabase SQL Editor)

| Order | File                         | What it does                                      |
| ----- | ---------------------------- | ------------------------------------------------- |
| 1     | `001_service_image_path.sql` | Nullable `image_path` on `business_services`      |

After running, service photos upload from **Dashboard → Services → Edit service**.
