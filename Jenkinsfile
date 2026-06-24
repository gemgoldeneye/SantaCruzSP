// Jenkins pipeline — SantaCruzSP (Santa Cruz Sanggunian) — PRODUCTION / STAGING deploy.
//
// Two-app stack: Fastify `api` + Next.js `web` (frontend-only; it proxies
// /api,/auth,/healthz to the api over the shared edge, so only the WEB has a
// public host). Jenkins owns config: secrets are credentials, non-secrets are
// derived from the GIT BRANCH (see environment{}). The repo is rsynced to the
// VPS; secrets+params stream over SSH stdin to deploy/<env>/remote-deploy.sh,
// which WRITES deploy/<env>/.env (mode 600) and rolls the Swarm stack.
//
// Branch -> env: `staging` branch deploys staging; anything else (main) -> prod.
//
// Required Jenkins credentials (Secret text) — per-LGU, suffixed `-santacruz`:
//   sp-database-url-santacruz · sp-owner-database-url-santacruz · sp-redis-url-santacruz
//   sp-session-secret-santacruz · sp-payment-webhook-secret-santacruz
//   sp-superadmin-email-santacruz · sp-superadmin-password-santacruz (bootstrap seed — first admin login)
// Shared across all LGUs: gelabs-npm-token (private @gelabs scope).
// SSH: zambal-vps-ssh (SSH username with private key).

