-- ============================================================================
-- Step 5B: Audit Logging - Create Validation Checks View
-- ============================================================================
-- This view consolidates named, automated checks for data quality and compliance.
-- Single source of truth for validation status across all financial data.

-- ============================================================================
-- CREATE VALIDATION VIEW
-- ============================================================================

CREATE OR REPLACE VIEW v_validation_checks AS
WITH
-- Check 1: Expenses have valid amounts (> 0)
expense_amounts AS (
    SELECT
        'Expense Amounts Valid' as check_name,
        'DATA_QUALITY' as category,
        COUNT(*) FILTER (WHERE amount <= 0) as failures,
        COUNT(*) as total,
        CASE
            WHEN COUNT(*) FILTER (WHERE amount <= 0) = 0 THEN 'PASS'
            ELSE 'FAIL'
        END as status,
        'All expense amounts must be greater than 0' as description
    FROM expenses
),

-- Check 2: Revenues have valid recognized amounts
revenue_amounts AS (
    SELECT
        'Revenue Amounts Valid' as check_name,
        'DATA_QUALITY' as category,
        COUNT(*) FILTER (WHERE recognized_amount < 0 OR deferred_amount < 0) as failures,
        COUNT(*) as total,
        CASE
            WHEN COUNT(*) FILTER (WHERE recognized_amount < 0 OR deferred_amount < 0) = 0 THEN 'PASS'
            ELSE 'FAIL'
        END as status,
        'Revenue amounts must be non-negative' as description
    FROM revenues
),

-- Check 3: AWS costs have valid amounts
aws_cost_amounts AS (
    SELECT
        'AWS Cost Amounts Valid' as check_name,
        'DATA_QUALITY' as category,
        COUNT(*) FILTER (WHERE cost_amount <= 0) as failures,
        COUNT(*) as total,
        CASE
            WHEN COUNT(*) FILTER (WHERE cost_amount <= 0) = 0 THEN 'PASS'
            ELSE 'FAIL'
        END as status,
        'AWS costs must be greater than 0' as description
    FROM aws_costs
),

-- Check 4: No future-dated transactions (expenses)
future_expenses AS (
    SELECT
        'No Future Expenses' as check_name,
        'COMPLIANCE' as category,
        COUNT(*) FILTER (WHERE txn_date > CURRENT_DATE) as failures,
        COUNT(*) as total,
        CASE
            WHEN COUNT(*) FILTER (WHERE txn_date > CURRENT_DATE) = 0 THEN 'PASS'
            ELSE 'FAIL'
        END as status,
        'Expense dates must not be in the future' as description
    FROM expenses
),

-- Check 5: No future-dated transactions (revenues)
future_revenues AS (
    SELECT
        'No Future Revenues' as check_name,
        'COMPLIANCE' as category,
        COUNT(*) FILTER (WHERE txn_date > CURRENT_DATE) as failures,
        COUNT(*) as total,
        CASE
            WHEN COUNT(*) FILTER (WHERE txn_date > CURRENT_DATE) = 0 THEN 'PASS'
            ELSE 'FAIL'
        END as status,
        'Revenue dates must not be in the future' as description
    FROM revenues
),

-- Check 6: All expenses have vendor information
vendor_completeness AS (
    SELECT
        'Expense Vendor Complete' as check_name,
        'DATA_COMPLETENESS' as category,
        COUNT(*) FILTER (WHERE vendor IS NULL OR vendor = '') as failures,
        COUNT(*) as total,
        CASE
            WHEN COUNT(*) FILTER (WHERE vendor IS NULL OR vendor = '') = 0 THEN 'PASS'
            ELSE 'FAIL'
        END as status,
        'All expenses must have vendor information' as description
    FROM expenses
),

-- Check 7: All revenues have customer information
customer_completeness AS (
    SELECT
        'Revenue Customer Complete' as check_name,
        'DATA_COMPLETENESS' as category,
        COUNT(*) FILTER (WHERE customer_id IS NULL OR customer_id = '') as failures,
        COUNT(*) as total,
        CASE
            WHEN COUNT(*) FILTER (WHERE customer_id IS NULL OR customer_id = '') = 0 THEN 'PASS'
            ELSE 'FAIL'
        END as status,
        'All revenues must have customer information' as description
    FROM revenues
),

-- Check 8: Data freshness - expenses updated in last 30 days
expense_freshness AS (
    SELECT
        'Expense Data Freshness' as check_name,
        'DATA_QUALITY' as category,
        CASE
            WHEN MAX(inserted_at) < CURRENT_TIMESTAMP - INTERVAL '30 days' THEN 1
            ELSE 0
        END as failures,
        1 as total,
        CASE
            WHEN MAX(inserted_at) >= CURRENT_TIMESTAMP - INTERVAL '30 days' THEN 'PASS'
            WHEN MAX(inserted_at) IS NULL THEN 'WARN'
            ELSE 'FAIL'
        END as status,
        'Expense data should be updated within 30 days' as description
    FROM expenses
),

-- Check 9: Data freshness - revenues updated in last 30 days
revenue_freshness AS (
    SELECT
        'Revenue Data Freshness' as check_name,
        'DATA_QUALITY' as category,
        CASE
            WHEN MAX(inserted_at) < CURRENT_TIMESTAMP - INTERVAL '30 days' THEN 1
            ELSE 0
        END as failures,
        1 as total,
        CASE
            WHEN MAX(inserted_at) >= CURRENT_TIMESTAMP - INTERVAL '30 days' THEN 'PASS'
            WHEN MAX(inserted_at) IS NULL THEN 'WARN'
            ELSE 'FAIL'
        END as status,
        'Revenue data should be updated within 30 days' as description
    FROM revenues
),

-- Check 10: Total data volume check
data_volume AS (
    SELECT
        'Minimum Data Volume' as check_name,
        'DATA_QUALITY' as category,
        CASE
            WHEN (SELECT COUNT(*) FROM expenses) < 10
                OR (SELECT COUNT(*) FROM revenues) < 10 THEN 1
            ELSE 0
        END as failures,
        1 as total,
        CASE
            WHEN (SELECT COUNT(*) FROM expenses) >= 10
                AND (SELECT COUNT(*) FROM revenues) >= 10 THEN 'PASS'
            ELSE 'WARN'
        END as status,
        'Should have at least 10 records in each table' as description
)

-- Combine all checks
SELECT * FROM expense_amounts
UNION ALL SELECT * FROM revenue_amounts
UNION ALL SELECT * FROM aws_cost_amounts
UNION ALL SELECT * FROM future_expenses
UNION ALL SELECT * FROM future_revenues
UNION ALL SELECT * FROM vendor_completeness
UNION ALL SELECT * FROM customer_completeness
UNION ALL SELECT * FROM expense_freshness
UNION ALL SELECT * FROM revenue_freshness
UNION ALL SELECT * FROM data_volume;

-- Grant SELECT to fin_reader role
GRANT SELECT ON v_validation_checks TO fin_reader;

-- ============================================================================
-- VERIFY VIEW
-- ============================================================================

-- Test the validation view
SELECT
    check_name,
    category,
    status,
    failures,
    total,
    description
FROM v_validation_checks
ORDER BY
    CASE status
        WHEN 'FAIL' THEN 1
        WHEN 'WARN' THEN 2
        WHEN 'PASS' THEN 3
    END,
    category,
    check_name;
