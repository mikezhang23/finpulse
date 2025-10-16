-- ============================================================================
-- END-TO-END TEST: Fresh Dummy Data
-- ============================================================================
-- This script creates a complete set of realistic test data to verify all
-- features of the FinPulse application before deployment.
-- ============================================================================

-- ============================================================================
-- STEP 1: CLEAR EXISTING DATA (Optional - comment out if you want to keep data)
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '🧹 Clearing existing data...';
END $$;

-- Clear in correct order to respect foreign keys
TRUNCATE TABLE audit_runs CASCADE;
TRUNCATE TABLE audit_snapshots CASCADE;
TRUNCATE TABLE expenses CASCADE;
TRUNCATE TABLE revenues CASCADE;
TRUNCATE TABLE aws_costs CASCADE;

-- ============================================================================
-- STEP 2: INSERT EXPENSES DATA (60 days of history)
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '💰 Inserting expense data...';
END $$;

INSERT INTO expenses (txn_date, dept, vendor, amount) VALUES
-- Engineering expenses (last 60 days)
(CURRENT_DATE - INTERVAL '1 day', 'Engineering', 'AWS', 1250.00),
(CURRENT_DATE - INTERVAL '2 days', 'Engineering', 'GitHub', 450.00),
(CURRENT_DATE - INTERVAL '3 days', 'Engineering', 'JetBrains', 299.00),
(CURRENT_DATE - INTERVAL '5 days', 'Engineering', 'DataDog', 890.00),
(CURRENT_DATE - INTERVAL '7 days', 'Engineering', 'AWS', 1340.00),
(CURRENT_DATE - INTERVAL '10 days', 'Engineering', 'Vercel', 200.00),
(CURRENT_DATE - INTERVAL '14 days', 'Engineering', 'AWS', 1180.00),
(CURRENT_DATE - INTERVAL '20 days', 'Engineering', 'Sentry', 149.00),
(CURRENT_DATE - INTERVAL '25 days', 'Engineering', 'AWS', 1420.00),
(CURRENT_DATE - INTERVAL '30 days', 'Engineering', 'Stripe', 500.00),

-- Sales expenses
(CURRENT_DATE - INTERVAL '1 day', 'Sales', 'Salesforce', 2500.00),
(CURRENT_DATE - INTERVAL '3 days', 'Sales', 'HubSpot', 800.00),
(CURRENT_DATE - INTERVAL '5 days', 'Sales', 'ZoomInfo', 1200.00),
(CURRENT_DATE - INTERVAL '8 days', 'Sales', 'LinkedIn', 650.00),
(CURRENT_DATE - INTERVAL '15 days', 'Sales', 'Salesforce', 2500.00),
(CURRENT_DATE - INTERVAL '22 days', 'Sales', 'Gong', 1800.00),
(CURRENT_DATE - INTERVAL '30 days', 'Sales', 'Salesforce', 2500.00),

-- Marketing expenses
(CURRENT_DATE - INTERVAL '2 days', 'Marketing', 'Google Ads', 5000.00),
(CURRENT_DATE - INTERVAL '4 days', 'Marketing', 'Facebook', 3200.00),
(CURRENT_DATE - INTERVAL '6 days', 'Marketing', 'Mailchimp', 299.00),
(CURRENT_DATE - INTERVAL '9 days', 'Marketing', 'Google Ads', 4800.00),
(CURRENT_DATE - INTERVAL '12 days', 'Marketing', 'Twitter', 1500.00),
(CURRENT_DATE - INTERVAL '16 days', 'Marketing', 'Google Ads', 5200.00),
(CURRENT_DATE - INTERVAL '23 days', 'Marketing', 'Facebook', 3000.00),
(CURRENT_DATE - INTERVAL '28 days', 'Marketing', 'Google Ads', 4900.00),

-- HR expenses
(CURRENT_DATE - INTERVAL '1 day', 'HR', 'BambooHR', 399.00),
(CURRENT_DATE - INTERVAL '5 days', 'HR', 'Greenhouse', 850.00),
(CURRENT_DATE - INTERVAL '10 days', 'HR', 'Gusto', 1200.00),
(CURRENT_DATE - INTERVAL '15 days', 'HR', 'BambooHR', 399.00),
(CURRENT_DATE - INTERVAL '25 days', 'HR', 'LinkedIn', 500.00),
(CURRENT_DATE - INTERVAL '30 days', 'HR', 'BambooHR', 399.00),

-- Operations expenses
(CURRENT_DATE - INTERVAL '2 days', 'Operations', 'Office Depot', 450.00),
(CURRENT_DATE - INTERVAL '7 days', 'Operations', 'WeWork', 8000.00),
(CURRENT_DATE - INTERVAL '12 days', 'Operations', 'Verizon', 1200.00),
(CURRENT_DATE - INTERVAL '18 days', 'Operations', 'Office Depot', 380.00),
(CURRENT_DATE - INTERVAL '28 days', 'Operations', 'Cleaners Inc', 600.00);

-- ============================================================================
-- STEP 3: INSERT REVENUES DATA (60 days of history)
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '📈 Inserting revenue data...';
END $$;

