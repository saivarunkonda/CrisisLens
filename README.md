# CrisisLens

CrisisLens is a hackathon-ready platform that combines citizen incident reporting and risk forecasting to help response teams act earlier during local crises.

## Stack

- Next.js (App Router, TypeScript, Tailwind)
- **Auth.js (NextAuth v5)** — email/password demo accounts + optional **Google / GitHub SSO**
- **RBAC** — `admin` / `analyst` / `viewer` (OAuth roles from env email lists)
- Light / dark theme (`next-themes`)
- App shell: **sidebar + top navigation**
- API routes (session-protected): risk snapshot, reports, **Kubeflow retrain**
- Python FastAPI ML microservice
- Dockerfiles + Kubernetes manifests
- Kubeflow pipeline starter (`pipelines/crisislens_pipeline.py`)
- GitHub Actions CI

## Required secrets for CI / retrain workflows
Add the following repository secrets (Settings → Secrets → Actions) for the CI workflow that builds/pushes the trainer image and triggers retraining:

- `GHCR_TOKEN` — GitHub Personal Access Token or GHCR token with `write:packages` permission to push images to ghcr.io.
- `APP_URL` — Public URL of your deployed web app (used to call `/api/kubeflow/retrain`).
- `DEPLOY_KEY` — Signed bearer token or API key your app accepts to authorize CI-triggered retrain requests.
- `TRAINING_MANIFEST` — Path/URL to the training manifest (S3/GCS URL or object store prefix) the retrainer will use.

Optional secrets for deployment and training:

- `SUPABASE_SERVICE_ROLE_KEY` — Service role key for Supabase (server-only). Use in CI jobs that need privileged DB access (seeding, migrations). Do NOT expose to client code.
- `MONGODB_URI` — MongoDB connection string used by CI jobs that interact with Mongo.
- `DOCKER_REGISTRY_USER` / `DOCKER_REGISTRY_TOKEN` — If you push to a private registry other than ghcr.io.

## Routes

| Path | Access |
|------|--------|
| `/` | Redirects to `/login` or `/dashboard` |
| `/login` | Public — SSO + credentials |
| `/dashboard` | Signed-in users |
| `/settings` | Signed-in users — theme + RBAC info |
| `/ml/retrain` | **Admin only** — trigger KFP run via API |

## Auth & RBAC

1. Copy `.env.example` to `.env.local`.
2. Set **`AUTH_SECRET`** (required): `openssl rand -base64 32`.
3. **Demo credentials** (no DB):

   - `admin@crisislens.local` / `CrisisLens2026!` — admin (Kubeflow + reports)
   - `analyst@crisislens.local` / `DemoUser2026!` — analyst
   - `viewer@crisislens.local` / `ViewOnly2026!` — read-only (no report POST)

4. **SSO**: set `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` and/or `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` (see `.env.example`). Roles for OAuth users come from **`ADMIN_EMAILS`** and **`ANALYST_EMAILS`** (comma-separated emails); others default to **analyst**.

## Kubeflow retrain (API)

- `POST /api/kubeflow/retrain` — creates a pipeline run (admin only).
- Env: `KFP_API_BASE_URL`, `KFP_PIPELINE_ID`, optional `KFP_PIPELINE_VERSION_ID`, `KFP_BEARER_TOKEN`.
- If not configured, returns a **dry-run** success for demos.

## Project structure (key files)

- `src/auth.ts` — NextAuth config + middleware `authorized` (incl. admin redirect off `/ml/*`)
- `src/middleware.ts` — exports `auth` as middleware
- `src/app/login/page.tsx` — login + SSO
- `src/app/(app)/layout.tsx` — sidebar + top bar
- `src/app/(app)/dashboard/page.tsx` — risk dashboard
- `src/app/(app)/ml/retrain/page.tsx` — retrain UI
- `src/app/api/kubeflow/retrain/route.ts` — KFP REST caller
- `src/lib/kubeflow.ts` — `POST .../apis/v1beta1/runs`
- `src/lib/rbac.ts` — role resolution

## Run locally

**Terminal 1 — ML (optional)**

```bash
pip install -r ml-service/requirements.txt
uvicorn ml-service.app:app --reload --port 8000
```

**Terminal 2 — Next.js**

```bash
cp .env.example .env.local
# Set AUTH_SECRET and ML_SERVICE_URL=http://localhost:8000
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) → sign in → `/dashboard`.

## Docker / Kubernetes

```bash
docker build -t crisislens/web:latest -f Dockerfile.web .
docker build -t crisislens/ml:latest -f Dockerfile.ml .
kubectl apply -f infra/k8s/namespace.yaml
kubectl apply -f infra/k8s/web-deployment.yaml
kubectl apply -f infra/k8s/ml-deployment.yaml
```

Set **`AUTH_SECRET`** and **`ML_SERVICE_URL`** (and optional **`KFP_*`**) in the web deployment env.

## Kubeflow pipeline (offline compile)

```bash
pip install kfp
python pipelines/crisislens_pipeline.py
```

Upload `crisislens_pipeline.yaml` to Kubeflow Pipelines UI.

## Pushing the same repo to multiple GitHub accounts

You can keep the same local repository synchronized across multiple GitHub accounts (for example `work` and `personal`) by adding multiple remotes. Two common patterns:

1) Add multiple remotes to the same repo and push to each remote:

```bash
# add remotes (use SSH URLs or HTTPS with tokens)
git remote add origin-work git@github.com:work-account/crisislens.git
git remote add origin-personal git@github.com:personal-account/crisislens.git

# push current branch to both
git push origin-work $(git rev-parse --abbrev-ref HEAD)
git push origin-personal $(git rev-parse --abbrev-ref HEAD)
```

2) Use separate clones for strict isolation: clone into two folders and set each to a different remote. This is useful if you want completely separate local histories before merging.

SSH key helper (multiple accounts): edit `~/.ssh/config` to map host aliases to different keys and use the host alias in your git remote:

```
Host github-work
   HostName github.com
   User git
   IdentityFile ~/.ssh/id_rsa_work

Host github-personal
   HostName github.com
   User git
   IdentityFile ~/.ssh/id_rsa_personal
```

Then remotes look like:
```
git remote add work git@github-work:work-account/crisislens.git
git remote add personal git@github-personal:personal-account/crisislens.git
```

Scripted helper
----------------
This repo includes a small helper `scripts/push-mirrors.sh` that will push the current branch to a list of remotes. Usage:

```bash
# push to remotes listed as args
./scripts/push-mirrors.sh work personal

# or use env variable (comma-separated)
PUSH_REMOTES=work,personal ./scripts/push-mirrors.sh
```

Security note: for CI or cross-account pushes, create a scoped Personal Access Token (PAT) with the minimal scopes and store it as a secret in the target repo's account. Never store long-lived credentials in the repo.

