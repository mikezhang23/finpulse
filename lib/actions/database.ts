"use server";

import { createClient } from "@supabase/supabase-js";

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