INSERT INTO revenues (txn_date, customer_id, recognized_amount) VALUES
-- Enterprise customers (monthly recurring)
(CURRENT_DATE - INTERVAL '1 day', 'CUST001', 50000),
(CURRENT_DATE - INTERVAL '1 day', 'CUST002', 75000),
(CURRENT_DATE - INTERVAL '2 days', 'CUST003', 15000),
(CURRENT_DATE - INTERVAL '3 days', 'CUST004', 120000),
(CURRENT_DATE - INTERVAL '5 days', 'CUST005', 30000),

-- Previous month's revenue
(CURRENT_DATE - INTERVAL '30 days', 'CUST001', 50000),
(CURRENT_DATE - INTERVAL '30 days', 'CUST002', 75000),
(CURRENT_DATE - INTERVAL '31 days', 'CUST003', 15000),
(CURRENT_DATE - INTERVAL '32 days', 'CUST004', 120000),
(CURRENT_DATE - INTERVAL '33 days', 'CUST005', 30000),

-- Quarterly deals
(CURRENT_DATE - INTERVAL '10 days', 'CUST006', 100000),
(CURRENT_DATE - INTERVAL '45 days', 'CUST007', 80000),

-- Annual contracts
(CURRENT_DATE - INTERVAL '15 days', 'CUST008', 100000),
(CURRENT_DATE - INTERVAL '50 days', 'CUST009', 80000);

-- ============================================================================
-- STEP 4: INSERT AWS COSTS DATA (60 days with varying patterns)
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '☁️  Inserting AWS cost data...';
END $$;

-- Generate 60 days of AWS costs with realistic patterns
INSERT INTO aws_costs (txn_date, dept, service, cost_usd)
SELECT
    CURRENT_DATE - (i || ' days')::INTERVAL as txn_date,
    dept,
    service,
    -- Base cost + random variation + weekly pattern
    base_cost * (1 + (RANDOM() * 0.3 - 0.15)) *
    -- Weekend discount (lower usage on weekends)
    CASE
        WHEN EXTRACT(DOW FROM CURRENT_DATE - (i || ' days')::INTERVAL) IN (0, 6)
        THEN 0.7
        ELSE 1.0
    END as cost_usd
FROM
    generate_series(0, 59) as i,
    (VALUES
        ('Engineering', 'EC2', 150.00),
        ('Engineering', 'RDS', 180.00),
        ('Engineering', 'S3', 160.00),
        ('Sales', 'Lambda', 45.00),
        ('Sales', 'SES', 50.00),
        ('Marketing', 'CloudFront', 75.00),
        ('Marketing', 'S3', 80.00),
        ('HR', 'Lambda', 20.00),
        ('Operations', 'EC2', 35.00),
        ('Operations', 'CloudWatch', 40.00)
    ) as dept_costs(dept, service, base_cost);

-- Add some anomalies for testing anomaly detection
INSERT INTO aws_costs (txn_date, dept, service, cost_usd) VALUES
-- Spike in Engineering costs (3x normal)
(CURRENT_DATE - INTERVAL '3 days', 'Engineering', 'EC2', 450.00),
(CURRENT_DATE - INTERVAL '3 days', 'Engineering', 'RDS', 480.00),

-- Unusual spike in HR
(CURRENT_DATE - INTERVAL '10 days', 'HR', 'Lambda', 95.00),

-- Spike in Marketing
(CURRENT_DATE - INTERVAL '20 days', 'Marketing', 'CloudFront', 240.00);

-- Add a stale department (no activity in 10 days) for waste detection
INSERT INTO aws_costs (txn_date, dept, service, cost_usd) VALUES
(CURRENT_DATE - INTERVAL '15 days', 'Legacy-Dept', 'EC2', 125.00),
(CURRENT_DATE - INTERVAL '20 days', 'Legacy-Dept', 'S3', 130.00),
(CURRENT_DATE - INTERVAL '25 days', 'Legacy-Dept', 'RDS', 120.00);

-- ============================================================================
-- STEP 5: VERIFY DATA COUNTS
-- ============================================================================

DO $$
DECLARE
    expense_count INT;
    revenue_count INT;
    aws_count INT;
BEGIN
    SELECT COUNT(*) INTO expense_count FROM expenses;
    SELECT COUNT(*) INTO revenue_count FROM revenues;
    SELECT COUNT(*) INTO aws_count FROM aws_costs;

    RAISE NOTICE '';
    RAISE NOTICE '📊 Data Summary:';
    RAISE NOTICE '  - Expenses: % records', expense_count;
    RAISE NOTICE '  - Revenues: % records', revenue_count;
    RAISE NOTICE '  - AWS Costs: % records', aws_count;
    RAISE NOTICE '';
END $$;

-- ============================================================================
-- STEP 6: TEST ALL VIEWS
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '🔍 Testing all views...';
END $$;

