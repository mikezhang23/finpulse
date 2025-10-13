-- ============================================================================
-- Step 5A: Security - Enable Row Level Security (RLS)
-- ============================================================================
-- This script enables RLS on all financial tables to ensure data security.
-- Service role will bypass RLS, but application users will need explicit policies.

-- Enable RLS on all main tables
ALTER TABLE IF EXISTS public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.revenues ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.aws_costs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.audit_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.audit_snapshots ENABLE ROW LEVEL SECURITY;
ALTER TABLE IF EXISTS public.accounts ENABLE ROW LEVEL SECURITY;

-- Verify RLS is enabled
SELECT
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
