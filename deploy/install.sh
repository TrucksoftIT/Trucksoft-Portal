#!/usr/bin/env bash
# Install or update the TruckSoft Portal on the production host (WSL Ubuntu, as root).
#
#   ssh trucksoft "wsl -e bash -s -- <image-tag>" < deploy/install.sh
#
# <image-tag> is a GHCR tag from the "Build and push Portal image" workflow,
# e.g. sha-e0516c8c218c. Idempotent: re-run with a new tag to update, or with
# PORTAL_PREV_TAG (from /srv/portal/.env) to roll back.
#
# Secrets are generated here on the host the first time and never printed.
# The app listens on 127.0.0.1:8040 only; Caddy fronts it (deploy/Caddyfile.portal).
set -euo pipefail

TAG="${1:?usage: install.sh <image tag, e.g. sha-e0516c8c218c>}"
DIR=/srv/portal

mkdir -p "$DIR"
cd "$DIR"
umask 077

rand_hex() { head -c "$1" /dev/urandom | od -An -tx1 | tr -d ' \n'; }

if [ ! -f .env ]; then
  pg_pw=$(rand_hex 24)
  {
    echo "PORTAL_TAG=$TAG"
    echo "PORTAL_PREV_TAG="
    echo "POSTGRES_PASSWORD=$pg_pw"
    echo "DATABASE_URL=postgresql://portal:${pg_pw}@db:5432/trucksoft_portal?schema=public"
    echo "PORTAL_JWT_SECRET=$(rand_hex 32)"
    echo "VAULT_MASTER_KEY=$(rand_hex 32)"
    echo "PORTAL_ADMIN_PIN=$(( $(od -An -N4 -tu4 /dev/urandom) % 90000000 + 10000000 ))"
    echo "APP_URL=https://portals.trucksoft.com.ng"
    echo "NEXT_PUBLIC_APP_URL=https://portals.trucksoft.com.ng"
    echo "DEMO_LOGIN=1"
    echo "PIN_ONLY_LOGIN=1"
    echo "ZOHO_CLIENT_ID="
    echo "ZOHO_CLIENT_SECRET="
    echo "ZOHO_REDIRECT_URI=https://portals.trucksoft.com.ng/api/auth/zoho/callback"
    echo "ZOHO_ACCOUNTS_URL=https://accounts.zoho.com"
  } > .env
  echo "Created $DIR/.env with generated secrets (values not shown)."
else
  current=$(sed -n 's/^PORTAL_TAG=//p' .env)
  if [ "$current" != "$TAG" ]; then
    sed -i "s/^PORTAL_PREV_TAG=.*/PORTAL_PREV_TAG=$current/; s/^PORTAL_TAG=.*/PORTAL_TAG=$TAG/" .env
  fi
  echo "Kept existing $DIR/.env; PORTAL_TAG=$TAG (previous: ${current:-none})."
fi
chmod 600 .env

cat > docker-compose.yml <<'EOF'
# Managed by Trucksoft-Portal/deploy/install.sh. Edit the script, not this file.
name: trucksoft-portal
services:
  db:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_USER: portal
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: trucksoft_portal
    volumes:
      - portal_pg:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U portal -d trucksoft_portal"]
      interval: 5s
      timeout: 5s
      retries: 20
  web:
    image: ghcr.io/trucksoftit/trucksoft-portal:${PORTAL_TAG}
    restart: unless-stopped
    env_file: .env
    ports:
      - "127.0.0.1:8040:3000"
    depends_on:
      db:
        condition: service_healthy
volumes:
  portal_pg:
EOF

# Pull from GHCR; an image already loaded on the host (e.g. copied over SSH
# with `docker save | docker load`) is used if the registry refuses.
docker compose pull -q --ignore-pull-failures
docker image inspect "ghcr.io/trucksoftit/trucksoft-portal:$TAG" >/dev/null 2>&1   || { echo "Image $TAG is neither pullable nor loaded on this host." >&2; exit 1; }
docker compose up -d db
docker compose run --rm -T web prisma migrate deploy </dev/null
docker compose run --rm -T web tsx prisma/seed.ts </dev/null
docker compose up -d web

for _ in $(seq 1 30); do
  if curl -fsS http://127.0.0.1:8040/api/health; then echo; echo "Portal $TAG is up on 127.0.0.1:8040"; exit 0; fi
  sleep 2
done
echo "Portal did not report healthy; check: docker compose -f $DIR/docker-compose.yml logs web" >&2
exit 1
