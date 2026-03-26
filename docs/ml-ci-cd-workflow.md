**ML / CI-CD / Kubernetes Integration for CrisisLens**

This document describes how we store model metadata (including `description`), the dataset format expected for training, a recommended CI/CD flow for model builds and retraining, required APIs, and the minimal Kubernetes pieces needed to run training jobs safely.

1) Schema change (already applied to `scripts/seed-supabase.sql`)
- `public.ml_models` now contains a `description TEXT` column to store human-readable model descriptions and notes about dataset or training config.
- Recommendation: mirror this in Mongo `ml_models` collection (store `id`, `tag`, `description`, `created_at`, `metrics`, `artifact_url`).

2) Dataset format for training (recommended)
- Use a columnar row-per-sample format that is easy to ingest by training frameworks (CSV/Parquet/JSONL). Prefer Parquet for scalability; JSONL for nested payloads.
- Required fields (derived from `reports`):
  - `id` (string UUID)
  - `region` (string)
  - `category` (string)
  - `severity` (int 1-5)
  - `note` (text) — raw text field (optional: also store a cleaned/normalized `note_clean`)
  - `created_at` (ISO-8601 timestamp)
  - Optional engineered features: `report_count_window_24h`, `avg_severity_region_30d`, `days_since_last_event`, etc.
- ML training dataset: each row must be numeric features + target label (for supervised tasks). Store raw text separately and produce ML-ready feature tables via preprocessing (batch job or streaming transformer).
- Suggested storage layout:
  - `training/` (object store prefix)
    - `crisislens/reports/parquet/yyyy=2026/mm=03/dd=25/part-000.parquet`
    - `crisislens/training-manifests/manifest-2026-03-25.json` (list of files + schema)

3) Data preparation pipeline
- Extract: query canonical Postgres `reports` (or `raw_reports` in Mongo) for the window of interest.
- Transform: clean/categorize text, encode categorical vars, impute missing values, compute rolling aggregates.
- Load: write Parquet files to object storage (S3/GCS/MinIO) and produce a manifest file.
- Train: run a training container using the manifest path to load Parquet files.
- Validate & Publish: compute metrics, store `metrics` in `public.ml_models` and upload model artifact (e.g., pickled model or ONNX) to object storage; update `artifact_url` in `ml_models`.

4) CI/CD + retrain integration
- Triggers for retrain:
  - Manual: developer triggers via UI or `POST /api/kubeflow/retrain`.
  - Scheduled: nightly/weekly CronJob (Kubernetes) or GitHub Actions schedule.
  - Data-driven: when `N` new rows since last training are observed (event-driven), publish an event.

- CI/CD steps (example GitHub Actions):
  1. On push to `main` or tag, build Docker image for training and push to registry.
  2. Run unit tests and data validation checks.
  3. If retraining requested: call internal API to create a `TrainingJob` (K8s Job) or apply a `CronJob`.
  4. Upon job completion, job posts results to `/api/kubeflow/retrain/callback` with `model_id`, `metrics`, and `artifact_url`.

- Example GitHub Actions job (high level):

```yaml
jobs:
  build-and-push:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
      - run: npm ci
      - uses: docker/build-push-action@v5
        with:
          push: true
          tags: ghcr.io/${{ github.repository_owner }}/crisislens-trainer:latest
  trigger-retrain:
    runs-on: ubuntu-latest
    needs: build-and-push
    steps:
      - run: |
          curl -X POST -H "Authorization: Bearer ${{ secrets.DEPLOY_KEY }}" \
            -H "Content-Type: application/json" \
            https://<your-app>/api/kubeflow/retrain \
            -d '{"manifest":"s3://.../manifest-2026-03-25.json","tag":"nightly-2026-03-25"}'
```

5) Kubernetes APIs / resources required
- API endpoints the app must expose for K8s / CI to call:
  - `POST /api/kubeflow/retrain` — start a retrain (body: manifest path, tag, optional hyperparams). Returns job id.
  - `GET /api/kubeflow/retrain/:jobId/status` — job status (pending/running/succeeded/failed).
  - `POST /api/kubeflow/retrain/callback` — job completion webhook (used by K8s job to notify the app of success/failure and to provide `artifact_url` and `metrics`).
  - `GET /api/ml/models` — list models and metadata (includes `description`, `metrics`, `artifact_url`).
  - `GET /api/ml/models/:id` — model details.
  - `GET /api/ml/models/:id/artifact` — (redirect) or proxy to artifact URL.
  - `POST /api/ml/models/:id/deploy` — (optional) deploy a model to a serving endpoint.

