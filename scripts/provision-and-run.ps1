# scripts/provision-and-run.ps1
# Usage: Open PowerShell in repo root and run:
#   .\scripts\provision-and-run.ps1
# This will download Terraform & eksctl to .tools, create an S3 bucket, and create EKS via eksctl.
# Ensure AWS CLI is configured (aws sts get-caller-identity should succeed).

Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'

# Config
$region = "us-east-1"
$bucketName = "crisislens-training-$([guid]::NewGuid().ToString().Substring(0,8))"
$toolsDir = Join-Path $PWD ".tools"
New-Item -Path $toolsDir -ItemType Directory -Force | Out-Null

Write-Host "Downloading Terraform and eksctl into $toolsDir ..."
# Terraform and eksctl URLs (change versions if desired)
$tfVersion = "1.6.9"
$tfUrl = "https://releases.hashicorp.com/terraform/$tfVersion/terraform_${tfVersion}_windows_amd64.zip"
$eksUrl = "https://github.com/weaveworks/eksctl/releases/latest/download/eksctl_Windows_amd64.zip"

# Helper to download
function Download-File($url,$out) {
  Write-Host "Downloading $url ..."
  Invoke-WebRequest -Uri $url -OutFile $out -UseBasicParsing
}

$tfZip = Join-Path $toolsDir "terraform.zip"
$eksZip = Join-Path $toolsDir "eksctl.zip"

Download-File $tfUrl $tfZip
Download-File $eksUrl $eksZip

Write-Host "Extracting ..."
Expand-Archive -Path $tfZip -DestinationPath $toolsDir -Force
Expand-Archive -Path $eksZip -DestinationPath $toolsDir -Force

# make local tools runnable by pathing to them directly
$terraformExe = Join-Path $toolsDir "terraform.exe"
$eksctlExe = Join-Path $toolsDir "eksctl.exe"

if (-Not (Test-Path $terraformExe)) { Write-Error "terraform.exe not found in $toolsDir"; exit 1 }
if (-Not (Test-Path $eksctlExe)) { Write-Error "eksctl.exe not found in $toolsDir"; exit 1 }

Write-Host "Terraform and eksctl downloaded."

# Quick verification
& $terraformExe --version
& $eksctlExe version

# Create S3 bucket (using aws cli)
Write-Host "Creating S3 bucket: $bucketName in $region"
aws s3api create-bucket --bucket $bucketName --region $region `
  --create-bucket-configuration LocationConstraint=$region | Out-Null

Write-Host "S3 bucket created: $bucketName"

# Create EKS cluster using repo's eksctl config
$eksConfig = Join-Path $PWD "infra/eksctl/cluster.yaml"
if (-Not (Test-Path $eksConfig)) {
  Write-Error "Cluster config not found at infra/eksctl/cluster.yaml"
  exit 1
}

Write-Host "Creating EKS cluster using eksctl (this may take ~15-30 minutes)..."
# eksctl will create the cluster and nodegroups per infra/eksctl/cluster.yaml
& $eksctlExe create cluster -f $eksConfig

Write-Host "EKS cluster create command finished. Verify with:"
Write-Host "  .tools\\eksctl.exe get cluster"
Write-Host "  kubectl get nodes"

Write-Host ""
Write-Host "NEXT STEPS (run locally after verifying cluster & S3):"
Write-Host "1) Seed Supabase (requires SUPABASE_SERVICE_ROLE_KEY):"
Write-Host "   $env:SUPABASE_SERVICE_ROLE_KEY = '<service-role-key>'; node scripts/seed-supabase.js; Remove-Item Env:\\SUPABASE_SERVICE_ROLE_KEY"
Write-Host "2) Seed Mongo (requires MONGODB_URI):"
Write-Host "   $env:MONGODB_URI = '<mongodb-uri>'; node scripts/seed-mongo.js; Remove-Item Env:\\MONGODB_URI"
Write-Host "3) Build & push trainer (example GHCR):"
Write-Host "   echo $env:GHCR_TOKEN | docker login ghcr.io -u <username> --password-stdin"
Write-Host "   docker build -f Dockerfile.ml -t ghcr.io/<owner>/crisislens-trainer:latest ."
Write-Host "   docker push ghcr.io/<owner>/crisislens-trainer:latest"
Write-Host "4) Run ETL and upload training CSV/manifest to S3 (set AWS creds and S3_BUCKET):"
Write-Host "   $env:SUPABASE_SERVICE_ROLE_KEY = '<service-role-key>'; $env:NEXT_PUBLIC_SUPABASE_URL = 'https://your.supabase.co'; $env:MONGODB_URI = '<mongodb-uri>'; $env:S3_BUCKET = '$bucketName'; node scripts/sync-reports-to-mongo.js"
Write-Host "5) Trigger retrain endpoint (set APP_URL and DEPLOY_KEY):"
Write-Host "   curl -X POST \"<APP_URL>/api/kubeflow/retrain\" -H \"Authorization: Bearer <DEPLOY_KEY>\" -H \"Content-Type: application/json\" -d '{\"image\":\"ghcr.io/<owner>/crisislens-trainer:latest\",\"manifest\":\"s3://$bucketName/path/manifest.json\"}'"

Write-Host ""
Write-Host "Script finished. If any step fails, paste the error and I will help debug."
