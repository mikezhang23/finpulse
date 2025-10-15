-- ============================================================================
-- Step 5B: Audit Logging Enhancement - Add Snapshot and Note Fields
-- ============================================================================
-- This script adds new columns to the audit_runs table to support:
-- 1. Complete JSON snapshot of checks + anomalies + LLM explanations
-- 2. Human-readable note summarizing the audit run
-- 3. Count of anomalies detected
-- ============================================================================

-- ============================================================================
-- ADD COLUMNS TO AUDIT_RUNS TABLE
-- ============================================================================

-- Add snapshot_json column to store complete audit snapshot
ALTER TABLE public.audit_runs
ADD COLUMN IF NOT EXISTS snapshot_json JSONB;

-- Add note column for human-readable summary
ALTER TABLE public.audit_runs
ADD COLUMN IF NOT EXISTS note TEXT;

-- Add anomalies_count column to track detected anomalies
ALTER TABLE public.audit_runs
ADD COLUMN IF NOT EXISTS anomalies_count INTEGER DEFAULT 0;

-- ============================================================================
-- ADD COMMENTS
-- ============================================================================

COMMENT ON COLUMN public.audit_runs.snapshot_json IS 'Complete JSON snapshot of validation checks and anomalies with LLM explanations';
COMMENT ON COLUMN public.audit_runs.note IS 'Human-readable summary of the audit run';
COMMENT ON COLUMN public.audit_runs.anomalies_count IS 'Number of anomalies detected during this audit run';

-- ============================================================================
-- CREATE INDEX FOR JSONB QUERIES
-- ============================================================================

-- Create GIN index for efficient JSONB queries
CREATE INDEX IF NOT EXISTS idx_audit_runs_snapshot_json ON public.audit_runs USING GIN (snapshot_json);

-- ============================================================================
-- VERIFY COLUMNS ADDED
-- ============================================================================

-- Check new columns exist
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'audit_runs'
    AND column_name IN ('snapshot_json', 'note', 'anomalies_count')
ORDER BY column_name;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '✓ Added snapshot_json (JSONB) column to audit_runs';
    RAISE NOTICE '✓ Added note (TEXT) column to audit_runs';
    RAISE NOTICE '✓ Added anomalies_count (INTEGER) column to audit_runs';
    RAISE NOTICE '✓ Created GIN index on snapshot_json for efficient queries';
    RAISE NOTICE '';
    RAISE NOTICE 'Next step: Update lib/actions/audit.ts to populate these fields';
END $$;
