import { refreshAndValidateData } from "@/lib/actions/database";
import RefreshButton from "@/app/components/RefreshButton";
import LastRefreshed from "@/app/components/LastRefreshed";

export default async function Home() {
  const result = await refreshAndValidateData();

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">FinPulse Dashboard</h1>
          <RefreshButton />
        </div>

        {result.success && result.kpis ? (
          <>
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Total Expenses
                </div>
                <div className="text-3xl font-bold text-blue-600 dark:text-blue-400">
                  {result.kpis.totalExpenses}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Total Revenues
                </div>
                <div className="text-3xl font-bold text-green-600 dark:text-green-400">
                  {result.kpis.totalRevenues}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Total AWS Costs
                </div>
                <div className="text-3xl font-bold text-purple-600 dark:text-purple-400">
                  {result.kpis.totalAwsCosts}
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
                <div className="text-sm text-gray-600 dark:text-gray-400 mb-2">
                  Total Audit Runs
                </div>
                <div className="text-3xl font-bold text-orange-600 dark:text-orange-400">
                  {result.kpis.totalAuditRuns}
                </div>
              </div>
            </div>

            {/* Last Refreshed */}
            <LastRefreshed timestamp={result.kpis.lastRefreshed} />
          </>
        ) : (
          <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-6">
            <h2 className="text-xl font-semibold text-red-800 dark:text-red-200 mb-2">
              Error Loading Data
            </h2>
            <p className="text-red-600 dark:text-red-400">
              {result.error || "Unknown error occurred"}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
