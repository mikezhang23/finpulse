"use server";

import { createClient } from "@supabase/supabase-js";
import { createServiceRoleClient } from "@/lib/supabase/server";

interface ConnectionStatus {
  connected: boolean;
  timestamp: string;
  error?: string;
}

interface TableInfo {
  name: string;
  count: number | null;
  error?: string;
}

export interface ChartDataPoint {
  date: string;
  value: number;
}

export interface DeptDataPoint {
  dept: string;
  value: number;
}

interface KPIData {
  totalExpenses: number;
  totalRevenues: number;
  totalAwsCosts: number;
  totalAuditRuns: number;
  lastRefreshed: string;
  expensesData?: unknown[];
  revenuesData?: unknown[];
  revenueByDay?: ChartDataPoint[];
  expenseByDay?: ChartDataPoint[];
  expenseByDept?: DeptDataPoint[];
  awsCostByDept?: DeptDataPoint[];
}

export async function testSupabaseConnection(): Promise<ConnectionStatus> {
  const timestamp = new Date().toISOString();

  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!url || !key) {
      return {
        connected: false,
        timestamp,
        error: "Environment variables not configured"
      };
    }

    // Create a simple client
    const supabase = createClient(url, key);

    // Test with a lightweight auth check
    const { error } = await supabase.auth.getSession();

    if (error) {
      return {
        connected: false,
        timestamp,
        error: error.message
      };
    }

    return {
      connected: true,
      timestamp
    };
  } catch (error) {
    return {
      connected: false,
      timestamp,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

export async function refreshAndValidateData(): Promise<{
  success: boolean;
  kpis?: KPIData;
  error?: string;
}> {
  try {
    const supabase = createServiceRoleClient();

    // Fetch counts and data from all tables in parallel
    const [
      expensesResult,
      revenuesResult,
      awsCostsResult,
      auditRunsResult,
      expensesDataResult,
      revenuesDataResult,
      expensesForChartResult,
      revenuesForChartResult,
      awsCostsForChartResult,
    ] = await Promise.all([
      supabase.from('expenses').select('*', { count: 'exact', head: true }),
      supabase.from('revenues').select('*', { count: 'exact', head: true }),
      supabase.from('aws_costs').select('*', { count: 'exact', head: true }),
      supabase.from('audit_runs').select('*', { count: 'exact', head: true }),
      supabase.from('expenses').select('*').order('txn_date', { ascending: false }).limit(100),
      supabase.from('revenues').select('*').order('txn_date', { ascending: false }).limit(100),
      supabase.from('expenses').select('txn_date, amount, dept').order('txn_date', { ascending: true }).limit(1000),
      supabase.from('revenues').select('txn_date, recognized_amount').order('txn_date', { ascending: true }).limit(1000),
      supabase.from('aws_costs').select('dept, cost_usd').limit(1000),
    ]);

    // Check for errors
    if (expensesResult.error) throw new Error(`Expenses: ${expensesResult.error.message}`);
    if (revenuesResult.error) throw new Error(`Revenues: ${revenuesResult.error.message}`);
    if (awsCostsResult.error) throw new Error(`AWS Costs: ${awsCostsResult.error.message}`);
    if (auditRunsResult.error) throw new Error(`Audit Runs: ${auditRunsResult.error.message}`);

    // Aggregate revenue by day
    const revenueByDay: ChartDataPoint[] = [];
    if (revenuesForChartResult.data) {
      const revenueMap = new Map<string, number>();
      revenuesForChartResult.data.forEach((row: any) => {
        const date = new Date(row.txn_date).toISOString().split('T')[0];
        const current = revenueMap.get(date) || 0;
        revenueMap.set(date, current + (row.recognized_amount || 0));
      });
      revenueMap.forEach((value, date) => {
        revenueByDay.push({ date, value });
      });
    }

    // Aggregate expense by day
    const expenseByDay: ChartDataPoint[] = [];
    if (expensesForChartResult.data) {
      const expenseMap = new Map<string, number>();
      expensesForChartResult.data.forEach((row: any) => {
        const date = new Date(row.txn_date).toISOString().split('T')[0];
        const current = expenseMap.get(date) || 0;
        expenseMap.set(date, current + (row.amount || 0));
      });
      expenseMap.forEach((value, date) => {
        expenseByDay.push({ date, value });
      });
    }

    // Aggregate expense by department
    const expenseByDept: DeptDataPoint[] = [];
    if (expensesForChartResult.data) {
      const deptMap = new Map<string, number>();
      expensesForChartResult.data.forEach((row: any) => {
        const dept = row.dept || 'Unknown';
        const current = deptMap.get(dept) || 0;
        deptMap.set(dept, current + (row.amount || 0));
      });
      deptMap.forEach((value, dept) => {
        expenseByDept.push({ dept, value });
      });
    }

    // Aggregate AWS cost by department
    const awsCostByDept: DeptDataPoint[] = [];
    if (awsCostsForChartResult.data) {
      const deptMap = new Map<string, number>();
      awsCostsForChartResult.data.forEach((row: any) => {
        const dept = row.dept || 'Unknown';
        const current = deptMap.get(dept) || 0;
        deptMap.set(dept, current + (row.cost_usd || 0));
      });
      deptMap.forEach((value, dept) => {
        awsCostByDept.push({ dept, value });
      });
    }

    return {
      success: true,
      kpis: {
        totalExpenses: expensesResult.count || 0,
        totalRevenues: revenuesResult.count || 0,
        totalAwsCosts: awsCostsResult.count || 0,
        totalAuditRuns: auditRunsResult.count || 0,
        lastRefreshed: new Date().toISOString(),
        expensesData: expensesDataResult.data || [],
        revenuesData: revenuesDataResult.data || [],
        revenueByDay,
        expenseByDay,
        expenseByDept,
        awsCostByDept,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

export async function getSupabaseTables(): Promise<TableInfo[]> {
  try {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

    if (!url || !serviceKey) {
      return [];
    }

    const supabase = createClient(url, serviceKey);

    // Query to get all tables from public schema
    const { data, error } = await supabase
      .rpc('get_table_list', {});

    if (error) {
      // If RPC doesn't exist, try a direct query to information_schema
      const { data: schemaData, error: schemaError } = await supabase
        .from('information_schema.tables')
        .select('table_name')
        .eq('table_schema', 'public');

      if (schemaError) {
        // Fallback: try common table names
        const commonTables = ['users', 'profiles', 'posts', 'transactions', 'accounts', 'budgets', 'expenses', 'income'];
        const results: TableInfo[] = [];

        for (const tableName of commonTables) {
          const { count, error: countError } = await supabase
            .from(tableName)
            .select('*', { count: 'exact', head: true });

          if (!countError) {
            results.push({ name: tableName, count });
          }
        }

        return results;
      }

      return schemaData?.map((t: { table_name: string }) => ({
        name: t.table_name,
        count: null
      })) || [];
    }

    return data || [];
  } catch (error) {
    return [];
  }
}