- Kubernetes resources recommended:
  - `Job` or `K8s Pod` to run a one-off training job; include `ServiceAccount` and access to secrets (object storage creds, DB service role key).
  - `CronJob` for scheduled retrain.
  - `ConfigMap` for training config templates (or pass via job env).
  - `Secret` for `SUPABASE_SERVICE_ROLE_KEY`, object store credentials, Docker registry creds.
  - Optionally: `PersistentVolumeClaim` if training requires local scratch (otherwise use object storage).

- Job execution flow:
  1. API creates a `Job` manifest (server-side) and submits to the Kubernetes API (requires in-cluster creds or kubeconfig in CI).
  2. Job image pulls training container, reads manifest from object storage, trains, writes artifact to object storage, then calls the `callback` endpoint with metrics and artifact path.
  3. App verifies artifact signature (optional), updates `public.ml_models` with `metrics` and `artifact_url`.

6) Model artifact and registry
- Store artifacts in object storage with versioned keys: `models/<model-id>/v1/model.pkl` and `models/<model-id>/v1/metadata.json`.
- Keep `artifact_url` and `metrics` in `public.ml_models`.
- Optionally use a small model registry service (a `models` table with `status: candidate/production/archive`).

7) Monitoring and validation
- Include checks in the training job to validate sample counts, feature distributions, and drift detection.
- Push training metrics to a monitoring system (Prometheus/Grafana) or store in `metrics` JSONB.

8) Minimal code changes I recommend now
- Add `description` to `ml_models` (done in `scripts/seed-supabase.sql`).
- Add `artifact_url` column (or store in `metrics` JSON) — optional but recommended.
- Add an API route to `POST /api/kubeflow/retrain` (if not present) that enqueues a K8s Job or triggers CI to run training.
- Add a small `scripts/sync-reports-to-mongo.js` (one-off) to produce Parquet/CSV manifests for training and upload to object storage.

9) Example retrain request body
```json
{
  "manifest": "s3://bucket/crisislens/training-manifests/manifest-2026-03-25.json",
  "tag": "nightly-2026-03-25",
  "hyperparams": {"lr": 0.01, "epochs": 10}
}
```

10) Next steps I can take for you
- Implement `POST /api/kubeflow/retrain` route skeleton in `src/app/api/kubeflow/retrain/route.ts` that validates the request and creates a K8s Job manifest and submits it (or returns the job manifest for a CI runner).
- Add `scripts/sync-reports-to-mongo.js` to export Parquet/CSV to object storage and generate a manifest.
- Add Mongo validators and an `artifact_url` column to `ml_models` schema and seed files.

Tell me which of the next steps you'd like me to implement now (create API route, add sync script, add artifact column, or all of them).

## Secrets and CI configuration

See `docs/architecture.md` for a visual diagram and detailed guidance on secrets placement.

Key secrets to add to your GitHub repository (Settings → Secrets):

- `SUPABASE_SERVICE_ROLE_KEY` — server-only service role key for Supabase Postgres (used by seeders and ETL). Never expose in client-side code.
- `NEXT_PUBLIC_SUPABASE_URL` — public Supabase URL (can be public in frontend env). Keep the service role key separate.
- `MONGODB_URI` — connection string for MongoDB Atlas (server-only).
- `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY` — CI/provisioning credentials (use least-privilege IAM or GitHub OIDC where possible).
- `S3_BUCKET` — target bucket name for training artifacts.
- `GHCR_TOKEN` — token to push trainer images to GitHub Container Registry.
- `APP_URL` — deployed application URL used by GitHub Actions to call retrain endpoint.
- `DEPLOY_KEY` — bearer token used by CI to authenticate with the retrain API.
- `INTERNAL_API_KEY` — used to protect internal endpoints such as replication flush.

Add these secrets before running the `ci-seed-and-retrain` workflow. For sensitive secrets, prefer GitHub Actions secrets or a cloud secret manager and consider using GitHub OIDC for temporary role assumption when provisioning AWS resources.
