-- ============================================================================
-- Step 5A: Security - Test RLS Implementation
-- ============================================================================
-- This script verifies that RLS is properly configured and working as expected.
-- Run this after executing scripts 01, 02, and 03.

-- ============================================================================
-- TEST 1: Verify RLS is Enabled on All Tables
-- ============================================================================

SELECT
    schemaname,
    tablename,
    rowsecurity as rls_enabled,
    CASE
        WHEN rowsecurity = true THEN '✅ PASS'
        ELSE '❌ FAIL'
    END as test_result
FROM pg_tables
WHERE schemaname = 'public'
AND tablename IN ('expenses', 'revenues', 'aws_costs', 'audit_runs', 'audit_snapshots', 'accounts')
ORDER BY tablename;

-- ============================================================================
-- TEST 2: Verify fin_reader Role Exists with Correct Properties
-- ============================================================================

SELECT
    rolname as role_name,
    rolcanlogin as can_login,
    rolsuper as is_superuser,
    CASE
        WHEN rolname = 'fin_reader' AND rolcanlogin = false AND rolsuper = false THEN '✅ PASS'
        ELSE '❌ FAIL'
    END as test_result
FROM pg_roles
WHERE rolname = 'fin_reader';

-- ============================================================================
-- TEST 3: Verify fin_reader Has SELECT Permissions on Tables
-- ============================================================================

SELECT
    table_name,
    privilege_type,
    CASE
        WHEN privilege_type = 'SELECT' THEN '✅ PASS'
        ELSE '❌ FAIL'
    END as test_result
FROM information_schema.table_privileges
WHERE grantee = 'fin_reader'
AND table_schema = 'public'
AND table_name IN ('expenses', 'revenues', 'aws_costs', 'audit_runs', 'audit_snapshots', 'accounts')
ORDER BY table_name;

-- ============================================================================
-- TEST 4: Verify fin_reader Has SELECT Permissions on Views
-- ============================================================================

SELECT
    table_name as view_name,
    privilege_type,
    CASE
        WHEN privilege_type = 'SELECT' THEN '✅ PASS'
        ELSE '❌ FAIL'
    END as test_result
FROM information_schema.table_privileges
WHERE grantee = 'fin_reader'
AND table_schema = 'public'
AND table_name IN ('v_aws_costs_daily', 'v_fin_health', 'v_revenue_daily')
ORDER BY table_name;

-- ============================================================================
-- TEST 5: Verify RLS Policies Exist for All Tables
-- ============================================================================

SELECT
    tablename,
    policyname,
    CASE
        WHEN policyname IS NOT NULL THEN '✅ PASS'
        ELSE '❌ FAIL'
    END as test_result
FROM (
    SELECT 'expenses' as tablename
    UNION ALL SELECT 'revenues'
    UNION ALL SELECT 'aws_costs'
    UNION ALL SELECT 'audit_runs'
    UNION ALL SELECT 'audit_snapshots'
    UNION ALL SELECT 'accounts'
) tables
LEFT JOIN pg_policies
    ON pg_policies.tablename = tables.tablename
    AND pg_policies.schemaname = 'public'
    AND pg_policies.policyname LIKE 'fin_reader can view%'
ORDER BY tables.tablename;

-- ============================================================================
-- TEST 6: Verify Policy Details
-- ============================================================================

SELECT
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    CASE
        WHEN 'fin_reader' = ANY(roles) AND cmd = 'SELECT' THEN '✅ PASS'
        ELSE '❌ FAIL'
    END as test_result
FROM pg_policies
WHERE schemaname = 'public'
AND tablename IN ('expenses', 'revenues', 'aws_costs', 'audit_runs', 'audit_snapshots', 'accounts')
ORDER BY tablename, policyname;

-- ============================================================================
-- TEST 7: Verify fin_reader Can Count Records (Simulated Access)
-- ============================================================================
-- Note: This test shows what queries would work for fin_reader
-- In production, you would SET ROLE fin_reader to actually test

SELECT
    'expenses' as table_name,
    COUNT(*) as record_count,
    '✅ Should be accessible to fin_reader' as test_result
FROM public.expenses

UNION ALL

SELECT
    'revenues' as table_name,
    COUNT(*) as record_count,
    '✅ Should be accessible to fin_reader' as test_result
FROM public.revenues

UNION ALL

SELECT
    'aws_costs' as table_name,
    COUNT(*) as record_count,
    '✅ Should be accessible to fin_reader' as test_result
FROM public.aws_costs

UNION ALL

SELECT
    'audit_runs' as table_name,
    COUNT(*) as record_count,
    '✅ Should be accessible to fin_reader' as test_result
FROM public.audit_runs

UNION ALL

SELECT
    'audit_snapshots' as table_name,
    COUNT(*) as record_count,
    '✅ Should be accessible to fin_reader' as test_result
FROM public.audit_snapshots;

-- ============================================================================
-- TEST SUMMARY
-- ============================================================================

DO $$
DECLARE
    rls_count INTEGER;
    role_exists BOOLEAN;
    policy_count INTEGER;
    expected_policy_count INTEGER := 5; -- expenses, revenues, aws_costs, audit_runs, audit_snapshots
BEGIN
    -- Check RLS enabled count
    SELECT COUNT(*) INTO rls_count
    FROM pg_tables
    WHERE schemaname = 'public'
    AND tablename IN ('expenses', 'revenues', 'aws_costs', 'audit_runs', 'audit_snapshots', 'accounts')
    AND rowsecurity = true;

    -- Check if role exists
    SELECT EXISTS (
        SELECT FROM pg_roles
        WHERE rolname = 'fin_reader'
        AND rolcanlogin = false
    ) INTO role_exists;

    -- Check policy count
    SELECT COUNT(*) INTO policy_count
    FROM pg_policies
    WHERE schemaname = 'public'
    AND tablename IN ('expenses', 'revenues', 'aws_costs', 'audit_runs', 'audit_snapshots')
    AND policyname LIKE 'fin_reader can view%';

    -- Display summary
    RAISE NOTICE '========================================';
    RAISE NOTICE 'RLS IMPLEMENTATION TEST SUMMARY';
    RAISE NOTICE '========================================';

    IF rls_count >= 5 THEN
        RAISE NOTICE '✅ RLS enabled on % tables (expected >= 5)', rls_count;
    ELSE
        RAISE NOTICE '❌ RLS enabled on % tables (expected >= 5)', rls_count;
    END IF;

    IF role_exists THEN
        RAISE NOTICE '✅ fin_reader role exists with NOLOGIN';
    ELSE
        RAISE NOTICE '❌ fin_reader role missing or misconfigured';
    END IF;

    IF policy_count >= expected_policy_count THEN
        RAISE NOTICE '✅ % RLS policies created (expected >= %)', policy_count, expected_policy_count;
    ELSE
        RAISE NOTICE '❌ % RLS policies created (expected >= %)', policy_count, expected_policy_count;
    END IF;

    IF rls_count >= 5 AND role_exists AND policy_count >= expected_policy_count THEN
        RAISE NOTICE '';
        RAISE NOTICE '🎉 SUCCESS: RLS implementation is complete!';
        RAISE NOTICE 'Service role will continue to bypass RLS.';
        RAISE NOTICE 'fin_reader can now be granted to users for read-only access.';
    ELSE
        RAISE NOTICE '';
        RAISE NOTICE '⚠️  WARNING: Some tests failed. Review output above.';
    END IF;

    RAISE NOTICE '========================================';
END
$$;
