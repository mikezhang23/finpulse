-- ============================================================================
-- Step 5A: Audit Logging - DROP and CREATE Audit Tables (Clean Install)
-- ============================================================================
-- This script DROPS existing audit tables and creates fresh ones.
-- Use this if you're getting errors about existing tables.
-- ============================================================================

-- ============================================================================
-- DROP EXISTING TABLES (IF THEY EXIST)
-- ============================================================================

DROP TABLE IF EXISTS public.audit_snapshots CASCADE;
DROP TABLE IF EXISTS public.audit_runs CASCADE;

-- ============================================================================
-- CREATE AUDIT RUNS TABLE
-- ============================================================================
-- Records each validation execution with summary statistics

CREATE TABLE public.audit_runs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    run_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    total_checks INTEGER NOT NULL,
    passed INTEGER NOT NULL DEFAULT 0,
    failed INTEGER NOT NULL DEFAULT 0,
    warnings INTEGER NOT NULL DEFAULT 0,
    overall_status TEXT NOT NULL CHECK (overall_status IN ('PASS', 'WARN', 'FAIL')),
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster queries on recent runs
CREATE INDEX idx_audit_runs_run_at ON public.audit_runs(run_at DESC);

-- Add comment explaining the table
COMMENT ON TABLE public.audit_runs IS 'Records each validation execution with summary statistics';

-- ============================================================================
-- CREATE AUDIT SNAPSHOTS TABLE
-- ============================================================================
-- Point-in-time check results for each validation run

CREATE TABLE public.audit_snapshots (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    audit_run_id UUID NOT NULL REFERENCES public.audit_runs(id) ON DELETE CASCADE,
    check_name TEXT NOT NULL,
    category TEXT NOT NULL CHECK (category IN ('DATA_QUALITY', 'COMPLIANCE', 'DATA_COMPLETENESS')),
    status TEXT NOT NULL CHECK (status IN ('PASS', 'WARN', 'FAIL')),
    failures INTEGER NOT NULL DEFAULT 0,
    total INTEGER NOT NULL,
    description TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for faster queries
CREATE INDEX idx_audit_snapshots_run_id ON public.audit_snapshots(audit_run_id);
CREATE INDEX idx_audit_snapshots_category ON public.audit_snapshots(category);

-- Add comment explaining the table
COMMENT ON TABLE public.audit_snapshots IS 'Point-in-time check results for each validation run';

-- ============================================================================
-- ENABLE ROW LEVEL SECURITY
-- ============================================================================
-- Enable RLS on audit tables (service role will bypass)

ALTER TABLE public.audit_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_snapshots ENABLE ROW LEVEL SECURITY;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================
-- Grant SELECT to fin_reader role (read-only access) if it exists

DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'fin_reader') THEN
        GRANT SELECT ON public.audit_runs TO fin_reader;
        GRANT SELECT ON public.audit_snapshots TO fin_reader;
        RAISE NOTICE '✓ Granted SELECT permissions to fin_reader';
    ELSE
        RAISE NOTICE '⚠ fin_reader role does not exist, skipping permission grants';
    END IF;
END $$;

-- ============================================================================
-- CREATE RLS POLICIES FOR FIN_READER
-- ============================================================================
-- Allow fin_reader to view all audit data (only if role exists)

DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'fin_reader') THEN
        CREATE POLICY "fin_reader can view all audit runs"
            ON public.audit_runs
            FOR SELECT
            TO fin_reader
            USING (true);

        CREATE POLICY "fin_reader can view all audit snapshots"
            ON public.audit_snapshots
            FOR SELECT
            TO fin_reader
            USING (true);

        RAISE NOTICE '✓ Created RLS policies for fin_reader';
    ELSE
        RAISE NOTICE '⚠ fin_reader role does not exist, skipping RLS policy creation';
    END IF;
END $$;

-- ============================================================================
-- VERIFY TABLES CREATED
-- ============================================================================

-- Check if tables exist
SELECT
    schemaname,
    tablename,
    tableowner,
    hasindexes,
    rowsecurity
FROM pg_tables
WHERE schemaname = 'public'
    AND tablename IN ('audit_runs', 'audit_snapshots')
ORDER BY tablename;

-- Check table structure
SELECT
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name IN ('audit_runs', 'audit_snapshots')
ORDER BY table_name, ordinal_position;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✓✓✓ Audit tables created successfully ✓✓✓';
    RAISE NOTICE '';
    RAISE NOTICE 'Tables created:';
    RAISE NOTICE '  - audit_runs (summary of validation runs)';
    RAISE NOTICE '  - audit_snapshots (detailed check results)';
    RAISE NOTICE '';
    RAISE NOTICE 'Next step: Run 05_create_validation_view.sql to create the validation view';
END $$;
