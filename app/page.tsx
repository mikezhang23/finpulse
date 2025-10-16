import { refreshAndValidateData } from "@/lib/actions/database";
import { detectAwsCostAnomalies } from "@/lib/actions/anomalies";
import { getAwsCostOptimization } from "@/lib/actions/cost-optimization";
import RefreshButton from "@/app/components/RefreshButton";
import LastRefreshed from "@/app/components/LastRefreshed";
import ExpensesTable from "@/app/components/ExpensesTable";
import RevenuesTable from "@/app/components/RevenuesTable";
import RevenueByDayChart from "@/app/components/RevenueByDayChart";
import ExpenseByDayChart from "@/app/components/ExpenseByDayChart";
import ExpenseByDeptChart from "@/app/components/ExpenseByDeptChart";
import AwsCostByDeptChart from "@/app/components/AwsCostByDeptChart";
import AnomaliesPanel from "@/app/components/AnomaliesPanel";
import AwsCostOptimizationPanel from "@/app/components/AwsCostOptimizationPanel";

export default async function Home() {
  const result = await refreshAndValidateData();
  const anomaliesResult = await detectAwsCostAnomalies(1.5);
  const optimizationResult = await getAwsCostOptimization();

  return (
    <div className="min-h-screen p-8">
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-4xl font-bold">FinPulse Dashboard</h1>
          <div className="flex gap-3">
            <a
              href="/audit"
              className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2"
            >
              <svg
                className="w-5 h-5"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Audit & Compliance
            </a>
            <RefreshButton />
          </div>
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
            <div className="mb-8">
              <LastRefreshed timestamp={result.kpis.lastRefreshed} />
            </div>

            {/* Anomalies Section */}
            {anomaliesResult.success && anomaliesResult.anomalies && (
              <div className="mb-8">
                <AnomaliesPanel anomalies={anomaliesResult.anomalies} />
              </div>
            )}

            {/* Cost Optimization Section */}
            {optimizationResult.success && optimizationResult.data && (
              <div className="mb-8">
                <AwsCostOptimizationPanel data={optimizationResult.data} />
              </div>
            )}

            {/* Charts Section */}
            <div className="mb-8">
              <h2 className="text-2xl font-semibold mb-4">Financial Trends</h2>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
                {result.kpis.revenueByDay && (
                  <RevenueByDayChart data={result.kpis.revenueByDay} />
                )}
                {result.kpis.expenseByDay && (
                  <ExpenseByDayChart data={result.kpis.expenseByDay} />
                )}
              </div>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {result.kpis.expenseByDept && (
                  <ExpenseByDeptChart data={result.kpis.expenseByDept} />
                )}
                {result.kpis.awsCostByDept && (
                  <AwsCostByDeptChart data={result.kpis.awsCostByDept} />
                )}
              </div>
            </div>

            {/* Data Tables */}
            <div className="space-y-8">
              <h2 className="text-2xl font-semibold">Recent Transactions</h2>
              {result.kpis.expensesData && result.kpis.expensesData.length > 0 && (
                <ExpensesTable data={JSON.parse(JSON.stringify(result.kpis.expensesData))} />
              )}

              {result.kpis.revenuesData && result.kpis.revenuesData.length > 0 && (
                <RevenuesTable data={JSON.parse(JSON.stringify(result.kpis.revenuesData))} />
              )}
            </div>
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
