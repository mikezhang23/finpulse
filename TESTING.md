# FinPulse End-to-End Testing Guide

## Overview
This guide walks you through testing the entire FinPulse application with fresh dummy data before deployment.

## Prerequisites
1. Supabase database configured with environment variables in `.env.local`
2. All SQL migration scripts run (01-07)
3. Development server running (`npm run dev`)

## Test Data Setup

### Step 1: Run the Test Data Script
Execute the comprehensive test data script in your Supabase SQL editor:

```sql
-- File: sql/99_test_with_dummy_data.sql
```

This script will:
- Clear existing data (optional - can be commented out)
- Insert 35+ expense records across 5 departments (60-day history)
- Insert 14 revenue records with various billing cycles
- Insert 600+ AWS cost records with realistic patterns
- Add intentional anomalies for testing anomaly detection
- Add a stale department for waste detection testing
- Simulate an audit run
- Display verification results

### Step 2: What the Test Data Includes

#### Expenses (35 records)
- **Engineering**: AWS, GitHub, DataDog, Sentry, etc. (varying costs: $149-$1,420)
- **Sales**: Salesforce, HubSpot, ZoomInfo, LinkedIn ($650-$2,500)
- **Marketing**: Google Ads, Facebook, Mailchimp ($299-$5,200)
- **HR**: BambooHR, Greenhouse, Gusto ($399-$1,200)
- **Operations**: Office rent, supplies, utilities ($380-$8,000)

#### Revenues (14 records)
- **Monthly recurring**: 5 customers ($15k-$120k/month)
- **Quarterly contracts**: 2 customers ($240k-$300k total)
- **Annual contracts**: 2 customers ($960k-$1.2M total)
- Total monthly revenue: ~$290k

#### AWS Costs (600+ records)
- **60 days of history** for each department
- **Realistic patterns**: Weekend discounts, daily variations
- **Intentional anomalies**:
  - Engineering spike (3x normal) on day -3
  - HR spike on day -10
  - Marketing spike on day -20
- **Stale department**: "Legacy-Dept" with no activity in 10+ days

## Features to Test

### 1. Main Dashboard (http://localhost:3000)

#### KPI Cards
- [ ] Total Expenses displays correctly
- [ ] Total Revenues displays correctly
- [ ] Total AWS Costs displays correctly
- [ ] Total Audit Runs displays correctly
- [ ] Last Refreshed timestamp is current

#### Anomalies Panel
- [ ] Panel appears on the dashboard
- [ ] Shows 3-4 detected anomalies
- [ ] Engineering anomaly (day -3) flagged
- [ ] HR anomaly (day -10) flagged
- [ ] Marketing anomaly (day -20) flagged
- [ ] Anomaly details (date, expected cost, actual cost) display correctly
- [ ] Severity levels shown with color coding

#### AWS Cost Optimization Panel
- [ ] Panel appears below anomalies section
- [ ] **Trend Chart** displays:
  - Purple line for daily costs
  - Orange line for 7-day moving average
  - Legend showing both lines
  - Last 30 days of data
  - Stats: Latest daily, 7-day avg, trend direction, WoW %
- [ ] **Summary Stats** show:
  - Cost trend indicator (↗/↘/→ with color)
  - Waste items count
  - Highest risk department
  - Optimization score
- [ ] **Savings Opportunities** section:
  - Top 5 opportunities listed
  - Shows department, potential savings, % savings
  - Displays actionable recommendations
  - Dollar amounts formatted correctly
- [ ] **Waste Flags** section:
  - Shows departments with waste
  - "Legacy-Dept" appears with "Stale Activity" category
  - Waste score and category displayed with color coding
  - Transaction counts and costs shown

#### Financial Trends Charts
- [ ] **Revenue by Day Chart**:
  - Line chart with data points
  - Shows trend over time
  - Stats: Total, Average, Peak
- [ ] **Expense by Day Chart**:
  - Blue area chart
  - Daily variations visible
  - Stats accurate
