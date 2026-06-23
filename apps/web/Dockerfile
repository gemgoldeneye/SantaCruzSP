# syntax=docker/dockerfile:1.7
#
# web — the Next.js frontend for SantaCruzSP (federation web app). FRONTEND-ONLY:
# it proxies /api, /auth, /healthz to the Fastify api (see apps/web/next.config)
# via NEXT_PUBLIC_API_BASE, which is baked at BUILD time. pnpm monorepo; the app
# uses Next's `output: 'standalone'`. @gelabs/sp is a PRIVATE npm package so the
# install needs a read token via the BuildKit secret `npm_token`. Build context
# = repo root.
#   docker build --secret id=npm_token,env=NPM_TOKEN \
#     --build-arg NEXT_PUBLIC_API_BASE=http://stcz-sp-api:8787 -f apps/web/Dockerfile .

FROM node:22-alpine AS base
RUN corepack enable && corepack prepare pnpm@11.4.0 --activate
WORKDIR /app
ENV NEXT_TELEMETRY_DISABLED=1

# ---- build: install the `web` subgraph (web + @lgu/santacruz + @gelabs/sp), compile ----
FROM base AS build
# Manifests + lockfile first (layer caching). All workspace package.jsons are
# present so `--frozen-lockfile` validates; `--filter web...` installs ONLY the
# web subgraph (config/santacruz + @gelabs/sp) — not the Fastify api.
COPY pnpm-workspace.yaml pnpm-lock.yaml package.json .npmrc tsconfig.base.json ./
COPY apps/web/package.json ./apps/web/package.json
COPY apps/api/package.json ./apps/api/package.json
COPY config/santacruz/package.json ./config/santacruz/package.json
RUN --mount=type=secret,id=npm_token,required=false \
    NPM_TOKEN="$(cat /run/secrets/npm_token 2>/dev/null || true)" \
    pnpm install --filter "web..." --frozen-lockfile \
 && rm -f .npmrc

# Sources (.dockerignore excludes node_modules/.next). @lgu/santacruz resolves to config/santacruz/src.
COPY config/santacruz ./config/santacruz
COPY apps/web ./apps/web

# The browser calls the api via same-origin /api, /auth, /healthz; the Next server
# rewrites those to NEXT_PUBLIC_API_BASE (the internal api alias on the shared
# edge network). Baked at build time because next.config reads it for rewrites.
ARG NEXT_PUBLIC_API_BASE=http://stcz-sp-api:8787
ENV NEXT_PUBLIC_API_BASE=$NEXT_PUBLIC_API_BASE
RUN pnpm --filter web build

# ---- runner: slim standalone Next server ----
FROM base AS runner
ENV NODE_ENV=production
ENV PORT=4000
ENV HOSTNAME=0.0.0.0
# Next standalone (pnpm-monorepo layout): server.js + traced node_modules live
# under apps/web/. The static + public dirs sit beside it.
COPY --from=build /app/apps/web/.next/standalone ./
COPY --from=build /app/apps/web/.next/static ./apps/web/.next/static
COPY --from=build /app/apps/web/public ./apps/web/public

EXPOSE 4000
CMD ["node", "apps/web/server.js"]