-- Test validation view (optional - comment out if view doesn't exist)
-- SELECT
--     COUNT(*) as validation_records,
--     SUM(CASE WHEN has_issues THEN 1 ELSE 0 END) as records_with_issues
-- FROM v_validation_summary;

-- Test AWS timeseries view
SELECT
    COUNT(*) as timeseries_days,
    ROUND(AVG(total_cost)::numeric, 2) as avg_daily_cost
FROM v_aws_costs_timeseries;

-- Test cost trends view
SELECT
    COUNT(*) as trend_records,
    MAX(trend_direction) as latest_trend
FROM v_aws_cost_trends;

-- Test waste detection view
SELECT
    COUNT(*) as waste_items,
    MAX(waste_score) as max_waste_score
FROM v_aws_waste_detection;

-- Test savings opportunities view
SELECT
    COUNT(*) as savings_opportunities,
    ROUND(SUM(total_savings)::numeric, 2) as total_potential_savings
FROM v_aws_savings_opportunities;

-- ============================================================================
-- STEP 7: SIMULATE AN AUDIT RUN
-- ============================================================================

DO $$
DECLARE
    audit_id UUID;
    anomaly_count INT;
BEGIN
    RAISE NOTICE '🔐 Simulating audit run...';

    -- Insert audit run
    INSERT INTO audit_runs (
        total_checks,
        passed,
        failed,
        warnings,
        overall_status
    ) VALUES (
        (SELECT COUNT(*) FROM expenses) + (SELECT COUNT(*) FROM revenues) + (SELECT COUNT(*) FROM aws_costs),
        (SELECT COUNT(*) FROM expenses) + (SELECT COUNT(*) FROM revenues) + (SELECT COUNT(*) FROM aws_costs),
        0,
        0,
        'PASS'
    ) RETURNING id INTO audit_id;

    -- Check for anomalies
    SELECT COUNT(*) INTO anomaly_count
    FROM v_aws_costs_timeseries
    WHERE total_cost > (
        SELECT AVG(total_cost) + 2 * STDDEV(total_cost)
        FROM v_aws_costs_timeseries
    );

    RAISE NOTICE '  - Audit ID: %', audit_id;
    RAISE NOTICE '  - Potential anomalies detected: %', anomaly_count;
END $$;

-- ============================================================================
-- STEP 8: DISPLAY SAMPLE RESULTS
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✅ Sample Results:';
    RAISE NOTICE '';
END $$;

-- Show recent expenses
SELECT
    '📉 Recent Expenses (last 5):' as section,
    txn_date,
    dept,
    vendor,
    amount
FROM expenses
ORDER BY txn_date DESC
LIMIT 5;

-- Show recent revenues
SELECT
    '📈 Recent Revenues (last 5):' as section,
    txn_date,
    customer_id,
    recognized_amount
FROM revenues
ORDER BY txn_date DESC
LIMIT 5;

-- Show cost trend summary
SELECT
    '📊 Cost Trend (last 7 days):' as section,
    date,
    ROUND(daily_total::numeric, 2) as daily_cost,
    ROUND(avg_7day::numeric, 2) as avg_7day,
    trend_direction
FROM v_aws_cost_trends
ORDER BY date DESC
LIMIT 7;

-- Show waste detection
SELECT
    '⚠️  Waste Detection:' as section,
    dept,
    waste_category,
    waste_score,
    ROUND(total_cost::numeric, 2) as total_cost
FROM v_aws_waste_detection
ORDER BY waste_score DESC, total_cost DESC
LIMIT 5;

-- Show savings opportunities
SELECT
    '💰 Savings Opportunities:' as section,
    dept,
    ROUND(total_savings::numeric, 2) as potential_savings,
    savings_pct,
    primary_action
FROM v_aws_savings_opportunities
ORDER BY total_savings DESC
LIMIT 5;

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================

DO $$
BEGIN
    RAISE NOTICE '';
    RAISE NOTICE '✓✓✓ TEST DATA CREATED SUCCESSFULLY ✓✓✓';
    RAISE NOTICE '';
    RAISE NOTICE '🎯 Next Steps:';
    RAISE NOTICE '  1. Refresh your dashboard at http://localhost:3000';
    RAISE NOTICE '  2. Verify all charts and panels are populated';
    RAISE NOTICE '  3. Check for anomalies in the Anomalies Panel';
    RAISE NOTICE '  4. Review cost optimization recommendations';
    RAISE NOTICE '  5. Test the audit page at http://localhost:3000/audit';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Features to Test:';
    RAISE NOTICE '  ✓ KPI cards (expenses, revenues, AWS costs, audit runs)';
    RAISE NOTICE '  ✓ Anomaly detection panel';
    RAISE NOTICE '  ✓ Cost optimization panel with trend chart';
    RAISE NOTICE '  ✓ Savings opportunities and waste flags';
    RAISE NOTICE '  ✓ Revenue by day chart';
    RAISE NOTICE '  ✓ Expense by day chart';
    RAISE NOTICE '  ✓ Expense by department chart';
    RAISE NOTICE '  ✓ AWS cost by department chart';
    RAISE NOTICE '  ✓ Recent transactions tables';
    RAISE NOTICE '';
END $$;
