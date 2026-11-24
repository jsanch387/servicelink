# Team — SQL in this repo

These are the scripts that still live in the repo. They are idempotent. Production already has them, plus later role and manager rules that are described in [`../DATABASE.md`](../DATABASE.md) and are not stored as files here.

| File                                                                           | What it does                                        |
| ------------------------------------------------------------------------------ | --------------------------------------------------- |
| [`002_team_invites.sql`](./002_team_invites.sql)                               | Invite emails and hashed accept links               |
| [`003_member_work_select.sql`](./003_member_work_select.sql)                   | Active hire SELECT on the job board and shop rows   |
| [`005_member_office_select_revoke.sql`](./005_member_office_select_revoke.sql) | Drops hire SELECT on customers, quotes, and reviews |

`003` also created hire SELECT on customers, quotes, and reviews. `005` removes those. Run `005` after `003` if those scripts are ever applied to a new database. Manager office access is a separate set of policies already on production. It is not in this folder.

The account owner is not a `business_members` row. They stay on `business_profiles.profile_id`.