pipeline {
  agent any

  options {
    timestamps()
    disableConcurrentBuilds()
    timeout(time: 40, unit: 'MINUTES')
  }

  parameters {
    string(name: 'API_REPLICAS', defaultValue: '', description: 'Override API replicas (blank = env default).')
    string(name: 'WEB_REPLICAS', defaultValue: '', description: 'Override web replicas (blank = env default).')
  }

  environment {
    TAG      = "${env.GIT_COMMIT?.take(8) ?: env.BUILD_NUMBER}"
    SSH_CRED = 'zambal-vps-ssh'
    SSH_OPTS = '-o StrictHostKeyChecking=accept-new'

    // Branch → environment: `staging` branch -> staging, else (main) -> prod.
    DEPLOY_ENV = "${(env.BRANCH_NAME ?: env.GIT_BRANCH ?: '').contains('staging') ? 'staging' : 'prod'}"

    STACK      = "${DEPLOY_ENV == 'staging' ? 'stcz-sp-staging' : 'stcz-sp'}"
    ENV_DIR    = "${DEPLOY_ENV == 'staging' ? 'deploy/staging' : 'deploy/prod'}"
    DEPLOY_DIR = "${DEPLOY_ENV == 'staging' ? '/opt/zambal-staging/SantaCruzSP' : '/opt/zambal/SantaCruzSP'}"
    VPS_HOST   = "${DEPLOY_ENV == 'staging' ? '172.237.78.70' : '172.237.78.70'}"
    VPS_USER   = 'deploy'
    DOMAIN     = "${DEPLOY_ENV == 'staging' ? 'glstest.site' : 'glstest.site'}"
    // The single public host (the Next web). The api is internal-only.
    WEB_HOST   = "${DEPLOY_ENV == 'staging' ? 'sp-stacruz-staging.glstest.site' : 'sp.stacruz.glstest.site'}"
    CORS_ORIGINS = "${DEPLOY_ENV == 'staging' ? 'https://sp-stacruz-staging.glstest.site' : 'https://sp.stacruz.glstest.site'}"
  }

  stages {
    stage('Checkout') { steps { checkout scm } }

    stage('Sync to VPS') {
      steps {
        sshagent(credentials: [env.SSH_CRED]) {
          sh '''
            set -eu
            ssh ${SSH_OPTS} ${VPS_USER}@${VPS_HOST} "mkdir -p ${DEPLOY_DIR}"
            rsync -az --delete \
              --exclude '.git' --exclude '**/node_modules' \
              --exclude '**/dist' --exclude '**/.next*' --exclude '**/.env' \
              -e "ssh ${SSH_OPTS}" \
              ./ ${VPS_USER}@${VPS_HOST}:${DEPLOY_DIR}/
          '''
        }
      }
    }

    stage('Build + migrate + rolling deploy') {
      steps {
        withCredentials([
          // Per-LGU secrets (suffixed `-santacruz`) — each LGU has its own.
          string(credentialsId: 'sp-database-url-santacruz', variable: 'SP_DATABASE_URL'),
          string(credentialsId: 'sp-owner-database-url-santacruz', variable: 'SP_OWNER_DATABASE_URL'),
          string(credentialsId: 'sp-redis-url-santacruz', variable: 'SP_REDIS_URL'),
          string(credentialsId: 'sp-session-secret-santacruz', variable: 'SP_SESSION_SECRET'),
          string(credentialsId: 'sp-payment-webhook-secret-santacruz', variable: 'SP_PAYMENT_WEBHOOK_SECRET'),
          // Bootstrap superadmin — the LGU's first/only admin login, consumed by the one-time seed.
          string(credentialsId: 'sp-superadmin-email-santacruz', variable: 'SUPERADMIN_EMAIL'),
          string(credentialsId: 'sp-superadmin-password-santacruz', variable: 'SUPERADMIN_PASSWORD'),
          // @gelabs/sp is a PRIVATE scope — shared npm token across all LGUs (builds api + web).
          string(credentialsId: 'gelabs-npm-token', variable: 'GELABS_NPM_TOKEN')
        ]) {
          sshagent(credentials: [env.SSH_CRED]) {
            sh '''
              set -eu
              : "${API_REPLICAS:=}"
              : "${WEB_REPLICAS:=}"
              ssh ${SSH_OPTS} ${VPS_USER}@${VPS_HOST} "cd ${DEPLOY_DIR} && bash -s" <<EOF
set -eu
export TAG='${TAG}'
export DOMAIN='${DOMAIN}'
export STACK='${STACK}'
export ENV_DIR='${ENV_DIR}'
export SP_DATABASE_URL='${SP_DATABASE_URL}'
export SP_OWNER_DATABASE_URL='${SP_OWNER_DATABASE_URL}'
export SP_REDIS_URL='${SP_REDIS_URL}'
export SP_SESSION_SECRET='${SP_SESSION_SECRET}'
export SP_PAYMENT_WEBHOOK_SECRET='${SP_PAYMENT_WEBHOOK_SECRET}'
export SP_CORS_ORIGINS='${CORS_ORIGINS}'
export SUPERADMIN_EMAIL='${SUPERADMIN_EMAIL}'
export SUPERADMIN_PASSWORD='${SUPERADMIN_PASSWORD}'
export GELABS_NPM_TOKEN='${GELABS_NPM_TOKEN}'
export API_REPLICAS='${API_REPLICAS}'
export WEB_REPLICAS='${WEB_REPLICAS}'
exec bash ${ENV_DIR}/remote-deploy.sh
EOF
            '''
          }
        }
      }
    }

    stage('Smoke (public edge)') {
      steps {
        sh '''
          set -eu
          probe() {
            url="$1"
            for i in $(seq 1 30); do
              code=$(curl -fsSL -o /dev/null -w "%{http_code}" "$url" 2>/dev/null || true)
              case "$code" in 2*|3*) echo "OK  $url ($code)"; return 0 ;; esac
              echo "  ($i/30) $url -> ${code:-no-response}, retrying..."; sleep 3
            done
            echo "FAIL $url"; return 1
          }
          # The web is the only public host; /healthz proxies to the internal api.
          probe "https://${WEB_HOST}/healthz"
          probe "https://${WEB_HOST}/"
        '''
      }
    }
  }

  post {
    failure { echo "SantaCruzSP ${DEPLOY_ENV} deploy FAILED — Swarm rolls back changed services." }
    success { echo "SantaCruzSP ${TAG} live (${DEPLOY_ENV}) on https://${WEB_HOST}" }
  }
}
