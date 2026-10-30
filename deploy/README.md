# Deploying the Portal

Production runs on the shared Windows host, in WSL Ubuntu, under `/srv/portal`:
a dedicated Postgres (`db`, volume `portal_pg`, not published) and the app
(`web`) on `127.0.0.1:8040`. Caddy is the only public entry.

## Ship a new version

1. Run the **Build and push Portal image** workflow (Actions → Run workflow →
   `production`). Note the tag it prints, e.g. `sha-e0516c8c218c`.
2. From a machine with the `trucksoft` SSH alias:

   ```bash
   ssh trucksoft "wsl -e bash -s -- sha-e0516c8c218c" < deploy/install.sh
   ```

   It pulls the image, runs `prisma migrate deploy` and the catalog seed from
   the image, starts the app and waits for `/api/health`.

**Roll back:** run the same command with `PORTAL_PREV_TAG` from `/srv/portal/.env`.
Never `docker compose down -v` — that deletes the Portal database.

## First install only

`install.sh` creates `/srv/portal/.env` (mode 600) with generated
`POSTGRES_PASSWORD`, `PORTAL_JWT_SECRET`, `VAULT_MASTER_KEY` and
`PORTAL_ADMIN_PIN` (the `portal.admin` sign-in). Read it on the host; it is
never printed or committed. Changing `VAULT_MASTER_KEY` later makes existing
vault entries unreadable.

Sign-in switches in that file:

| Variable | Now | Meaning |
|---|---|---|
| `DEMO_LOGIN` | `1` | One-click demo views. No vault, never admin. |
| `PIN_ONLY_LOGIN` | `1` | Username + PIN without Zoho, until Zoho OAuth exists. |
| `ZOHO_CLIENT_ID` / `ZOHO_CLIENT_SECRET` | empty | Set both to switch sign-in to Zoho + PIN. |

After editing `.env`: `cd /srv/portal && docker compose up -d web`.

## Public hostname

`portals.trucksoft.com.ng` must resolve to the production host first. Then add
`deploy/Caddyfile.portal` to `C:\Caddy\Caddyfile`, validate, and reload via the
admin API on `127.0.0.1:2020` (see the platform's `docs/ops/SERVER_FOR_AGENTS.md`).
