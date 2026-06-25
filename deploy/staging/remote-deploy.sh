#!/usr/bin/env bash
# Runs ON THE STAGING VPS. Builds the 2-app SantaCruzSP stack (Fastify `api` +
# Next.js `web`), migrates + seeds the managed DB once, and rolls the
# stcz-sp-staging Swarm stack. Jenkins passes every value as an ENV VAR (secrets from
# credentials, the rest from params); this script WRITES deploy/staging/.env
# (mode 600) — nobody hand-places it. Required env:
#
#   TAG DOMAIN
#   SP_DATABASE_URL SP_OWNER_DATABASE_URL SP_REDIS_URL SP_SESSION_SECRET
#   SP_CORS_ORIGINS GELABS_NPM_TOKEN SUPERADMIN_EMAIL SUPERADMIN_PASSWORD
#   [SP_PAYMENT_WEBHOOK_SECRET API_REPLICAS WEB_REPLICAS]
set -euo pipefail

: "${TAG:?set TAG to the image tag (git sha)}"
: "${DOMAIN:?set DOMAIN (e.g. glstest.site)}"
STACK="${STACK:-stcz-sp-staging}"
ENV_DIR="${ENV_DIR:-deploy/staging}"

cd "$(dirname "$0")/../.."          # repo root
echo "==> deploying SantaCruzSP $TAG to stack $STACK (env dir: $ENV_DIR)"

# 1) Materialise $ENV_DIR/.env from the env Jenkins passed (read by compose).
: "${SP_DATABASE_URL:?Jenkins must pass SP_DATABASE_URL (credential)}"
: "${SP_OWNER_DATABASE_URL:?Jenkins must pass SP_OWNER_DATABASE_URL (credential)}"
: "${SP_REDIS_URL:?Jenkins must pass SP_REDIS_URL (credential)}"
: "${SP_SESSION_SECRET:?Jenkins must pass SP_SESSION_SECRET (credential)}"
: "${SP_CORS_ORIGINS:?Jenkins must pass SP_CORS_ORIGINS (param)}"
# Bootstrap superadmin — required by the one-time seed (apps/api seed.ts throws
# without them). Fail fast here, before building images.
: "${SUPERADMIN_EMAIL:?Jenkins must pass SUPERADMIN_EMAIL (credential sp-superadmin-email)}"
: "${SUPERADMIN_PASSWORD:?Jenkins must pass SUPERADMIN_PASSWORD (credential sp-superadmin-password)}"

umask 077
# Single-quote every value: this file is SOURCED below, so values with
# shell-special chars (@ # & = in DB passwords, commas in CORS) must not be
# word-split. A literal single-quote inside a value is escaped as '\''.
sq() { printf "%s" "$1" | sed "s/'/'\\\\''/g"; }
cat > "$ENV_DIR/.env" <<EOF
SP_DATABASE_URL='$(sq "${SP_DATABASE_URL}")'
SP_OWNER_DATABASE_URL='$(sq "${SP_OWNER_DATABASE_URL}")'
SP_REDIS_URL='$(sq "${SP_REDIS_URL}")'
SP_SESSION_SECRET='$(sq "${SP_SESSION_SECRET}")'
SP_CORS_ORIGINS='$(sq "${SP_CORS_ORIGINS}")'
SP_PAYMENT_WEBHOOK_SECRET='$(sq "${SP_PAYMENT_WEBHOOK_SECRET:-}")'
API_REPLICAS=${API_REPLICAS:-1}
WEB_REPLICAS=${WEB_REPLICAS:-1}
EOF
echo "==> wrote $ENV_DIR/.env (mode 600)"
set -a; . "$ENV_DIR/.env"; set +a

# 2) Build images locally on the VPS (no registry). @gelabs/sp is a PRIVATE npm
#    scope — pass the read token to BOTH builds as a BuildKit secret (never baked
#    into a layer). The web bakes NEXT_PUBLIC_API_BASE at build time so the Next
#    server proxies /api,/auth,/healthz to the api over the edge (stcz-sp-api alias).
: "${GELABS_NPM_TOKEN:?Jenkins must pass GELABS_NPM_TOKEN (credential) for the private @gelabs npm scope}"
DOCKER_BUILDKIT=1 docker build -f apps/api/Dockerfile -t "stcz-sp-api:$TAG" \
  --secret id=npm_token,env=GELABS_NPM_TOKEN .
DOCKER_BUILDKIT=1 docker build -f apps/web/Dockerfile -t "stcz-sp-web:$TAG" \
  --secret id=npm_token,env=GELABS_NPM_TOKEN \
  --build-arg NEXT_PUBLIC_API_BASE=http://stcz-sp-api:8787 .

# 2.9) Pre-migrate SAFETY (auto): ALWAYS back up the DB before migrating (the
#      rollback story). AND, while data.documents.tenant_id still exists (before the
#      0003 migration drops it), REFUSE to proceed if the DB holds more than one
#      tenant — dropping tenant_id would merge rows and collide on the rebuilt primary
#      keys. The multi-tenant guard self-disables once de-tenanted.
mkdir -p backups
docker run --rm -e PGURL="$SP_OWNER_DATABASE_URL" postgres:16-alpine \
  sh -c 'pg_dump "$PGURL"' > "backups/pre_${TAG}.sql" \
  && echo "==> backup -> backups/pre_${TAG}.sql ($(wc -c < backups/pre_${TAG}.sql) bytes)"
