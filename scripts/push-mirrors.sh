#!/usr/bin/env bash
set -euo pipefail

# scripts/push-mirrors.sh
# Push the current branch to multiple remotes.
# Usage:
#   ./scripts/push-mirrors.sh [remote1 remote2 ...]
# or
#   PUSH_REMOTES=remote1,remote2 ./scripts/push-mirrors.sh

if [ $# -eq 0 ] && [ -z "${PUSH_REMOTES:-}" ]; then
  echo "Usage: $0 [remote1 remote2 ...] or set PUSH_REMOTES env var"
  exit 1
fi

if [ $# -gt 0 ]; then
  REMOTES=("$@")
else
  IFS=',' read -r -a REMOTES <<< "$PUSH_REMOTES"
fi

BRANCH=$(git rev-parse --abbrev-ref HEAD)
echo "Current branch: $BRANCH"

for r in "${REMOTES[@]}"; do
  echo "Pushing to remote: $r"
  git push "$r" "$BRANCH"
done

echo "Push complete."
