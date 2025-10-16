-- ============================================================================
-- Step 5A: Security - Create RLS Policies for fin_reader
-- ============================================================================
-- These policies allow the fin_reader role to SELECT all data from financial tables.
-- Service role bypasses RLS, so application functionality remains unchanged.

-- ============================================================================
-- EXPENSES TABLE POLICIES
-- ============================================================================

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "fin_reader can view all expenses" ON public.expenses;

-- Create policy for fin_reader to SELECT all expenses
CREATE POLICY "fin_reader can view all expenses"
ON public.expenses
FOR SELECT
TO fin_reader
USING (true);

-- ============================================================================
-- REVENUES TABLE POLICIES
-- ============================================================================

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "fin_reader can view all revenues" ON public.revenues;

-- Create policy for fin_reader to SELECT all revenues
CREATE POLICY "fin_reader can view all revenues"
ON public.revenues
FOR SELECT
TO fin_reader
USING (true);

-- ============================================================================
-- AWS_COSTS TABLE POLICIES
-- ============================================================================

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "fin_reader can view all aws_costs" ON public.aws_costs;

-- Create policy for fin_reader to SELECT all aws_costs
CREATE POLICY "fin_reader can view all aws_costs"
ON public.aws_costs
FOR SELECT
TO fin_reader
USING (true);

-- ============================================================================
-- AUDIT_RUNS TABLE POLICIES
-- ============================================================================

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "fin_reader can view all audit_runs" ON public.audit_runs;

-- Create policy for fin_reader to SELECT all audit_runs
CREATE POLICY "fin_reader can view all audit_runs"
ON public.audit_runs
FOR SELECT
TO fin_reader
USING (true);

-- ============================================================================
-- AUDIT_SNAPSHOTS TABLE POLICIES
-- ============================================================================

-- Drop existing policy if it exists
DROP POLICY IF EXISTS "fin_reader can view all audit_snapshots" ON public.audit_snapshots;

-- Create policy for fin_reader to SELECT all audit_snapshots
CREATE POLICY "fin_reader can view all audit_snapshots"
ON public.audit_snapshots
FOR SELECT
TO fin_reader
USING (true);

-- ============================================================================
-- ACCOUNTS TABLE POLICIES (if exists)
-- ============================================================================

DO $$
BEGIN
    IF EXISTS (
        SELECT FROM pg_tables
        WHERE schemaname = 'public'
        AND tablename = 'accounts'
    ) THEN
        -- Drop existing policy if it exists
        EXECUTE 'DROP POLICY IF EXISTS "fin_reader can view all accounts" ON public.accounts';

        -- Create policy for fin_reader to SELECT all accounts
        EXECUTE 'CREATE POLICY "fin_reader can view all accounts"
        ON public.accounts
        FOR SELECT
        TO fin_reader
        USING (true)';

        RAISE NOTICE 'Created RLS policy for accounts table';
    END IF;
END
$$;

-- ============================================================================
-- VERIFY POLICIES
-- ============================================================================

-- List all RLS policies for our tables
SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('expenses', 'revenues', 'aws_costs', 'audit_runs', 'audit_snapshots', 'accounts')
ORDER BY tablename, policyname;
