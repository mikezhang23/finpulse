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

interface KPIData {
  totalExpenses: number;
  totalIncome: number;
  totalAccounts: number;
  totalBudgets: number;
  lastRefreshed: string;
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

    // Fetch counts from all tables in parallel
    const [expensesResult, incomeResult, accountsResult, budgetsResult] = await Promise.all([
      supabase.from('expenses').select('*', { count: 'exact', head: true }),
      supabase.from('income').select('*', { count: 'exact', head: true }),
      supabase.from('accounts').select('*', { count: 'exact', head: true }),
      supabase.from('budgets').select('*', { count: 'exact', head: true }),
    ]);

    // Check for errors
    if (expensesResult.error) throw new Error(`Expenses: ${expensesResult.error.message}`);
    if (incomeResult.error) throw new Error(`Income: ${incomeResult.error.message}`);
    if (accountsResult.error) throw new Error(`Accounts: ${accountsResult.error.message}`);
    if (budgetsResult.error) throw new Error(`Budgets: ${budgetsResult.error.message}`);

    return {
      success: true,
      kpis: {
        totalExpenses: expensesResult.count || 0,
        totalIncome: incomeResult.count || 0,
        totalAccounts: accountsResult.count || 0,
        totalBudgets: budgetsResult.count || 0,
        lastRefreshed: new Date().toISOString(),
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