q_hastid="SELECT EXISTS(SELECT 1 FROM information_schema.columns WHERE table_schema='data' AND table_name='documents' AND column_name='tenant_id')"
HAS_TID=$(docker run --rm -e PGURL="$SP_OWNER_DATABASE_URL" postgres:16-alpine \
  sh -c 'psql "$PGURL" -tAc "'"$q_hastid"'"' 2>/dev/null | tr -d '[:space:]')
if [ "$HAS_TID" = "t" ]; then
  TENANTS=$(docker run --rm -e PGURL="$SP_OWNER_DATABASE_URL" postgres:16-alpine \
    sh -c 'psql "$PGURL" -tAc "SELECT count(DISTINCT tenant_id) FROM data.documents"' 2>/dev/null | tr -d '[:space:]')
  if [ "${TENANTS:-0}" -gt 1 ] 2>/dev/null; then
    echo "!! ABORT: DB holds ${TENANTS} tenants — dropping tenant_id would merge rows + collide on rebuilt PKs. Split into per-LGU databases first, then redeploy." >&2
    exit 1
  fi
  echo "==> de-tenant safety OK (distinct tenants: ${TENANTS:-0})"
fi

# 3) Migrate once (owner role). Idempotent — drizzle applies pending SQL only.
docker run --rm \
  -e OWNER_DATABASE_URL="$SP_OWNER_DATABASE_URL" \
  -e DATABASE_URL="$SP_DATABASE_URL" \
  "stcz-sp-api:$TAG" pnpm db:migrate

# 3b) Seed ONCE, ever. The SP seed is a DEV seed that is NOT idempotent (inserts
#     fresh uuidv7 rows each run), so it must run exactly once on initial setup.
#     Guard: a marker row in `_seed_meta`, checked/written via psql from a
#     throwaway postgres container (no psql needed on the VPS). Runs against the
#     OWNER url so it bypasses RLS, same as the seed itself.
seed_once() {
  local marker="$1"; shift            # remaining args = the seed command
  local q_check q_mark out rc
  q_check="CREATE TABLE IF NOT EXISTS _seed_meta (marker text PRIMARY KEY, seeded_at timestamptz NOT NULL DEFAULT now()); \
           SELECT 1 FROM _seed_meta WHERE marker = '$marker';"
  if docker run --rm -e PGURL="$SP_OWNER_DATABASE_URL" postgres:16-alpine \
       sh -c 'psql "$PGURL" -tAc "'"$q_check"'"' 2>/dev/null | grep -q 1; then
    echo "==> seed '$marker' already applied — skipping"
    return 0
  fi
  echo "==> seeding '$marker' (first time)"
  set +e
  out="$("$@" 2>&1)"; rc=$?
  set -e
  printf '%s\n' "$out"
  if [ "$rc" -ne 0 ]; then
    if printf '%s' "$out" | grep -qiE 'duplicate key|already exists|code: .?23505|unique constraint'; then
      echo "==> seed '$marker' hit duplicate data — already seeded; recording marker and continuing"
    else
      echo "!! seed '$marker' failed (exit $rc) for a non-duplicate reason — aborting" >&2
      return "$rc"
    fi
  fi
  q_mark="INSERT INTO _seed_meta (marker) VALUES ('$marker') ON CONFLICT DO NOTHING;"
  docker run --rm -e PGURL="$SP_OWNER_DATABASE_URL" postgres:16-alpine \
    sh -c 'psql "$PGURL" -c "'"$q_mark"'"' >/dev/null
  echo "==> recorded seed marker '$marker'"
}
# Seed/refresh on EVERY deploy. The bootstrap seed is idempotent (data uses
# ON CONFLICT DO NOTHING; built-in roles are delete-protected) and RE-APPLIES the
# superadmin password from the current SUPERADMIN_* creds — so rotating the Jenkins
# credential takes effect here. (Was marker-gated via seed_once -> skipped on
# re-deploy, which left the first-seeded superadmin password stuck.)
docker run --rm \
  -e OWNER_DATABASE_URL="$SP_OWNER_DATABASE_URL" \
  -e DATABASE_URL="$SP_DATABASE_URL" \
  -e SUPERADMIN_EMAIL="$SUPERADMIN_EMAIL" \
  -e SUPERADMIN_PASSWORD="$SUPERADMIN_PASSWORD" \
  "stcz-sp-api:$TAG" pnpm db:seed

# 4) Rolling deploy. The SHARED edge (deploy/edge/) owns :80/:443 + TLS; this
#    stack ships no nginx — the services attach to `zambal-edge` with the
#    stcz-sp-web / stcz-sp-api aliases (see compose.yml).
export TAG
docker stack deploy -c "$ENV_DIR/compose.yml" "$STACK"

# 5) Wait for convergence.
echo "==> waiting for services to converge"
deadline=$(( SECONDS + 300 ))
while :; do
  pending=0
  while read -r name replicas _; do
    [ "$name" = "NAME" ] && continue
    [ "${replicas%%/*}" = "${replicas##*/}" ] || { pending=1; echo "  $name: $replicas"; }
  done < <(docker stack services "$STACK")
  [ "$pending" -eq 0 ] && { echo "==> all services converged"; break; }
  [ "$SECONDS" -ge "$deadline" ] && { echo "!! convergence timeout"; docker stack services "$STACK"; exit 1; }
  sleep 5
done
