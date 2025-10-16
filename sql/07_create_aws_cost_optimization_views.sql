-- ============================================================================
-- AWS Cost Optimization Views
-- ============================================================================
-- Three views for cost optimization:
-- 1. v_aws_cost_trends: 7-day and 30-day trend analysis
-- 2. v_aws_waste_detection: Identify idle and over-provisioned resources
-- 3. v_aws_savings_opportunities: Quantified savings with actionable recommendations
-- ============================================================================

-- ============================================================================
-- VIEW 1: AWS COST TRENDS
-- ============================================================================
-- Calculates rolling trends, growth rates, and forecasts

CREATE OR REPLACE VIEW v_aws_cost_trends AS
WITH daily_costs AS (
    SELECT
        txn_date::date as date,
        SUM(cost_usd) as daily_total
    FROM aws_costs
    GROUP BY txn_date::date
),
trend_analysis AS (
    SELECT
        date,
        daily_total,
        -- 7-day moving average
        AVG(daily_total) OVER (
            ORDER BY date
            ROWS BETWEEN 6 PRECEDING AND CURRENT ROW
        ) as avg_7day,
        -- 30-day moving average
        AVG(daily_total) OVER (
            ORDER BY date
            ROWS BETWEEN 29 PRECEDING AND CURRENT ROW
        ) as avg_30day,
        -- Previous day for day-over-day comparison
        LAG(daily_total, 1) OVER (ORDER BY date) as prev_day,
        -- 7 days ago for week-over-week comparison
        LAG(daily_total, 7) OVER (ORDER BY date) as prev_week,
        -- 30 days ago for month-over-month comparison
        LAG(daily_total, 30) OVER (ORDER BY date) as prev_month
    FROM daily_costs
)
SELECT
    date,
    daily_total,
    avg_7day,
    avg_30day,
    -- Day-over-day change
    CASE
        WHEN prev_day IS NOT NULL AND prev_day > 0
        THEN ROUND(((daily_total - prev_day) / prev_day * 100)::numeric, 2)
        ELSE NULL
    END as dod_change_pct,
    -- Week-over-week change
    CASE
        WHEN prev_week IS NOT NULL AND prev_week > 0
        THEN ROUND(((daily_total - prev_week) / prev_week * 100)::numeric, 2)
        ELSE NULL
    END as wow_change_pct,
    -- Month-over-month change
    CASE
        WHEN prev_month IS NOT NULL AND prev_month > 0
        THEN ROUND(((daily_total - prev_month) / prev_month * 100)::numeric, 2)
        ELSE NULL
    END as mom_change_pct,
    -- Trend indicator (increasing/stable/decreasing)
    CASE
        WHEN avg_7day > avg_30day * 1.1 THEN 'increasing'
        WHEN avg_7day < avg_30day * 0.9 THEN 'decreasing'
        ELSE 'stable'
    END as trend_direction
FROM trend_analysis
ORDER BY date DESC;

-- ============================================================================
-- VIEW 2: AWS WASTE DETECTION
-- ============================================================================
-- Identifies potential waste by department: idle resources, over-provisioning, anomalies

CREATE OR REPLACE VIEW v_aws_waste_detection AS
WITH dept_stats AS (
    SELECT
        dept,
        COUNT(*) as transaction_count,
        SUM(cost_usd) as total_cost,
        AVG(cost_usd) as avg_cost,
        STDDEV(cost_usd) as stddev_cost,
        MIN(txn_date) as first_seen,
        MAX(txn_date) as last_seen,
        MAX(txn_date::date) - MIN(txn_date::date) as days_active
    FROM aws_costs
    GROUP BY dept
),
waste_flags AS (
    SELECT
        dept,
        total_cost,
        avg_cost,
        stddev_cost,
        transaction_count,
        first_seen,
        last_seen,
        days_active,
        -- Flag 1: Low utilization (very low average cost)
        CASE
            WHEN avg_cost < 1.0 AND total_cost < 50 THEN true
            ELSE false
        END as is_low_utilization,
        -- Flag 2: Consistently high cost (potential over-provisioning)
        CASE
            WHEN avg_cost > 50 AND stddev_cost < avg_cost * 0.2 THEN true
            ELSE false
        END as is_over_provisioned,
        -- Flag 3: Stale department (no recent activity)
        CASE
            WHEN last_seen < CURRENT_DATE - INTERVAL '7 days' THEN true
            ELSE false
        END as is_stale,
        -- Flag 4: High variance (unpredictable/inefficient usage)
        CASE
            WHEN stddev_cost > avg_cost * 1.5 AND avg_cost > 5 THEN true
            ELSE false
        END as is_high_variance
    FROM dept_stats
)
SELECT
    dept,
    ROUND(total_cost::numeric, 2) as total_cost,
    ROUND(avg_cost::numeric, 2) as avg_cost,
    transaction_count,
    first_seen,
    last_seen,
    days_active,
    is_low_utilization,
    is_over_provisioned,
    is_stale,
    is_high_variance,
    -- Waste score (0-4 based on number of flags)
    (is_low_utilization::int + is_over_provisioned::int +
     is_stale::int + is_high_variance::int) as waste_score,
    -- Primary waste category
    CASE
        WHEN is_stale THEN 'Stale Activity'
        WHEN is_over_provisioned THEN 'Over-Provisioned'
        WHEN is_low_utilization THEN 'Low Utilization'
        WHEN is_high_variance THEN 'High Variance'
        ELSE 'Efficient'
    END as waste_category
