-- scripts/seed-supabase.sql
-- Full schema for CrisisLens (Supabase / Postgres)
-- Run this in Supabase SQL editor or psql connected to your Supabase DB.

-- Safe migration: ensure `created_at` column exists on `public.reports` and normalize common variants.
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = 'reports' AND column_name = 'created_at'
  ) THEN
    IF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'reports' AND column_name = 'createdAt'
    ) THEN
      EXECUTE 'ALTER TABLE public.reports RENAME COLUMN "createdAt" TO created_at';
    ELSIF EXISTS (
      SELECT 1 FROM information_schema.columns
      WHERE table_schema = 'public' AND table_name = 'reports' AND column_name = 'createdat'
    ) THEN
      EXECUTE 'ALTER TABLE public.reports RENAME COLUMN createdat TO created_at';
    ELSE
      -- If table exists but no created_at column, add it (default now())
      IF EXISTS (
        SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'reports'
      ) THEN
        EXECUTE 'ALTER TABLE public.reports ADD COLUMN created_at timestamptz DEFAULT now()';
      END IF;
    END IF;
  END IF;
END
$$;


-- 1) Reports
CREATE TABLE IF NOT EXISTS public.reports (
  id TEXT PRIMARY KEY,
  region TEXT NOT NULL,
  category TEXT NOT NULL,
  severity INTEGER NOT NULL CHECK (severity >= 1 AND severity <= 5),
  note TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 2) Users (optional if you use Supabase Auth; useful for app-level profiles)
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  email TEXT UNIQUE,
  name TEXT,
  role TEXT NOT NULL DEFAULT 'analyst',
  created_at TIMESTAMPTZ DEFAULT now()
);

-- 3) Risk snapshots (periodic summaries)
CREATE TABLE IF NOT EXISTS public.risk_snapshots (
  id TEXT PRIMARY KEY,
  region TEXT NOT NULL,
  flood_risk INTEGER,
  heat_risk INTEGER,
  health_risk INTEGER,
  supply_risk INTEGER,
  overall_risk INTEGER,
  generated_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_risk_snapshots_region ON public.risk_snapshots(region);

-- 4) ML models / retrain metadata
CREATE TABLE IF NOT EXISTS public.ml_models (
  id TEXT PRIMARY KEY,
  tag TEXT,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  metrics JSONB
);

-- 5) Audit / activity logs
CREATE TABLE IF NOT EXISTS public.audit_logs (
  id TEXT PRIMARY KEY,
  user_id TEXT,
  action TEXT,
  detail JSONB,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user ON public.audit_logs(user_id);

-- FOREIGN KEY example (uncomment if you maintain a local users table)
-- ALTER TABLE public.audit_logs
--   ADD CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES public.users(id);

-- 6) Useful indexes for reports
CREATE INDEX IF NOT EXISTS idx_reports_region_category_createdat ON public.reports(region, category, created_at DESC);

-- 7) Row Level Security / Policies (DEMO only)
-- Note: enabling RLS and creating permissive policies is suitable for demo but not for production.
-- Run these if you want public read/insert for quick local testing.

ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;

-- Remove old policies if they exist so this script is idempotent
DROP POLICY IF EXISTS public_select ON public.reports;
DROP POLICY IF EXISTS public_insert ON public.reports;

CREATE POLICY public_select ON public.reports
  FOR SELECT USING (true);

CREATE POLICY public_insert ON public.reports
  FOR INSERT WITH CHECK (true);
 
-- Enable permissive SELECT policies on other tables so anonymous reads work for demo/testing.
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS public_select_users ON public.users;
CREATE POLICY public_select_users ON public.users
  FOR SELECT USING (true);

ALTER TABLE public.risk_snapshots ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS public_select_risks ON public.risk_snapshots;
CREATE POLICY public_select_risks ON public.risk_snapshots
  FOR SELECT USING (true);

ALTER TABLE public.ml_models ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS public_select_ml ON public.ml_models;
CREATE POLICY public_select_ml ON public.ml_models
  FOR SELECT USING (true);

ALTER TABLE public.audit_logs ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS public_select_audit ON public.audit_logs;
CREATE POLICY public_select_audit ON public.audit_logs
  FOR SELECT USING (true);

-- If you use Supabase Auth and want to require authenticated users for writes, consider:
-- ALTER TABLE public.reports ENABLE ROW LEVEL SECURITY;
-- CREATE POLICY auth_insert ON public.reports
--   FOR INSERT WITH CHECK (auth.role() IS NOT NULL);
-- CREATE POLICY auth_select ON public.reports
--   FOR SELECT USING (true);

-- 8) Seed sample rows (optional)
INSERT INTO public.reports (id, region, category, severity, note, created_at)
  SELECT 'test-1','North District','flood',3,'sample report', now()
  WHERE NOT EXISTS (SELECT 1 FROM public.reports WHERE id = 'test-1');

INSERT INTO public.users (id, email, name, role)
  SELECT 'admin@crisislens.local','admin@crisislens.local','admin','admin'
  WHERE NOT EXISTS (SELECT 1 FROM public.users WHERE id = 'admin@crisislens.local');

INSERT INTO public.risk_snapshots (id, region, flood_risk, heat_risk, health_risk, supply_risk, overall_risk)
  SELECT 'snapshot-1','North District',36,52,41,28,39
  WHERE NOT EXISTS (SELECT 1 FROM public.risk_snapshots WHERE id = 'snapshot-1');

INSERT INTO public.ml_models (id, tag, description, metrics)
  SELECT 'model-1','baseline','Initial baseline model','{"mse": 12.3}'::jsonb
  WHERE NOT EXISTS (SELECT 1 FROM public.ml_models WHERE id = 'model-1');

INSERT INTO public.audit_logs (id, user_id, action, detail)
  SELECT 'log-1','admin@crisislens.local','seed','{"note":"seeded initial data"}'::jsonb
  WHERE NOT EXISTS (SELECT 1 FROM public.audit_logs WHERE id = 'log-1');

-- 9) Notes / Cleanup
-- - After importing, open the Supabase Table editor and verify tables exist.
-- - If you want clients to write to `reports` from the browser, either keep RLS disabled
--   or create specific policies that allow authenticated inserts only.
-- - For production: remove the permissive policies above and replace with policies that
--   check `auth.uid()` and roles stored in a profile table.

-- End of schema
