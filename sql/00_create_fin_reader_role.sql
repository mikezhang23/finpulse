-- ============================================================================
-- Step 0: Create fin_reader Role (Simple Version)
-- ============================================================================
-- This script ONLY creates the fin_reader role without granting any permissions.
-- This allows other scripts to run without errors.
-- ============================================================================

-- Create the read-only role if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT FROM pg_roles WHERE rolname = 'fin_reader') THEN
        CREATE ROLE fin_reader NOLOGIN;
        RAISE NOTICE '✓ Role fin_reader created successfully';
    ELSE
        RAISE NOTICE '✓ Role fin_reader already exists';
    END IF;
END
$$;

-- Grant USAGE on the public schema
GRANT USAGE ON SCHEMA public TO fin_reader;

-- Verify the role was created
SELECT
    rolname as role_name,
    rolcanlogin as can_login,
    rolsuper as is_superuser,
    rolcreatedb as can_create_db,
    rolcreaterole as can_create_role
FROM pg_roles
WHERE rolname = 'fin_reader';

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✓✓✓ fin_reader role created successfully ✓✓✓';
    RAISE NOTICE '';
    RAISE NOTICE 'Next step: Run 05a_create_audit_tables.sql to create audit tables';
END $$;