FROM waste_flags
WHERE (is_low_utilization OR is_over_provisioned OR is_stale OR is_high_variance)
ORDER BY waste_score DESC, total_cost DESC;

-- ============================================================================
-- VIEW 3: AWS SAVINGS OPPORTUNITIES
-- ============================================================================
-- Quantifies savings by department with concrete recommendations

CREATE OR REPLACE VIEW v_aws_savings_opportunities AS
WITH dept_analysis AS (
    SELECT
        dept,
        COUNT(*) as transaction_count,
        SUM(cost_usd) as total_cost,
        AVG(cost_usd) as avg_cost,
        STDDEV(cost_usd) as stddev_cost,
        MAX(txn_date) as last_activity
    FROM aws_costs
    GROUP BY dept
),
opportunities AS (
    SELECT
        dept,
        transaction_count as resource_count,
        total_cost,
        avg_cost,
        stddev_cost,
        last_activity,
        -- Opportunity 1: Terminate stale resources (100% savings)
        CASE
            WHEN last_activity < CURRENT_DATE - INTERVAL '7 days' THEN
                ROUND(total_cost::numeric, 2)
            ELSE 0
        END as stale_resource_savings,
        -- Opportunity 2: Rightsize over-provisioned resources (30% savings estimate)
        CASE
            WHEN avg_cost > 50 AND stddev_cost < avg_cost * 0.3 THEN
                ROUND((total_cost * 0.30)::numeric, 2)
            ELSE 0
        END as rightsizing_savings,
        -- Opportunity 3: Reserved instance savings (20% savings estimate for consistent high usage)
        CASE
            WHEN total_cost > 500 AND avg_cost > 25 THEN
                ROUND((total_cost * 0.20)::numeric, 2)
            ELSE 0
        END as reserved_instance_savings,
        -- Opportunity 4: Optimize high variance costs (25% savings)
        CASE
            WHEN stddev_cost > avg_cost * 1.0 AND total_cost > 100 THEN
                ROUND((total_cost * 0.25)::numeric, 2)
            ELSE 0
        END as consolidation_savings
    FROM dept_analysis
)
SELECT
    dept,
    resource_count,
    ROUND(total_cost::numeric, 2) as current_monthly_cost,
    stale_resource_savings,
    rightsizing_savings,
    reserved_instance_savings,
    consolidation_savings,
    -- Total potential savings
    (stale_resource_savings + rightsizing_savings +
     reserved_instance_savings + consolidation_savings) as total_savings,
    -- Savings percentage
    CASE
        WHEN total_cost > 0 THEN
            ROUND(((stale_resource_savings + rightsizing_savings +
                    reserved_instance_savings + consolidation_savings) /
                   total_cost * 100)::numeric, 1)
        ELSE 0
    END as savings_pct,
    -- Primary recommendation
    CASE
        WHEN stale_resource_savings > 0 THEN
            'Investigate stale department (inactive > 7 days)'
        WHEN reserved_instance_savings > 0 THEN
            'Purchase reserved instances for consistent workloads'
        WHEN rightsizing_savings > 0 THEN
            'Review and rightsize consistent high-cost resources'
        WHEN consolidation_savings > 0 THEN
            'Optimize variable cost patterns'
        ELSE 'Already optimized'
    END as primary_action,
    last_activity
FROM opportunities
WHERE (stale_resource_savings + rightsizing_savings +
       reserved_instance_savings + consolidation_savings) > 0
ORDER BY total_savings DESC;

-- ============================================================================
-- GRANT PERMISSIONS
-- ============================================================================

DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_roles WHERE rolname = 'fin_reader') THEN
        GRANT SELECT ON v_aws_cost_trends TO fin_reader;
        GRANT SELECT ON v_aws_waste_detection TO fin_reader;
        GRANT SELECT ON v_aws_savings_opportunities TO fin_reader;
        RAISE NOTICE '✓ Granted SELECT permissions to fin_reader';
    ELSE
        RAISE NOTICE '⚠ fin_reader role does not exist, skipping permission grant';
    END IF;
END $$;

-- ============================================================================
-- VERIFICATION QUERIES
-- ============================================================================

-- Test cost trends (last 7 days)
SELECT
    date,
    ROUND(daily_total::numeric, 2) as daily_cost,
    ROUND(avg_7day::numeric, 2) as avg_7day,
    trend_direction
FROM v_aws_cost_trends
ORDER BY date DESC
LIMIT 7;

-- Test waste detection (top 5 waste items)
SELECT
    dept,
    waste_category,
    waste_score,
    total_cost
FROM v_aws_waste_detection
ORDER BY waste_score DESC, total_cost DESC
LIMIT 5;

-- Test savings opportunities (top 5)
SELECT
    dept,
    current_monthly_cost,
    total_savings,
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
    RAISE NOTICE '✓✓✓ AWS Cost Optimization Views Created Successfully ✓✓✓';
    RAISE NOTICE '';
    RAISE NOTICE 'Created Views:';
    RAISE NOTICE '  1. v_aws_cost_trends - Trend analysis (7d/30d)';
    RAISE NOTICE '  2. v_aws_waste_detection - Waste identification';
    RAISE NOTICE '  3. v_aws_savings_opportunities - Savings quantification';
    RAISE NOTICE '';
    RAISE NOTICE 'Next: Create server action in lib/actions/cost-optimization.ts';
END $$;
