"use client";

import type { CostTrend } from "@/lib/actions/cost-optimization";

interface AwsCostTrendChartProps {
  data: CostTrend[];
}

export default function AwsCostTrendChart({ data }: AwsCostTrendChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold mb-4">AWS Cost Trend</h3>
        <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
          No trend data available
        </div>
      </div>
    );
  }

  // Sort data by date ascending for the chart
  const sortedData = [...data].sort(
    (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
  );

  // Take last 30 days
  const chartData = sortedData.slice(-30);

  // Calculate dimensions and scales
  const width = 100;
  const height = 100;
  const padding = 5;

  // Find min/max values across both lines
  const allValues = chartData.flatMap((d) => [
    d.daily_total,
    d.avg_7day || d.daily_total,
  ]);
  const maxValue = Math.max(...allValues);
  const minValue = Math.min(...allValues);
  const valueRange = maxValue - minValue || 1;

  // Generate points for daily costs
  const dailyPoints = chartData.map((d, i) => {
    const x = (i / (chartData.length - 1)) * (width - 2 * padding) + padding;
    const y =
      height -
      padding -
      ((d.daily_total - minValue) / valueRange) * (height - 2 * padding);
    return { x, y, value: d.daily_total };
  });

  // Generate points for 7-day moving average
  const avgPoints = chartData.map((d, i) => {
    const x = (i / (chartData.length - 1)) * (width - 2 * padding) + padding;
    const avgValue = d.avg_7day || d.daily_total;
    const y =
      height -
      padding -
      ((avgValue - minValue) / valueRange) * (height - 2 * padding);
    return { x, y, value: avgValue };
  });

  // Create paths
  const dailyPath = dailyPoints
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  const avgPath = avgPoints
    .map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`)
    .join(" ");

  // Create area for daily costs
  const dailyArea = `${dailyPath} L ${dailyPoints[dailyPoints.length - 1].x} ${height - padding} L ${padding} ${height - padding} Z`;

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  // Get trend indicator
  const latestTrend = data[0];
  const trendColor =
    latestTrend?.trend_direction === "increasing"
      ? "text-red-600 dark:text-red-400"
      : latestTrend?.trend_direction === "decreasing"
      ? "text-green-600 dark:text-green-400"
      : "text-blue-600 dark:text-blue-400";

  const trendIcon =
    latestTrend?.trend_direction === "increasing"
      ? "↗"
      : latestTrend?.trend_direction === "decreasing"
      ? "↘"
      : "→";

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold">AWS Cost Trend (30 Days)</h3>
        <div className="flex items-center gap-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-purple-600 dark:bg-purple-400"></div>
            <span className="text-gray-600 dark:text-gray-400">Daily</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-3 h-0.5 bg-orange-600 dark:bg-orange-400"></div>
            <span className="text-gray-600 dark:text-gray-400">7-Day Avg</span>
          </div>
        </div>
      </div>

      {/* Chart Container */}
      <div className="relative" style={{ height: "240px" }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          {/* Area fill for daily costs */}
          <path
            d={dailyArea}
            fill="rgb(147, 51, 234)"
            fillOpacity="0.1"
            stroke="none"
          />

          {/* 7-day moving average line (thicker, smoother) */}
          <path
            d={avgPath}
            fill="none"
            stroke="rgb(249, 115, 22)"
            strokeWidth="0.8"
            vectorEffect="non-scaling-stroke"
          />

          {/* Daily cost line */}
          <path
            d={dailyPath}
            fill="none"
            stroke="rgb(147, 51, 234)"
            strokeWidth="0.5"
            vectorEffect="non-scaling-stroke"
            strokeOpacity="0.7"
          />

          {/* Data points for moving average */}
          {avgPoints.map((p, i) => (
            <circle
              key={`avg-${i}`}
              cx={p.x}
              cy={p.y}
              r="0.6"
              fill="rgb(249, 115, 22)"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>

        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-gray-500 dark:text-gray-400 pr-2">
          <div>${(maxValue / 1).toFixed(0)}</div>
          <div>${((maxValue + minValue) / 2).toFixed(0)}</div>
          <div>${(minValue / 1).toFixed(0)}</div>
        </div>
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
        <div>{formatDate(chartData[0].date)}</div>
        {chartData.length > 1 && (
          <div>{formatDate(chartData[Math.floor(chartData.length / 2)].date)}</div>
        )}
        {chartData.length > 1 && (
          <div>{formatDate(chartData[chartData.length - 1].date)}</div>
        )}
      </div>

      {/* Stats */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex gap-6">
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            Latest Daily
          </div>
          <div className="text-lg font-semibold text-purple-600 dark:text-purple-400">
            ${chartData[chartData.length - 1].daily_total.toFixed(2)}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400">
            7-Day Average
          </div>
          <div className="text-lg font-semibold text-orange-600 dark:text-orange-400">
            $
            {(
              chartData[chartData.length - 1].avg_7day ||
              chartData[chartData.length - 1].daily_total
            ).toFixed(2)}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Trend</div>
          <div className={`text-lg font-semibold ${trendColor}`}>
            {trendIcon} {latestTrend?.trend_direction || "stable"}
          </div>
        </div>
        {latestTrend?.wow_change_pct !== null && (
          <div>
            <div className="text-xs text-gray-500 dark:text-gray-400">WoW</div>
            <div
              className={`text-lg font-semibold ${
                (latestTrend.wow_change_pct || 0) > 0
                  ? "text-red-600 dark:text-red-400"
                  : "text-green-600 dark:text-green-400"
              }`}
            >
              {latestTrend.wow_change_pct > 0 ? "+" : ""}
              {latestTrend.wow_change_pct?.toFixed(1)}%
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
