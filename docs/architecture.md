# CrisisLens Architecture

This document shows the high-level architecture for CrisisLens, describes component responsibilities, data flows, and where to store the required secrets.

```mermaid
flowchart LR
  subgraph Browser
    U[User / Analyst]
  end

  subgraph Frontend
    N[Next.js App\n(App Router + NextAuth)]
  end

  subgraph Backend
    API[Next.js API Routes]
    ML[FastAPI ML Service]
  end

  subgraph Datastores
    S[Supabase (Postgres)\nreports, users, risk_snapshots, ml_models]
    M[MongoDB (raw_reports, replication_queue)]
  end

  subgraph Infra
    EKS[EKS Cluster / Kubeflow]
    S3[S3 Training Bucket]
    GH[GitHub Actions CI]
    TF[Terraform / eksctl]
  end

  U -->|browser| N
  N -->|auth & api| API
  API -->|reads/writes| S
  API -->|replicate writes| M
  API -->|trigger retrain| EKS
  ML -->|reads raw payloads| M
  ML -->|writes artifacts / training data| S3
  GH -->|seed / ETL / upload| S3
  GH -->|build & push trainer| GHCR[GHCR Registry]
  GH -->|call retrain endpoint| API
  TF -->|provision| EKS
  TF -->|create| S3
  EKS -->|runs| ML
  EKS -->|runs| Cron[flush-replication CronJob]

  %% Secrets (placeholders only)
  classDef secrets fill:#ffe4b5,stroke:#cc9900;
  subgraph Secrets [Secrets - DO NOT COMMIT]
    SEC1[SUPABASE_SERVICE_ROLE_KEY]\n(server-only):::secrets
    SEC2[NEXT_PUBLIC_SUPABASE_URL]\n(client-ok):::secrets
    SEC3[MONGODB_URI]\n(server-only):::secrets
    SEC4[AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY]\n(CI/provision):::secrets
    SEC5[S3_BUCKET]\n(CI/config):::secrets
    SEC6[GHCR_TOKEN]\n(CI->push image):::secrets
    SEC7[DEPLOY_KEY]\n(API auth for retrain):::secrets
    SEC8[INTERNAL_API_KEY]\n(flush endpoint):::secrets
  end

  SEC1 --> S
  SEC2 --> N
  SEC3 --> M
  SEC4 --> GH
  SEC5 --> GH
  SEC6 --> GH
  SEC7 --> API
  SEC8 --> Cron

  title CrisisLens: Architecture (Supabase primary, Mongo for ML, S3 for artifacts)
```

## Notes and recommendations

- Use Supabase (Postgres) as the canonical relational store for reports, users, risk snapshots and model metadata. Use Row-Level Security in production and keep write operations server-only when appropriate.
- Use MongoDB for raw report payloads and high-ingest ML-friendly storage (raw_reports). The app replicates writes from Postgres → Mongo for training/ETL workflows.
- Use S3 (or compatible object storage) for training artifacts and Parquet/CSV datasets. Store manifests alongside data.
- Use GitHub Actions for CI: seeders, ETL runs, trainer image builds, and triggering retrain endpoints. Store tokens and credentials in GitHub Secrets or a secrets manager.
- Prefer GitHub OIDC + IAM roles for automatic, short-lived AWS credentials in CI rather than long-lived secrets.

## Secret Mapping (summary)

- `SUPABASE_SERVICE_ROLE_KEY`: server-only secret, used for DB seeding and ETL reads/writes that require bypassing RLS.
- `NEXT_PUBLIC_SUPABASE_URL`: public base URL for Supabase (safe to expose to client).
- `MONGODB_URI`: server-only connection string for MongoDB Atlas.
- `AWS_ACCESS_KEY_ID` / `AWS_SECRET_ACCESS_KEY`: used by CI for S3 uploads and optional Terraform provisioning; prefer OIDC.
- `S3_BUCKET`: training data + artifacts bucket name.
- `GHCR_TOKEN`: token for pushing trainer images to GHCR.
- `APP_URL` and `DEPLOY_KEY`: used by CI to call the app's retrain endpoint.
- `INTERNAL_API_KEY`: used to protect internal endpoints (replication flush, health checks).

## Next actions

- Add `SUPABASE_SERVICE_ROLE_KEY`, `MONGODB_URI`, and `S3_BUCKET` to GitHub Secrets before running the `ci-seed-and-retrain` workflow.
- If you plan to provision AWS infra from CI, set up a dedicated IAM role with least privilege and enable GitHub OIDC.
- Install the Kubeflow training operator (TFJob/PyTorchJob) on EKS if you want to use CRDs; otherwise the retrain route will create plain `Job` objects.
