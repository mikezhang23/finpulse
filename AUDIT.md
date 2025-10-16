# Audit & Compliance System

Automated validation checks and comprehensive audit trail for FinPulse financial data.

## Overview

The audit system provides:
1. **Named, Automated Validation Checks** - 10 pre-configured checks across all financial tables
2. **Audit Trail** - Every validation run is logged with full details
3. **Validation Summary Panel** - Real-time view of data quality and compliance
4. **Audit Log** - Historical record of all validation runs
5. **Snapshot Viewer** - Point-in-time compliance snapshots

## Architecture

### Database Layer

#### Validation View (`v_validation_checks`)
- Single SQL view consolidating all validation checks
- 10 automated checks across 3 categories:
  - **DATA_QUALITY**: Amount validation, data freshness, volume checks
  - **COMPLIANCE**: Future-date validation, regulatory requirements
  - **DATA_COMPLETENESS**: Required field validation

#### Audit Tables
- **`audit_runs`**: Records each validation execution
  - Tracks: total checks, passed, failed, warnings, overall status
  - Primary key: `id` (UUID)
  - Indexed by: `run_at` (timestamp)

- **`audit_snapshots`**: Point-in-time check results
  - Links to: `audit_run_id` (foreign key)
  - Stores: individual check results, failure counts, descriptions
  - Provides compliance audit trail

### Application Layer

#### Server Actions (`lib/actions/audit.ts`)
- `runValidationChecks()`: Execute validation and log audit trail
- `getAuditRuns()`: Fetch recent audit history
- `getAuditSnapshots()`: Retrieve specific run details
- `getCurrentValidation()`: Get validation status without logging

#### UI Components

**ValidationSummary** (`app/components/ValidationSummary.tsx`)
- Interactive validation panel with "Run Validation" button
- Real-time statistics (total, passed, failed, warnings)
- Expandable categories showing individual checks
- Color-coded status indicators (green/yellow/red)

**AuditLog** (`app/components/AuditLog.tsx`)
- List of recent validation runs
- Clickable rows to view snapshot details
- Statistics grid for each run
- Relative timestamps ("2h ago", "Just now")

**AuditSnapshot** (`app/components/AuditSnapshot.tsx`)
- Detailed view of selected audit run
- Grouped by category with expand/collapse
- Shows all check results with failure counts
- Timestamp and description for each check

#### Audit Page (`app/audit/page.tsx`)
- Dedicated `/audit` route for compliance view
- Combines all three components
- Automatic data loading on page load
- Two-column layout: Audit Log + Snapshot viewer

## Validation Checks

### 1. Expense Amounts Valid (DATA_QUALITY)
- **Rule**: All expense amounts must be > 0
- **Impact**: FAIL if any violations found

### 2. Revenue Amounts Valid (DATA_QUALITY)
- **Rule**: Recognized and deferred amounts must be ≥ 0
- **Impact**: FAIL if any violations found

### 3. AWS Cost Amounts Valid (DATA_QUALITY)
- **Rule**: All AWS costs must be > 0
- **Impact**: FAIL if any violations found

### 4. No Future Expenses (COMPLIANCE)
- **Rule**: Expense dates must not be in the future
- **Impact**: FAIL if any violations found

### 5. No Future Revenues (COMPLIANCE)
- **Rule**: Revenue dates must not be in the future
- **Impact**: FAIL if any violations found

### 6. Expense Vendor Complete (DATA_COMPLETENESS)
- **Rule**: All expenses must have vendor information
- **Impact**: FAIL if any missing vendors

### 7. Revenue Customer Complete (DATA_COMPLETENESS)
- **Rule**: All revenues must have customer information
- **Impact**: FAIL if any missing customers

### 8. Expense Data Freshness (DATA_QUALITY)
- **Rule**: Expense data should be updated within 30 days
- **Impact**: WARN if data is stale, FAIL if > 30 days

### 9. Revenue Data Freshness (DATA_QUALITY)
- **Rule**: Revenue data should be updated within 30 days
- **Impact**: WARN if data is stale, FAIL if > 30 days

### 10. Minimum Data Volume (DATA_QUALITY)
- **Rule**: Should have at least 10 records in each table
- **Impact**: WARN if below threshold

## Usage

### Setup (One-Time)

1. **Execute SQL Script** in Supabase SQL Editor:
   ```sql
   -- Run this after completing RLS setup (scripts 01-04)
   \i sql/05_create_validation_view.sql
   ```

2. **Verify View Created**:
   ```sql
   SELECT * FROM v_validation_checks;
   ```

3. **Check Permissions**:
   ```sql
   -- Verify fin_reader can access the view
   SELECT grantee, privilege_type
   FROM information_schema.table_privileges
   WHERE table_name = 'v_validation_checks';
   ```

### Running Validation

#### Via UI (Recommended)
1. Navigate to `http://localhost:3003/audit`
2. Click "Run Validation" button
3. View results in Validation Summary panel
4. Audit run is automatically logged

