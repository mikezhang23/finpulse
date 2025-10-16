-- ============================================================================
-- Step 7A: Anomaly Detection - Create AWS Time-Series View
-- ============================================================================
-- This view aggregates AWS costs by date for time-series analysis and anomaly detection.
-- ============================================================================

-- ============================================================================
-- CREATE AWS DAILY COSTS VIEW
-- ============================================================================

CREATE OR REPLACE VIEW v_aws_costs_timeseries AS
SELECT
    txn_date::date as date,
    SUM(cost_usd) as total_cost,
    COUNT(*) as transaction_count,
    AVG(cost_usd) as avg_cost,
    MIN(cost_usd) as min_cost,
    MAX(cost_usd) as max_cost,
    -- Include department breakdown as JSON for context
    jsonb_object_agg(dept, dept_cost) as dept_breakdown
FROM (
    SELECT
        txn_date,
        dept,
        SUM(cost_usd) as dept_cost,
        cost_usd
    FROM aws_costs
    GROUP BY txn_date, dept, cost_usd
) as dept_data
GROUP BY txn_date::date
ORDER BY txn_date::date DESC;

-- Grant SELECT to fin_reader role
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'fin_reader') THEN
        GRANT SELECT ON v_aws_costs_timeseries TO fin_reader;
        RAISE NOTICE '✓ Granted SELECT on v_aws_costs_timeseries to fin_reader';
    ELSE
        RAISE NOTICE '⚠ fin_reader role does not exist, skipping permission grant';
    END IF;
END $$;

-- ============================================================================
-- VERIFY VIEW
-- ============================================================================

-- Show sample data from the view
SELECT
    date,
    total_cost,
    transaction_count,
    avg_cost
FROM v_aws_costs_timeseries
ORDER BY date DESC
LIMIT 10;

-- Show statistics
SELECT
    COUNT(*) as total_days,
    MIN(date) as earliest_date,
    MAX(date) as latest_date,
    AVG(total_cost) as avg_daily_cost,
    STDDEV(total_cost) as stddev_daily_cost
FROM v_aws_costs_timeseries;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✓✓✓ AWS time-series view created successfully ✓✓✓';
    RAISE NOTICE '';
    RAISE NOTICE 'View: v_aws_costs_timeseries';
    RAISE NOTICE 'Purpose: Daily AWS cost aggregation for anomaly detection';
    RAISE NOTICE '';
    RAISE NOTICE 'Next step: Implement z-score anomaly detection in application code';
END $$;
