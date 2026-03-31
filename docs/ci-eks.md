**CI → EKS: Setup & Secrets**

- **Overview**: The repo contains a GitHub Actions workflow `.github/workflows/build-and-deploy-eks.yml` that:
  - Builds the `ml-service` trainer image and pushes to GHCR
  - Uses GitHub OIDC to assume an AWS role (`AWS_ROLE_ARN`) and update kubeconfig
  - Applies a retrain job manifest to your EKS cluster

- **Required repo secrets** (add in Settings → Secrets → Actions):
  - `GHCR_TOKEN` — token with `write:packages` and `repo` scope for GHCR pushes
  - `AWS_ROLE_ARN` — the IAM Role ARN for GitHub OIDC to assume
  - `AWS_REGION` — e.g. `us-east-1`
  - `EKS_CLUSTER_NAME` — your EKS cluster name
  - `TRAINING_MANIFEST` — S3 path or manifest location used by retrain job

- **Optional/ML secrets**:
  - `SUPABASE_SERVICE_ROLE_KEY`, `MONGODB_URI`, `INTERNAL_API_KEY`, `S3_BUCKET`, `DEPLOY_KEY`

- **Create IAM role (example)**: see `infra/terraform/github_oidc_role.tf`. After running Terraform, copy the output `role_arn` into repo secret `AWS_ROLE_ARN`.

- **Add secrets via `gh` CLI**:
```
gh secret set GHCR_TOKEN --body '<token>' --repo OWNER/REPO
gh secret set AWS_ROLE_ARN --body 'arn:aws:iam::123456789012:role/...' --repo OWNER/REPO
gh secret set AWS_REGION --body 'us-east-1' --repo OWNER/REPO
gh secret set EKS_CLUSTER_NAME --body 'my-eks-cluster' --repo OWNER/REPO
```

- **Run the workflow manually**:
  - Open Actions → `Build trainer image and deploy to EKS` → Run workflow
  - Or use CLI: `gh workflow run build-and-deploy-eks.yml --repo OWNER/REPO --ref main`

- **Notes & troubleshooting**:
  - If the workflow fails at `aws-actions/configure-aws-credentials`, ensure the role trust policy matches the repo `sub` claim and `ref` you expect (example in Terraform uses `refs/heads/main`).
  - For S3 access from pods, prefer IRSA: create an IAM role for the Kubernetes `ServiceAccount` and annotate the SA with the role ARN.
