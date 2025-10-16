-- ============================================================================
-- Debug Script: Check Current State of Audit Tables
-- ============================================================================
-- Run this to see what currently exists in your database
-- ============================================================================

-- Check if audit_runs table exists and its structure
SELECT
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'audit_runs'
ORDER BY ordinal_position;

-- Check if audit_snapshots table exists and its structure
SELECT
    table_name,
    column_name,
    data_type,
    is_nullable
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'audit_snapshots'
ORDER BY ordinal_position;

-- Check all tables in public schema
SELECT
    schemaname,
    tablename,
    tableowner
FROM pg_tables
WHERE schemaname = 'public'
ORDER BY tablename;
