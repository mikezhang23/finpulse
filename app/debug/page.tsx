import { testSupabaseConnection, getSupabaseTables } from "@/lib/actions/database";

export default async function DebugPage() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKeyExists = !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Test connection
  const connectionStatus = await testSupabaseConnection();

  // Get tables
  const tables = await getSupabaseTables();

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Debug Information</h1>

        {/* Environment Variables Section */}
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 space-y-4 mb-6">
          <h2 className="text-xl font-semibold mb-4">Environment Variables</h2>

          <div>
            <span className="text-gray-600 dark:text-gray-400">NEXT_PUBLIC_SUPABASE_URL:</span>
            <pre className="bg-white dark:bg-gray-900 p-3 rounded border mt-2 overflow-x-auto font-mono text-sm">
              {supabaseUrl || "NOT SET"}
            </pre>
          </div>

          <div>
            <span className="text-gray-600 dark:text-gray-400">NEXT_PUBLIC_SUPABASE_ANON_KEY:</span>
            <pre className="bg-white dark:bg-gray-900 p-3 rounded border mt-2 overflow-x-auto font-mono text-sm">
              {supabaseKeyExists ? "SET (hidden for security)" : "NOT SET"}
            </pre>
          </div>

          <div className="pt-4">
            <span className={`font-semibold ${supabaseUrl && supabaseKeyExists ? "text-green-600" : "text-red-600"}`}>
              {supabaseUrl && supabaseKeyExists ? "✅ Environment variables configured" : "❌ Environment variables missing"}
            </span>
          </div>
        </div>

        {/* Supabase Connection Section */}
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 space-y-4 mb-6">
          <h2 className="text-xl font-semibold mb-4">Supabase Connection</h2>

          <div className="flex items-center gap-3">
            <span className="text-gray-600 dark:text-gray-400">Status:</span>
            <span className={`font-semibold ${connectionStatus.connected ? "text-green-600" : "text-red-600"}`}>
              {connectionStatus.connected ? "✅ Connected" : "❌ Not Connected"}
            </span>
          </div>

          <div>
            <span className="text-gray-600 dark:text-gray-400">Timestamp:</span>
            <pre className="bg-white dark:bg-gray-900 p-3 rounded border mt-2 overflow-x-auto font-mono text-sm">
              {connectionStatus.timestamp}
            </pre>
          </div>

          {connectionStatus.error && (
            <div>
              <span className="text-red-600 dark:text-red-400 font-semibold">Error:</span>
              <pre className="bg-red-50 dark:bg-red-900/20 p-3 rounded border border-red-200 dark:border-red-800 mt-2 overflow-x-auto font-mono text-sm text-red-800 dark:text-red-200">
                {connectionStatus.error}
              </pre>
            </div>
          )}
        </div>

        {/* Database Tables Section */}
        <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-6 space-y-4">
          <h2 className="text-xl font-semibold mb-4">Database Tables</h2>

          {tables.length > 0 ? (
            <div className="space-y-3">
              {tables.map((table) => (
                <div key={table.name} className="bg-white dark:bg-gray-900 p-4 rounded border">
                  <div className="flex items-center justify-between">
                    <span className="font-mono font-semibold text-blue-600 dark:text-blue-400">
                      {table.name}
                    </span>
                    {table.count !== null && (
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {table.count} rows
                      </span>
                    )}
                  </div>
                  {table.error && (
                    <div className="mt-2 text-sm text-red-600 dark:text-red-400">
                      {table.error}
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-gray-600 dark:text-gray-400">
              No tables found or unable to fetch table information.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}