# FinPulse Database Security - RLS Implementation

This directory contains SQL scripts to implement Row Level Security (RLS) for the FinPulse database.

## Overview

**Step 5A: Security - Enable RLS + Least-Privilege Roles**

The security implementation includes:
1. **Enable RLS** on all financial tables (safe with service role)
2. **Create read-only role** (`fin_reader`) with minimal permissions
3. **Create RLS policies** allowing `fin_reader` to read data
4. **Sanity checks** to verify implementation

## Execution Order

Execute the scripts in order via Supabase SQL Editor:

### 1. Enable RLS on All Tables
```bash
sql/01_enable_rls.sql
```
- Enables Row Level Security on all main tables
- Service role will bypass RLS (application continues to work)
- Returns verification query showing RLS status

### 2. Create Read-Only Role
```bash
sql/02_create_readonly_role.sql
```
- Creates `fin_reader` role with NOLOGIN (can't directly login)
- Grants SELECT-only permissions on all tables
- No INSERT, UPDATE, or DELETE permissions
- Returns verification query showing role permissions

### 3. Create RLS Policies
```bash
sql/03_create_rls_policies.sql
```
- Creates RLS policies for each table
- Allows `fin_reader` to SELECT all rows
- Service role bypasses these policies
- Returns verification query listing all policies

### 4. Test Implementation
```bash
sql/04_test_rls.sql
```
- Verifies RLS is enabled
- Tests `fin_reader` can SELECT data
- Ensures service role still has full access
- Validates policy effectiveness

## How to Execute in Supabase

1. **Navigate to SQL Editor**:
   - Go to Supabase Dashboard
   - Select your project (FinPulse)
   - Click "SQL Editor" in left sidebar

2. **Execute Each Script**:
   - Copy contents of `01_enable_rls.sql`
   - Paste into SQL Editor
   - Click "Run"
   - Repeat for scripts 02, 03, and 04

3. **Verify Results**:
   - Each script includes verification queries
   - Check output to confirm success
   - Look for "SUCCESS" messages in test script

## Security Benefits

### Before RLS:
- ❌ No table-level security
- ❌ Anyone with database access could read/write all data
- ❌ No role-based access control

### After RLS:
- ✅ Table-level security enabled
- ✅ `fin_reader` role has read-only access
- ✅ Service role maintains full access for application
- ✅ Foundation for user-level security if needed

## Important Notes

1. **Service Role Unaffected**:
   - Application uses `SUPABASE_SERVICE_ROLE_KEY`
   - Service role bypasses RLS
   - Dashboard and CSV exports continue to work

2. **Future User Access**:
   - Can create user-specific policies later
   - Can restrict access by department, role, etc.
   - Foundation is now in place

3. **Backup Recommendation**:
   - Consider backing up database before running
   - Scripts are idempotent (safe to re-run)
   - Use `DROP POLICY IF EXISTS` to avoid conflicts

## Tables Protected

- ✅ `expenses` (280 rows)
- ✅ `revenues` (180 rows)
- ✅ `aws_costs` (339 rows)
- ✅ `audit_runs` (0 rows)
- ✅ `audit_snapshots`
- ✅ `accounts` (if exists)

## Views Protected

- ✅ `v_aws_costs_daily`
- ✅ `v_fin_health`
- ✅ `v_revenue_daily`

## Next Steps

After implementing RLS:
1. ✅ Verify application still works
2. ✅ Test CSV exports
3. ✅ Monitor Supabase logs
4. ✅ Implement audit logging and validation checks (Step 5B)
5. Consider adding user-specific policies
6. Document role assignment process

## Step 5B: Audit Logging & Validation

After implementing RLS, continue with audit logging:

**Execute:** `sql/05_create_validation_view.sql`
- Creates `v_validation_checks` view with 10 automated checks
- Categories: DATA_QUALITY, COMPLIANCE, DATA_COMPLETENESS
- Grants SELECT to `fin_reader` role

**Features:**
- ✅ Named, automated validation checks
- ✅ Audit trail for every validation run
- ✅ Validation Summary panel UI
- ✅ Audit Log with historical runs
- ✅ Snapshot viewer for compliance

**Access:**
Navigate to `/audit` in the application to view validation and audit features.

## Troubleshooting

### Application Can't Read Data
- Verify service role key is set correctly in `.env.local`
- Service role should bypass RLS automatically

### fin_reader Can't Access Data
- Run verification queries in `04_test_rls.sql`
- Check policies exist: `SELECT * FROM pg_policies WHERE schemaname = 'public'`
- Verify role exists: `SELECT * FROM pg_roles WHERE rolname = 'fin_reader'`

### Need to Disable RLS Temporarily
```sql
ALTER TABLE public.expenses DISABLE ROW LEVEL SECURITY;
-- Repeat for other tables
```

### Need to Remove Policies
```sql
DROP POLICY "fin_reader can view all expenses" ON public.expenses;
-- Repeat for other tables
```

## References

- [Supabase RLS Documentation](https://supabase.com/docs/guides/auth/row-level-security)
- [PostgreSQL Row Security Policies](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)
- [PostgreSQL Roles Documentation](https://www.postgresql.org/docs/current/user-manag.html)
