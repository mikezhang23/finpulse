-- ============================================================================
-- Step 5A: Security - Create Read-Only Role (fin_reader)
-- ============================================================================
-- This script creates a least-privilege read-only role for financial data access.
-- The fin_reader role can only SELECT data, cannot modify or delete.

-- Create the read-only role if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'fin_reader') THEN
        CREATE ROLE fin_reader NOLOGIN;
        RAISE NOTICE 'Role fin_reader created successfully';
    ELSE
        RAISE NOTICE 'Role fin_reader already exists';
    END IF;
END
$$;

-- Grant USAGE on the public schema
GRANT USAGE ON SCHEMA public TO fin_reader;

-- Grant SELECT permission on all relevant tables
GRANT SELECT ON public.expenses TO fin_reader;
GRANT SELECT ON public.revenues TO fin_reader;
GRANT SELECT ON public.aws_costs TO fin_reader;
GRANT SELECT ON public.audit_runs TO fin_reader;
GRANT SELECT ON public.audit_snapshots TO fin_reader;

-- Grant SELECT on accounts table if it exists
DO $$
BEGIN
    IF EXISTS (
        SELECT FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename = 'accounts'
    ) THEN
        GRANT SELECT ON public.accounts TO fin_reader;
        RAISE NOTICE 'Granted SELECT on accounts table';
    END IF;
END
$$;

-- Grant SELECT on all views (if any exist)
GRANT SELECT ON public.v_aws_costs_daily TO fin_reader;
GRANT SELECT ON public.v_fin_health TO fin_reader;
GRANT SELECT ON public.v_revenue_daily TO fin_reader;

-- Verify the role and permissions
SELECT
    r.rolname as role_name,
    r.rolcanlogin as can_login,
    r.rolsuper as is_superuser,
    array_agg(DISTINCT t.table_name) as accessible_tables
FROM pg_roles r
LEFT JOIN information_schema.table_privileges t
    ON t.grantee = r.rolname
    AND t.table_schema = 'public'
WHERE r.rolname = 'fin_reader'
GROUP BY r.rolname, r.rolcanlogin, r.rolsuper;
