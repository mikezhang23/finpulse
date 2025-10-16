-- ============================================================================
-- Check AWS Costs Table Structure
-- ============================================================================
-- Run this to see what columns exist in your aws_costs table
-- ============================================================================

-- Show all columns in aws_costs table
SELECT
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns
WHERE table_schema = 'public'
    AND table_name = 'aws_costs'
ORDER BY ordinal_position;

-- Show a sample row from aws_costs
SELECT * FROM aws_costs LIMIT 1;
