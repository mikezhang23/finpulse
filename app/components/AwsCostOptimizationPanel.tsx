import type { CostOptimizationData } from "@/lib/actions/cost-optimization";
import AwsCostTrendChart from "@/app/components/AwsCostTrendChart";

interface AwsCostOptimizationPanelProps {
  data: CostOptimizationData;
}

export default function AwsCostOptimizationPanel({
  data,
}: AwsCostOptimizationPanelProps) {
  // Safety check for data
  if (!data || !data.trends || !data.waste || !data.savings || !data.summary) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-6">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
          AWS Cost Optimization
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Run the SQL views script (sql/07_create_aws_cost_optimization_views.sql) to enable optimization insights.
        </p>
      </div>
    );
  }

  const { trends, waste, savings, summary } = data;
  const latestTrend = trends[0];

  // Get trend color and icon
  const getTrendIndicator = (direction: string) => {
    switch (direction) {
      case "increasing":
        return {
          color: "text-red-600 dark:text-red-400",
          bg: "bg-red-50 dark:bg-red-900/20",
          icon: "↗",
        };
      case "decreasing":
        return {
          color: "text-green-600 dark:text-green-400",
          bg: "bg-green-50 dark:bg-green-900/20",
          icon: "↘",
        };
      default:
        return {
          color: "text-blue-600 dark:text-blue-400",
          bg: "bg-blue-50 dark:bg-blue-900/20",
          icon: "→",
        };
    }
  };

  const trendIndicator = latestTrend
    ? getTrendIndicator(latestTrend.trend_direction)
    : getTrendIndicator("stable");

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
              AWS Cost Optimization
            </h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Automated analysis of trends, waste, and savings opportunities
            </p>
          </div>
          <div className="text-right">
            <div className="text-3xl font-bold text-green-600 dark:text-green-400">
              ${summary.total_potential_savings.toLocaleString()}
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Potential Savings
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {/* Trend Chart */}
        {trends.length > 0 && (
          <div className="mb-6">
            <AwsCostTrendChart data={trends} />
          </div>
        )}

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div
            className={`${trendIndicator.bg} rounded-lg p-4 border border-gray-200 dark:border-gray-700`}
          >
            <div className="flex items-center justify-between">
              <div>
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  Cost Trend
                </div>
                <div className={`text-2xl font-bold ${trendIndicator.color}`}>
                  {trendIndicator.icon} {summary.trend_status}
                </div>
              </div>
            </div>
            {latestTrend && (
              <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                7-day avg: ${latestTrend.avg_7day.toFixed(2)} | 30-day avg: $
                {latestTrend.avg_30day.toFixed(2)}
              </div>
            )}
          </div>

          <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Waste Items
            </div>
            <div className="text-2xl font-bold text-orange-600 dark:text-orange-400">
              {summary.total_waste_items}
            </div>
            {summary.highest_risk_dept && (
              <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
                Highest risk: {summary.highest_risk_dept}
              </div>
            )}
          </div>

          <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              Optimization Score
            </div>
            <div className="text-2xl font-bold text-purple-600 dark:text-purple-400">
              {savings.length > 0
                ? `${Math.round((1 - summary.total_potential_savings / (summary.total_potential_savings + 1000)) * 100)}%`
                : "N/A"}
            </div>
            <div className="mt-2 text-xs text-gray-600 dark:text-gray-400">
              {savings.length} opportunities found
            </div>
          </div>
        </div>

        {/* Savings Opportunities */}
        {savings.length > 0 && (
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Top Savings Opportunities
            </h3>
            <div className="space-y-3">
              {savings.slice(0, 5).map((opp, idx) => (
                <div
                  key={idx}
                  className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-4 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-gray-900 dark:text-gray-100">
                          {opp.dept}
                        </span>
                        <span className="text-xs bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 px-2 py-1 rounded">
                          {opp.savings_pct}% savings
                        </span>
                      </div>
                      <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {opp.primary_action}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        {opp.resource_count} transactions • Current: $
                        {opp.current_monthly_cost.toFixed(2)}
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="text-xl font-bold text-green-600 dark:text-green-400">
                        ${opp.total_savings.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-500">
                        potential
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Waste Detection */}
        {waste.length > 0 && (
          <div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
              Waste Flags
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {waste.slice(0, 6).map((item, idx) => (
                <div
                  key={idx}
                  className="bg-gray-50 dark:bg-gray-900/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {item.dept}
                        </span>
                        <span
                          className={`text-xs px-2 py-0.5 rounded ${
                            item.waste_score >= 3
                              ? "bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300"
                              : item.waste_score === 2
                              ? "bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300"
                              : "bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300"
                          }`}
                        >
                          {item.waste_category}
                        </span>
                      </div>
                      <div className="text-xs text-gray-600 dark:text-gray-400 mt-1">
                        {item.transaction_count} transactions • Avg: $
                        {item.avg_cost.toFixed(2)}
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-500 mt-1">
                        Total: ${item.total_cost.toFixed(2)} • Last seen:{" "}
                        {new Date(item.last_seen).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Empty State */}
        {savings.length === 0 && waste.length === 0 && (
          <div className="text-center py-8">
            <div className="text-4xl mb-2">✨</div>
            <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              All Optimized!
            </div>
            <div className="text-sm text-gray-600 dark:text-gray-400 mt-1">
              No waste detected and no immediate savings opportunities found.
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
