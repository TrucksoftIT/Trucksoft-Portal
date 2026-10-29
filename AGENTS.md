# TruckSoft Portal — agent entry

This repo is the **staff hub** (Zoho gate + username/PIN + vault).

**Platform union (goals, handoff, server rules):** open the sibling clone of `TrucksoftIT/trucksoft-platform` and read:

1. `AGENTS.md`
2. `docs/agents/UNION.md`
3. `docs/agents/HANDOFF.md`
4. `docs/agents/RULES.md`
5. `docs/ops/SERVER_FOR_AGENTS.md`

Program of record: `docs/PLATFORM_PROGRAM.md` in that repo.

## This repo quick facts

- App root: `web/` (Next.js 15 + Prisma)
- Local DB: `docker compose up -d` (Postgres on host **5545**)
- Dev: `cd web && npm run dev` (avoid Turbopack on broken Windows SWC hosts; `dev:turbo` optional)
- Dev login: `ALLOW_DEV_LOGIN=1` → `/login/dev` → `/api/auth/dev-gate` → PIN
- Seed admin: `portal.admin` / change PIN immediately
- Prod target: `portal.trucksoft.com.ng` → Caddy → `127.0.0.1:<port>`; image `ghcr.io/trucksoftit/trucksoft-portal:<tag>`
- Health: `GET /api/health`

When you finish Portal work, update **`trucksoft-platform` → `docs/agents/HANDOFF.md`** so other agents stay in sync.
