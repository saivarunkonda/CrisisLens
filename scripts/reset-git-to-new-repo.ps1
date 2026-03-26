param(
  [Parameter(Mandatory=$true)] [string] $TargetRepo,
  [Parameter(Mandatory=$true)] [string] $Token
)

Write-Output "Removing .git folder (if present)..."
Try {
  Remove-Item -LiteralPath .git -Recurse -Force -ErrorAction Stop
} Catch {
  # ignore if not present
}

Write-Output "Initializing git repository..."
git init
git add -A
git commit -m "chore: reinitialize repository for $TargetRepo"

$remoteUrl = "https://x-access-token:${Token}@github.com/$TargetRepo.git"
git remote add origin $remoteUrl
git branch -M main

Write-Output "Pushing to $TargetRepo (force)..."
git push -u origin main --force

Write-Output "Done. Repository reinitialized and pushed to $TargetRepo."
