# PowerShell helper to install deps and run the two scripts. Edit the variables below before running.

param()

$region = "us-east-1"
$roleName = "github-actions-CrisisLens-oidc"
$githubOwner = "saivarunkonda"
$githubRepo = "CrisisLens"
$branch = "main"
# Provide a comma-separated list of managed policy ARNs to attach
$policyArns = "arn:aws:iam::aws:policy/AmazonEKSClusterPolicy,arn:aws:iam::aws:policy/AmazonS3FullAccess"

# Ensure Node and npm are available
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
  Write-Error "Node.js is not installed or not in PATH. Install Node.js first."
  exit 1
}

Push-Location (Split-Path -Parent $MyInvocation.MyCommand.Definition)

Write-Output "Installing AWS SDK packages (local node_modules)..."
npm install @aws-sdk/client-iam @aws-sdk/client-sts @aws-sdk/client-secrets-manager --no-audit --no-fund

Write-Output "Running create-oidc-role.js"
node .\scripts\create-oidc-role.js $roleName $githubOwner $githubRepo $branch $policyArns $region

# Example put-secrets usage (uncomment and edit values to run)
# $secretsJson = '{"GHCR_TOKEN":"xxxx","MONGODB_URI":"mongodb://...","SUPABASE_SERVICE_ROLE_KEY":"..."}'
# node .\scripts\put-secrets.js $region $secretsJson

Pop-Location
