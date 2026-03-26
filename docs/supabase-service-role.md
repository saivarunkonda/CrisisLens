**Supabase Service Role Key (seeding / admin tasks)**

This document shows recommended places to store the Supabase `service_role` key and safe one-off commands to run the seeders locally without persisting the secret to disk.

- **Why keep it secret:** The service role key is fully privileged for your Supabase project. Do NOT expose it to client code or commit it to repositories.

**Vercel (recommended for frontend + serverless deployments)**
- Project Settings → Environment Variables → Add `SUPABASE_SERVICE_ROLE_KEY` as a "Secret". Use the value in server-only functions or API routes.

**GitHub Actions (CI / migrations / seeding)**
- Store the key as a repository secret named `SUPABASE_SERVICE_ROLE_KEY` and reference it in workflows. Example job snippet:

```yaml
jobs:
  seed:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
      - run: npm ci
      - name: Run Supabase seeder
        env:
          NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.NEXT_PUBLIC_SUPABASE_URL }}
          NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.NEXT_PUBLIC_SUPABASE_ANON_KEY }}
          SUPABASE_SERVICE_ROLE_KEY: ${{ secrets.SUPABASE_SERVICE_ROLE_KEY }}
        run: npm run seed-supabase
```

**Kubernetes (server-side workloads)**
- Create a Kubernetes Secret and reference it in Pod/Deployment manifests.

```bash
kubectl create secret generic supabase-secrets \
  --from-literal=SUPABASE_SERVICE_ROLE_KEY="<your-service-role-key>"
```

- Example `Deployment` env snippet:

```yaml
env:
  - name: SUPABASE_SERVICE_ROLE_KEY
    valueFrom:
      secretKeyRef:
        name: supabase-secrets
        key: SUPABASE_SERVICE_ROLE_KEY
```

**Local one-off commands (do NOT save to `.env.local`)**

- macOS / Linux (bash, zsh):

```bash
read -s -p "Paste SUPABASE_SERVICE_ROLE_KEY: " key
echo
SUPABASE_SERVICE_ROLE_KEY="$key" npm run seed-supabase
# key is only in the single process environment; nothing written to disk
```

- Windows PowerShell (one-liner):

```powershell
$key = Read-Host -Prompt "Paste SUPABASE_SERVICE_ROLE_KEY"
$env:SUPABASE_SERVICE_ROLE_KEY = $key
npm run seed-supabase
Remove-Item Env:\SUPABASE_SERVICE_ROLE_KEY
```

Notes:
- The commands above inject the service role key into the environment only for the running command or session; the value is not saved to `.env.local`.
- Prefer storing the key in your hosting provider's secret store (Vercel env, GitHub secrets, Kubernetes Secret, etc.). Only use local one-off runs for ad-hoc seeding or admin tasks.

**If you want me to run seeding here**
- I won't request the secret in chat; instead, run one of the commands above locally (paste the key when prompted). If you'd like, paste the output here after running and I can help confirm success or debug errors.