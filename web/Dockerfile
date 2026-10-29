FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json* ./
# The postinstall `prisma generate` needs the schema, which isn't copied yet;
# the builder stage generates the client explicitly.
RUN npm ci --ignore-scripts

FROM node:20-alpine AS builder
WORKDIR /app
# Prisma picks its query engine by the OpenSSL it finds; without it Alpine
# falls back to openssl-1.1 engines that can't load at runtime.
RUN apk add --no-cache openssl
COPY --from=deps /app/node_modules ./node_modules
COPY . .
ENV NEXT_TELEMETRY_DISABLED=1
# NEXT_PUBLIC_* values are inlined into the client bundle at build time, so the
# public app URL must be present during `npm run build`, not just at runtime.
ARG NEXT_PUBLIC_APP_URL
ENV NEXT_PUBLIC_APP_URL=$NEXT_PUBLIC_APP_URL
RUN npm run build

FROM node:20-alpine AS runner
WORKDIR /app
ENV NODE_ENV=production
ENV NEXT_TELEMETRY_DISABLED=1
# Prisma CLI + tsx let the host run migrations and the catalog seed from this
# image: `docker compose run --rm web prisma migrate deploy` / `tsx prisma/seed.ts`.
RUN apk add --no-cache openssl \
  && npm install -g prisma@5.22.0 tsx@4 \
  && addgroup -S portal && adduser -S portal -G portal
COPY --from=builder /app/public ./public
COPY --from=builder /app/.next/standalone ./
COPY --from=builder /app/.next/static ./.next/static
COPY --from=builder /app/prisma ./prisma
COPY --from=builder /app/src/lib/catalog-seed.ts ./src/lib/catalog-seed.ts
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma
COPY --from=builder /app/node_modules/bcryptjs ./node_modules/bcryptjs
USER portal
EXPOSE 3000
ENV PORT=3000
# Bind to all interfaces INSIDE the container; the host publishes only to
# 127.0.0.1:<port>, so loopback-only public exposure is preserved. With
# 127.0.0.1 here the Next standalone server is unreachable on its published port.
ENV HOSTNAME=0.0.0.0
CMD ["node", "server.js"]