#### Via Server Action
```typescript
import { runValidationChecks } from "@/lib/actions/audit";

const result = await runValidationChecks();

if (result.success) {
  console.log(`Audit Run ID: ${result.auditRunId}`);
  console.log(`Passed: ${result.summary?.passed}`);
  console.log(`Failed: ${result.summary?.failed}`);
}
```

### Viewing Audit History

1. **Navigate** to `/audit` page
2. **Audit Log** shows recent runs with timestamps
3. **Click** any run to view detailed snapshot
4. **Snapshot Viewer** shows all checks from that run

### Adding Custom Checks

To add a new validation check:

1. **Edit** `sql/05_create_validation_view.sql`
2. **Add** new CTE with check logic:
   ```sql
   new_check AS (
       SELECT
           'Check Name' as check_name,
           'CATEGORY' as category,
           COUNT(*) FILTER (WHERE condition) as failures,
           COUNT(*) as total,
           CASE
               WHEN COUNT(*) FILTER (WHERE condition) = 0 THEN 'PASS'
               ELSE 'FAIL'
           END as status,
           'Check description' as description
       FROM table_name
   )
   ```
3. **Add** to UNION at bottom: `UNION ALL SELECT * FROM new_check`
4. **Re-run** the SQL script to update the view
5. **Refresh** the audit page to see new check

## Integration Points

### Dashboard Integration
- Main dashboard has "Audit & Compliance" button in header
- Links directly to `/audit` page
- Purple color scheme for audit features

### Automatic Logging
- Every validation run creates:
  1. One `audit_runs` record (summary)
  2. N `audit_snapshots` records (one per check)
- Audit trail is immutable (no updates/deletes)
- Provides full compliance history

### RLS Compatibility
- Service role bypasses RLS (application has full access)
- `fin_reader` role can view validation checks
- Audit tables accessible to service role only
- Snapshots provide read-only compliance view

## API Reference

### `runValidationChecks()`
Executes validation and logs audit trail.

**Returns:**
```typescript
{
  success: boolean;
  auditRunId?: string;
  checks?: ValidationCheck[];
  summary?: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
  };
  error?: string;
}
```

### `getAuditRuns(limit?)`
Fetches recent audit runs.

**Parameters:**
- `limit` (optional): Number of runs to fetch (default: 10)

**Returns:**
```typescript
{
  success: boolean;
  runs?: AuditRun[];
  error?: string;
}
```

### `getAuditSnapshots(auditRunId)`
Retrieves snapshots for a specific run.

**Parameters:**
- `auditRunId`: UUID of the audit run

**Returns:**
```typescript
{
  success: boolean;
  snapshots?: AuditSnapshot[];
  error?: string;
}
```

### `getCurrentValidation()`
Gets current validation status without logging.

**Returns:**
```typescript
{
  success: boolean;
  checks?: ValidationCheck[];
  summary?: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
  };
  error?: string;
}
```

## Status Codes

- **PASS**: ✓ Check passed, no issues found
- **WARN**: ⚠ Warning, may need attention
- **FAIL**: ✗ Critical issue, requires action

## Compliance Features

### Audit Trail
- Immutable log of all validation runs
- Timestamp for each run
- Complete snapshot of all checks
- Supports regulatory compliance (SOX, GDPR, etc.)

### Point-in-Time Snapshots
- Each audit run captures exact state
- Can prove compliance at any historical point
- Supports "when did we know" questions
- Useful for audits and investigations

### Reporting
- Export audit data via API
- Query historical trends
- Identify recurring issues
- Track remediation progress

## Troubleshooting

### Validation View Not Found
```sql
-- Check if view exists
SELECT * FROM information_schema.views
WHERE table_name = 'v_validation_checks';

-- If not found, run:
\i sql/05_create_validation_view.sql
```

### No Checks Showing in UI
1. Verify view is created in Supabase
2. Check browser console for errors
3. Verify service role key is set in `.env.local`
4. Test query directly: `SELECT * FROM v_validation_checks`

### Audit Runs Not Saving
1. Check `audit_runs` table exists
2. Verify service role has INSERT permission
3. Check browser console for error messages
4. Test with: `SELECT * FROM audit_runs ORDER BY run_at DESC LIMIT 1`

### Permission Denied Errors
- Service role should have full access to all tables
- Check `SUPABASE_SERVICE_ROLE_KEY` in `.env.local`
- Verify key is correct in Supabase Dashboard → Settings → API

## Future Enhancements

- [ ] Email alerts for failed checks
- [ ] Slack/webhook integrations
- [ ] Scheduled validation runs (cron jobs)
- [ ] Custom check builder UI
- [ ] Trend analysis and charts
- [ ] Automated remediation suggestions
- [ ] Export audit reports to PDF
- [ ] Role-based access to audit features

## References

- [PostgreSQL Views](https://www.postgresql.org/docs/current/sql-createview.html)
- [Supabase Row Level Security](https://supabase.com/docs/guides/auth/row-level-security)
- [Next.js Server Actions](https://nextjs.org/docs/app/building-your-application/data-fetching/server-actions-and-mutations)
- [SOX Compliance Guidelines](https://www.soxlaw.com/)
