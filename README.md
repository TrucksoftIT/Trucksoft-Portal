# TruckSoft Portal

Staff hub for all TruckSoft internal systems: Zoho `@trucksoft.com.ng` company gate, **username + PIN** person identity (shared mailboxes OK), department app tiles, and built-in encrypted credential vault.

Program of record: `trucksoft-platform` → `docs/PLATFORM_PROGRAM.md`.

## Layout

| Path | Role |
|------|------|
| `Launchpad/` | Legacy static homepage (kept until cutover) |
| `web/` | Next.js 15 app (auth, hub, vault, admin) |

## Local development

```bash
# from Trucksoft-Portal/
docker compose up -d
cd web
cp .env.example .env   # set PORTAL_JWT_SECRET + VAULT_MASTER_KEY (≥32 chars)
npm install
npx prisma db push
npm run db:seed
# optional: ALLOW_DEV_LOGIN=1 in .env to skip Zoho
npm run dev            # http://localhost:3000
```

Default seed admin: username `portal.admin`, PIN `change-me-now` (change immediately). With `ALLOW_DEV_LOGIN=1`, open `/login/dev` then unlock with that PIN.

## Auth model

1. Zoho OAuth → email must end with `@trucksoft.com.ng`
2. Pick **username** + enter **PIN**
3. Optional: `allowedZohoEmails` binds a username to specific shared mailboxes

## Production

- Hostname: `portal.trucksoft.com.ng` → Caddy → `127.0.0.1:<port>`
- Image: `ghcr.io/trucksoftit/trucksoft-portal:<tag>` (see `.github/workflows/build-push.yml`)
- Dedicated Postgres (not ERP DB)
- Health: `GET /api/health`
