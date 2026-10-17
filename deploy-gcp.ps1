param(
  [Parameter(Mandatory=$true)][string]$ProjectId,
  [string]$Region = "asia-south1",
  [string]$BackendService = "aisle-api",
  [string]$WebService = "aisle-web"
)
$ErrorActionPreference = "Stop"
gcloud config set project $ProjectId
gcloud services enable run.googleapis.com cloudbuild.googleapis.com secretmanager.googleapis.com artifactregistry.googleapis.com

# Bootstrap once to discover the generated backend URL. The final deployment
# below immediately replaces this revision with production settings.
gcloud run deploy $BackendService --source backend --region $Region --allow-unauthenticated
$BackendUrl = gcloud run services describe $BackendService --region $Region --format "value(status.url)"

gcloud run deploy $WebService --source . --region $Region --allow-unauthenticated `
  --set-build-env-vars "NEXT_PUBLIC_BACKEND_URL=$BackendUrl" `
  --set-secrets "GOOGLE_API_KEY=aisle-gemini-key:latest"
$WebUrl = gcloud run services describe $WebService --region $Region --format "value(status.url)"

$CorsJson = "[`"$WebUrl`"]"
gcloud run deploy $BackendService --source backend --region $Region --allow-unauthenticated `
  --set-env-vars "ENVIRONMENT=production,DEBUG=false,GOOGLE_MODEL=gemini-3.8-flash,PAYMENT_MODE=demo,PAYMENT_CURRENCY=USD,CORS_ORIGINS=$CorsJson" `
  --set-secrets "DATABASE_URL=aisle-database-url:latest,SECRET_KEY=aisle-jwt-secret:latest,GOOGLE_API_KEY=aisle-gemini-key:latest"
Write-Host "Backend: $BackendUrl"
Write-Host "Frontend: $WebUrl"