- [ ] **Expense by Department Chart**:
  - Horizontal bars for top 10 departments
  - Operations shows highest (office rent spike)
  - Department colors consistent
- [ ] **AWS Cost by Department Chart**:
  - Purple bars for each department
  - Engineering shows highest costs
  - Total cost calculated correctly

#### Recent Transactions Tables
- [ ] **Expenses Table**:
  - Shows last 100 records
  - Sorted by date descending
  - All columns display (date, dept, vendor, amount, description)
  - Amounts formatted as currency
- [ ] **Revenues Table**:
  - Shows last 100 records
  - Customer names, contract values visible
  - Billing cycles displayed
  - Recognized amounts correct

### 2. Audit & Compliance Page (http://localhost:3000/audit)
- [ ] Page loads without errors
- [ ] Shows audit run history
- [ ] Latest test audit run appears
- [ ] Records checked count matches total records
- [ ] Status shows "completed"
- [ ] Validation summary displays

### 3. Refresh Functionality
- [ ] Click "Refresh Data" button
- [ ] Page reloads with updated timestamp
- [ ] All panels refresh
- [ ] No errors in console

## Expected Results

### Anomalies Detection
You should see **3-4 anomalies** detected:
1. Engineering spike (~$450-480) on day -3
2. HR spike (~$95) on day -10
3. Marketing spike (~$240) on day -20

### Waste Detection
You should see at least **1 waste flag**:
- "Legacy-Dept" marked as "Stale Activity" (no activity in 10+ days)

### Savings Opportunities
You should see opportunities for:
- Investigating stale departments (Legacy-Dept)
- Reserved instance savings for high-cost departments
- Rightsizing for consistent high-cost resources

### Cost Trends
- Overall AWS costs should show **realistic daily variation**
- 7-day moving average should **smooth out the spikes**
- Trend direction should be calculated based on 7-day vs 30-day averages

## Common Issues & Troubleshooting

### No Data Showing
- Verify SQL script ran successfully
- Check Supabase connection in `.env.local`
- Check browser console for errors
- Verify RLS policies allow read access

### Optimization Panel Not Showing
- Ensure `sql/07_create_aws_cost_optimization_views.sql` was run
- Check that views exist in Supabase
- Verify fin_reader role has SELECT permissions

### Anomalies Not Detected
- Check that `v_aws_costs_timeseries` view exists
- Verify threshold setting (default: 1.5 standard deviations)
- Ensure anomaly data was inserted correctly

### Charts Not Rendering
- Check browser console for JavaScript errors
- Verify data is being returned from server actions
- Check that chart components are receiving valid data

## Test Checklist Summary

Before deploying to production, ensure:
- [ ] All KPI cards display accurate numbers
- [ ] Anomaly detection identifies the 3 test anomalies
- [ ] Cost optimization panel shows trend chart
- [ ] Savings opportunities calculated correctly
- [ ] Waste flags identify "Legacy-Dept" as stale
- [ ] All 4 financial trend charts render
- [ ] Transaction tables populate and sort correctly
- [ ] Audit page shows test audit run
- [ ] Refresh button works without errors
- [ ] No console errors or warnings
- [ ] Responsive design works on different screen sizes
- [ ] Dark mode displays correctly (if applicable)

## Performance Benchmarks

With the test data, the application should:
- Load main dashboard in **< 3 seconds**
- Render all charts in **< 1 second**
- Process anomaly detection in **< 500ms**
- Calculate optimization insights in **< 1 second**
- Handle refresh without timeout

## Next Steps After Testing

Once all tests pass:
1. Review any console warnings or errors
2. Test on different browsers (Chrome, Firefox, Safari)
3. Test on mobile/tablet devices
4. Document any bugs or issues found
5. Prepare for production deployment
6. Set up monitoring and alerting
7. Create user documentation

## Notes
- Test data spans **60 days** to provide enough history for trend analysis
- **Anomalies are intentional** - they should be detected by the system
- **"Legacy-Dept" is intentionally stale** - it should appear in waste flags
- All amounts are in USD
- Dates are relative to CURRENT_DATE for consistency
