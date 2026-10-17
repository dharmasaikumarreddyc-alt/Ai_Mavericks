#!/usr/bin/env bash
set -euo pipefail

PROJECT_ID="${1:-project-08a199a1-b3a6-4e7d-b5f}"
REGION="${REGION:-asia-south1}"
BACKEND_SERVICE="${BACKEND_SERVICE:-loopora2-api}"
WEB_SERVICE="${WEB_SERVICE:-loopora2-web}"
SCHEMA_JOB="${SCHEMA_JOB:-loopora2-schema-init}"
SEED_JOB="${SEED_JOB:-loopora2-demo-seed}"
DATABASE_SECRET="${DATABASE_SECRET:-aisle-database-url}"
JWT_SECRET="${JWT_SECRET:-aisle-jwt-secret}"
GEMINI_SECRET="${GEMINI_SECRET:-aisle-gemini-key}"
DEMO_EMAIL_SECRET="${DEMO_EMAIL_SECRET:-aisle-demo-merchant-email}"
DEMO_PASSWORD_SECRET="${DEMO_PASSWORD_SECRET:-aisle-demo-merchant-password}"
SEED_DEMO="${SEED_DEMO:-false}"

printf 'Deploying AI Mavericks 2 to project %s in %s\n' "$PROJECT_ID" "$REGION"
gcloud config set project "$PROJECT_ID"
gcloud services enable run.googleapis.com cloudbuild.googleapis.com secretmanager.googleapis.com artifactregistry.googleapis.com

required=("$DATABASE_SECRET" "$JWT_SECRET" "$GEMINI_SECRET")
if [[ "$SEED_DEMO" == "true" ]]; then
  required+=("$DEMO_EMAIL_SECRET" "$DEMO_PASSWORD_SECRET")
fi
for secret in "${required[@]}"; do
  gcloud secrets describe "$secret" --project "$PROJECT_ID" >/dev/null
  printf 'Secret OK: %s\n' "$secret"
done

BOOTSTRAP_CORS='["https://bootstrap.invalid"]'

gcloud run deploy "$BACKEND_SERVICE" \
  --source backend \
  --region "$REGION" \
  --allow-unauthenticated \
  --set-env-vars "ENVIRONMENT=production,DEBUG=false,GOOGLE_MODEL=gemini-3.8-flash,PAYMENT_MODE=demo,PAYMENT_CURRENCY=USD,CORS_ORIGINS=$BOOTSTRAP_CORS" \
  --set-secrets "DATABASE_URL=${DATABASE_SECRET}:latest,SECRET_KEY=${JWT_SECRET}:latest,GOOGLE_API_KEY=${GEMINI_SECRET}:latest"

BACKEND_URL="$(gcloud run services describe "$BACKEND_SERVICE" --region "$REGION" --format='value(status.url)')"
BACKEND_IMAGE="$(gcloud run services describe "$BACKEND_SERVICE" --region "$REGION" --format='value(spec.template.spec.containers[0].image)')"

gcloud run jobs deploy "$SCHEMA_JOB" \
  --image "$BACKEND_IMAGE" \
  --region "$REGION" \
  --command alembic \
  --args upgrade,head \
  --max-retries 1 \
  --task-timeout 10m \
  --set-env-vars "ENVIRONMENT=production,DEBUG=false,CORS_ORIGINS=$BOOTSTRAP_CORS" \
  --set-secrets "DATABASE_URL=${DATABASE_SECRET}:latest,SECRET_KEY=${JWT_SECRET}:latest"

gcloud run jobs execute "$SCHEMA_JOB" --region "$REGION" --wait

if [[ "$SEED_DEMO" == "true" ]]; then
  gcloud run jobs deploy "$SEED_JOB" \
    --image "$BACKEND_IMAGE" \
    --region "$REGION" \
    --command python \
    --args seed_merchant_demo.py \
    --max-retries 0 \
    --task-timeout 15m \
    --set-env-vars "ENVIRONMENT=production,DEBUG=false,CORS_ORIGINS=$BOOTSTRAP_CORS" \
    --set-secrets "DATABASE_URL=${DATABASE_SECRET}:latest,SECRET_KEY=${JWT_SECRET}:latest,DEMO_MERCHANT_EMAIL=${DEMO_EMAIL_SECRET}:latest,DEMO_MERCHANT_PASSWORD=${DEMO_PASSWORD_SECRET}:latest"
  gcloud run jobs execute "$SEED_JOB" --region "$REGION" --wait
fi

gcloud run deploy "$WEB_SERVICE" \
  --source . \
  --region "$REGION" \
  --allow-unauthenticated \
  --set-build-env-vars "NEXT_PUBLIC_BACKEND_URL=$BACKEND_URL,BACKEND_URL=$BACKEND_URL" \
  --set-env-vars "NEXT_PUBLIC_BACKEND_URL=$BACKEND_URL,BACKEND_URL=$BACKEND_URL,GOOGLE_MODEL=gemini-3.8-flash" \
  --set-secrets "GOOGLE_API_KEY=${GEMINI_SECRET}:latest"

WEB_URL="$(gcloud run services describe "$WEB_SERVICE" --region "$REGION" --format='value(status.url)')"
CORS_JSON="[\"$WEB_URL\"]"
gcloud run services update "$BACKEND_SERVICE" --region "$REGION" --update-env-vars "CORS_ORIGINS=$CORS_JSON"

printf '\nChecking database readiness...\n'
curl --fail --silent --show-error "$BACKEND_URL/ready"
printf '\n\nAI Mavericks 2 deployed successfully.\nBackend: %s\nReadiness: %s/ready\nFrontend: %s\n' "$BACKEND_URL" "$BACKEND_URL" "$WEB_URL"
