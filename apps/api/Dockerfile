# syntax=docker/dockerfile:1.7
# @sp/api — the Fastify API for the federation nodes (cloud HUB / onprem NODE).
#
# pnpm monorepo; the app runs via tsx (it ships TS — there is no JS build step), and
# @gelabs/sp is a PRIVATE npm package, so installing needs a read token passed as a
# BuildKit secret named `npm_token`. The deploy composes wire it from $NPM_TOKEN:
#   NPM_TOKEN=<read-token> docker compose -f deploy/cloud/compose.yml build
# or build directly (context = repo root):
#   docker build --secret id=npm_token,env=NPM_TOKEN -f apps/api/Dockerfile .
FROM node:22-alpine
RUN corepack enable && corepack prepare pnpm@11.4.0 --activate
WORKDIR /app

# Manifests + lockfile first (Docker layer caching). All workspace package.jsons are
# present so `--frozen-lockfile` validates against the lockfile; `--filter @sp/api...`
# then installs ONLY the api subgraph (config/santacruz + @gelabs/sp) — not apps/web.
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json .npmrc tsconfig.base.json ./
COPY apps/web/package.json ./apps/web/package.json
COPY apps/api/package.json ./apps/api/package.json
COPY config/santacruz/package.json ./config/santacruz/package.json
RUN --mount=type=secret,id=npm_token,required=false \
    NPM_TOKEN="$(cat /run/secrets/npm_token 2>/dev/null || true)" \
    pnpm install --filter "@sp/api..." --frozen-lockfile \
 && rm -f .npmrc   # only needed for install; drop it so the runtime pnpm doesn't warn on ${NPM_TOKEN}

# Sources (.dockerignore excludes node_modules/.next/dist). tsx (start) + drizzle-kit
# (migrate) come from the install; @lgu/santacruz resolves to config/santacruz/src.
COPY config/santacruz ./config/santacruz
COPY apps/api ./apps/api

EXPOSE 8787
# Apply migrations (OWNER role, idempotent — drizzle-kit applies ./apps/api/drizzle/*.sql)
# then run the server. Runtime env (NODE_ROLE, DATABASE_URL, OWNER_DATABASE_URL,
# REDIS_URL, SESSION_SECRET, PEERS, …) is supplied by the deploy compose. Override the
# CMD to `pnpm --filter @sp/api start` if you orchestrate migrations separately.
CMD ["sh", "-c", "pnpm --filter @sp/api db:migrate && pnpm --filter @sp/api start"]
