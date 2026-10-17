param(
  [Parameter(Mandatory=$true)][string]$ProjectId,
  [string]$Region = "asia-south1",
  [string]$BackendService = "loopora2-api",
  [string]$WebService = "loopora2-web",
  [string]$SchemaJob = "loopora2-schema-init",
  [string]$SeedJob = "loopora2-demo-seed",
  [string]$DatabaseSecret = "aisle-database-url",
  [string]$JwtSecret = "aisle-jwt-secret",
  [string]$GeminiSecret = "aisle-gemini-key",
  [string]$DemoMerchantEmailSecret = "aisle-demo-merchant-email",
  [string]$DemoMerchantPasswordSecret = "aisle-demo-merchant-password",
  [switch]$SeedDemo
)

$ErrorActionPreference = "Stop"
$RequiredSecrets = @($DatabaseSecret, $JwtSecret, $GeminiSecret)
if ($SeedDemo) {
  $RequiredSecrets += @($DemoMerchantEmailSecret, $DemoMerchantPasswordSecret)
}

gcloud config set project $ProjectId
gcloud services enable run.googleapis.com cloudbuild.googleapis.com secretmanager.googleapis.com artifactregistry.googleapis.com

foreach ($SecretName in $RequiredSecrets) {
  gcloud secrets describe $SecretName --project $ProjectId --format "value(name)" | Out-Null
  if ($LASTEXITCODE -ne 0) { throw "Required Secret Manager secret is missing: $SecretName" }
}

$BootstrapCors = '["https://bootstrap.invalid"]'
gcloud run deploy $BackendService --source backend --region $Region --allow-unauthenticated `
  --set-env-vars "ENVIRONMENT=production,DEBUG=false,GOOGLE_MODEL=gemini-3.8-flash,PAYMENT_MODE=demo,PAYMENT_CURRENCY=USD,CORS_ORIGINS=$BootstrapCors" `
  --set-secrets "DATABASE_URL=$DatabaseSecret`:latest,SECRET_KEY=$JwtSecret`:latest,GOOGLE_API_KEY=$GeminiSecret`:latest"
$BackendUrl = gcloud run services describe $BackendService --region $Region --format "value(status.url)"
$BackendImage = gcloud run services describe $BackendService --region $Region --format "value(spec.template.spec.containers[0].image)"

gcloud run jobs deploy $SchemaJob --image $BackendImage --region $Region `
  --command "alembic" --args "upgrade,head" --max-retries 1 --task-timeout 10m `
  --set-env-vars "ENVIRONMENT=production,DEBUG=false,CORS_ORIGINS=$BootstrapCors" `
  --set-secrets "DATABASE_URL=$DatabaseSecret`:latest,SECRET_KEY=$JwtSecret`:latest"
gcloud run jobs execute $SchemaJob --region $Region --wait

if ($SeedDemo) {
  gcloud run jobs deploy $SeedJob --image $BackendImage --region $Region `
    --command "python" --args "seed_merchant_demo.py" --max-retries 0 --task-timeout 15m `
    --set-env-vars "ENVIRONMENT=production,DEBUG=false,CORS_ORIGINS=$BootstrapCors" `
    --set-secrets "DATABASE_URL=$DatabaseSecret`:latest,SECRET_KEY=$JwtSecret`:latest,DEMO_MERCHANT_EMAIL=$DemoMerchantEmailSecret`:latest,DEMO_MERCHANT_PASSWORD=$DemoMerchantPasswordSecret`:latest"
  gcloud run jobs execute $SeedJob --region $Region --wait
}

gcloud run deploy $WebService --source . --region $Region --allow-unauthenticated `
  --set-build-env-vars "NEXT_PUBLIC_BACKEND_URL=$BackendUrl,BACKEND_URL=$BackendUrl" `
  --set-env-vars "NEXT_PUBLIC_BACKEND_URL=$BackendUrl,BACKEND_URL=$BackendUrl,GOOGLE_MODEL=gemini-3.8-flash" `
  --set-secrets "GOOGLE_API_KEY=$GeminiSecret`:latest"
$WebUrl = gcloud run services describe $WebService --region $Region --format "value(status.url)"

$CorsJson = "[`"$WebUrl`"]"
gcloud run services update $BackendService --region $Region --update-env-vars "CORS_ORIGINS=$CorsJson"

Write-Host "Checking backend readiness..."
$ReadyUrl = "$BackendUrl/ready"
$Ready = Invoke-RestMethod -Uri $ReadyUrl -Method Get
if ($Ready.status -ne "ready" -or $Ready.database -ne "reachable") {
  throw "Backend deployed, but database readiness failed at $ReadyUrl"
}

Write-Host "AI Mavericks 2 deployment ready."
Write-Host "Backend: $BackendUrl"
Write-Host "Backend readiness: $ReadyUrl"
Write-Host "Frontend: $WebUrl"
if (-not $SeedDemo) {
  Write-Host "Demo seed was skipped. Re-run with -SeedDemo when demo credential secrets are configured."
}
