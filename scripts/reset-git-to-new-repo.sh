#!/usr/bin/env bash
set -euo pipefail
# Usage:
# TARGET_REPO=owner/repo MIRROR_PAT=ghp_xxx ./scripts/reset-git-to-new-repo.sh

if [ -z "${TARGET_REPO:-}" ]; then
  echo "Environment variable TARGET_REPO must be set (owner/repo)" >&2
  exit 1
fi

if [ -z "${MIRROR_PAT:-}" ] && [ -z "${GH_TOKEN:-}" ]; then
  echo "Provide MIRROR_PAT or GH_TOKEN environment variable with a PAT" >&2
  exit 1
fi

echo "Removing .git directory..."
rm -rf .git

echo "Initializing new git repository and committing current tree..."
git init
git add -A
git commit -m "chore: reinitialize repository for ${TARGET_REPO}"

if [ -n "${MIRROR_PAT:-}" ]; then
  REMOTE_URL="https://x-access-token:${MIRROR_PAT}@github.com/${TARGET_REPO}.git"
elif [ -n "${GH_TOKEN:-}" ]; then
  REMOTE_URL="https://x-access-token:${GH_TOKEN}@github.com/${TARGET_REPO}.git"
fi

echo "Adding remote origin -> $REMOTE_URL"
git remote add origin "$REMOTE_URL"
git branch -M main

echo "Pushing to origin (force)..."
git push -u origin main --force

echo "Done. Repository reinitialized and pushed to ${TARGET_REPO}."
