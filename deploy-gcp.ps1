param(
  [Parameter(Mandatory=$true)][string]$ProjectId,
  [string]$Region = "asia-south1",
  [string]$BackendService = "loopora-api",
  [string]$WebService = "loopora-web",
  [string]$SchemaJob = "loopora-schema-init",
  [string]$SeedJob = "loopora-demo-seed",
  [string]$VertexServiceAccountName = "loopora-vertex-runtime",
  [switch]$SeedDemo
)

$ErrorActionPreference = "Stop"
$RequiredSecrets = @("aisle-database-url", "aisle-jwt-secret")
if ($SeedDemo) {
  $RequiredSecrets += @("aisle-demo-merchant-email", "aisle-demo-merchant-password")
}

gcloud config set project $ProjectId
gcloud services enable run.googleapis.com cloudbuild.googleapis.com secretmanager.googleapis.com artifactregistry.googleapis.com aiplatform.googleapis.com iam.googleapis.com

foreach ($SecretName in $RequiredSecrets) {
  gcloud secrets describe $SecretName --project $ProjectId --format "value(name)" | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "Required Secret Manager secret is missing: $SecretName" }
}

# Vertex AI is authenticated with a short-lived access token issued to the
# Cloud Run service identity. No Gemini/Vertex API key is stored or injected.
$VertexServiceAccount = "$VertexServiceAccountName@$ProjectId.iam.gserviceaccount.com"
gcloud iam service-accounts describe $VertexServiceAccount --project $ProjectId --format "value(email)" 2>$null | Out-Null
if ($LASTEXITCODE -ne 0) {
  gcloud iam service-accounts create $VertexServiceAccountName --project $ProjectId --display-name "Loopora Vertex AI runtime"
}
gcloud projects add-iam-policy-binding $ProjectId `
  --member "serviceAccount:$VertexServiceAccount" `
  --role "roles/aiplatform.user" `
  --condition=None | Out-Null

$BootstrapCors = '["https://bootstrap.invalid"]'
gcloud run deploy $BackendService --source backend --region $Region --allow-unauthenticated `
  --set-env-vars "ENVIRONMENT=production,DEBUG=false,PAYMENT_MODE=demo,PAYMENT_CURRENCY=USD,CORS_ORIGINS=$BootstrapCors" `
  --set-secrets "DATABASE_URL=aisle-database-url:latest,SECRET_KEY=aisle-jwt-secret:latest"
$BackendUrl = gcloud run services describe $BackendService --region $Region --format "value(status.url)"
$BackendImage = gcloud run services describe $BackendService --region $Region --format "value(spec.template.spec.containers[0].image)"

gcloud run jobs deploy $SchemaJob --image $BackendImage --region $Region `
  --command "alembic" --args "upgrade,head" --max-retries 1 --task-timeout 10m `
  --set-env-vars "ENVIRONMENT=production,DEBUG=false,CORS_ORIGINS=$BootstrapCors" `
  --set-secrets "DATABASE_URL=aisle-database-url:latest,SECRET_KEY=aisle-jwt-secret:latest"
gcloud run jobs execute $SchemaJob --region $Region --wait

if ($SeedDemo) {
  gcloud run jobs deploy $SeedJob --image $BackendImage --region $Region `
    --command "python" --args "seed_merchant_demo.py" --max-retries 0 --task-timeout 15m `
    --set-env-vars "ENVIRONMENT=production,DEBUG=false,CORS_ORIGINS=$BootstrapCors" `
    --set-secrets "DATABASE_URL=aisle-database-url:latest,SECRET_KEY=aisle-jwt-secret:latest,DEMO_MERCHANT_EMAIL=aisle-demo-merchant-email:latest,DEMO_MERCHANT_PASSWORD=aisle-demo-merchant-password:latest"
  gcloud run jobs execute $SeedJob --region $Region --wait
}

gcloud run deploy $WebService --source . --region $Region --allow-unauthenticated `
  --service-account $VertexServiceAccount `
  --set-build-env-vars "NEXT_PUBLIC_BACKEND_URL=$BackendUrl,BACKEND_URL=$BackendUrl" `
  --set-env-vars "NEXT_PUBLIC_BACKEND_URL=$BackendUrl,BACKEND_URL=$BackendUrl,GOOGLE_CLOUD_PROJECT=$ProjectId,GOOGLE_CLOUD_LOCATION=global,GOOGLE_MODEL=gemini-3.8-flash"
$WebUrl = gcloud run services describe $WebService --region $Region --format "value(status.url)"

$CorsJson = "[`"$WebUrl`"]"
gcloud run services update $BackendService --region $Region `
  --update-env-vars "CORS_ORIGINS=$CorsJson"

Write-Host "Backend: $BackendUrl"
Write-Host "Backend readiness: $BackendUrl/ready"
Write-Host "Frontend: $WebUrl"
Write-Host "Vertex AI runtime identity: $VertexServiceAccount"
Write-Host "Vertex AI model: gemini-3.8-flash (location: global)"
if (-not $SeedDemo) {
  Write-Host "Demo seed was skipped. Re-run with -SeedDemo after creating the two demo credential secrets."
}
