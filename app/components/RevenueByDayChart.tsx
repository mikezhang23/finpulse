"use client";

import type { ChartDataPoint } from "@/lib/actions/database";

interface RevenueByDayChartProps {
  data: ChartDataPoint[];
}

export default function RevenueByDayChart({ data }: RevenueByDayChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold mb-4">Revenue by Day</h3>
        <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
          No revenue data available
        </div>
      </div>
    );
  }

  // Calculate dimensions and scales
  const width = 100;
  const height = 100;
  const padding = 5;

  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const valueRange = maxValue - minValue || 1;

  // Generate path for area chart
  const points = data.map((d, i) => {
    const x = (i / (data.length - 1)) * (width - 2 * padding) + padding;
    const y = height - padding - ((d.value - minValue) / valueRange) * (height - 2 * padding);
    return { x, y, value: d.value };
  });

  // Create line path
  const linePath = points.map((p, i) =>
    `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`
  ).join(' ');

  // Create area path (line + bottom fill)
  const areaPath = `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${padding} ${height - padding} Z`;

  // Format date for display
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getMonth() + 1}/${date.getDate()}`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold mb-4">Revenue by Day</h3>

      {/* Chart Container */}
      <div className="relative" style={{ height: '240px' }}>
        <svg
          viewBox={`0 0 ${width} ${height}`}
          preserveAspectRatio="none"
          className="w-full h-full"
        >
          {/* Area fill */}
          <path
            d={areaPath}
            fill="rgb(74, 222, 128)"
            fillOpacity="0.2"
            stroke="none"
          />

          {/* Line */}
          <path
            d={linePath}
            fill="none"
            stroke="rgb(34, 197, 94)"
            strokeWidth="0.5"
            vectorEffect="non-scaling-stroke"
          />

          {/* Data points */}
          {points.map((p, i) => (
            <circle
              key={i}
              cx={p.x}
              cy={p.y}
              r="0.8"
              fill="rgb(34, 197, 94)"
              vectorEffect="non-scaling-stroke"
            />
          ))}
        </svg>

        {/* Y-axis labels */}
        <div className="absolute left-0 top-0 bottom-0 flex flex-col justify-between text-xs text-gray-500 dark:text-gray-400 pr-2">
          <div>${(maxValue / 1000).toFixed(1)}k</div>
          <div>${((maxValue + minValue) / 2000).toFixed(1)}k</div>
          <div>${(minValue / 1000).toFixed(1)}k</div>
        </div>
      </div>

      {/* X-axis labels */}
      <div className="flex justify-between mt-2 text-xs text-gray-500 dark:text-gray-400">
        <div>{formatDate(data[0].date)}</div>
        {data.length > 1 && <div>{formatDate(data[Math.floor(data.length / 2)].date)}</div>}
        {data.length > 1 && <div>{formatDate(data[data.length - 1].date)}</div>}
      </div>

      {/* Stats */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex gap-6">
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Total</div>
          <div className="text-lg font-semibold text-green-600 dark:text-green-400">
            ${data.reduce((sum, d) => sum + d.value, 0).toLocaleString()}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Average</div>
          <div className="text-lg font-semibold text-green-600 dark:text-green-400">
            ${(data.reduce((sum, d) => sum + d.value, 0) / data.length).toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Peak</div>
          <div className="text-lg font-semibold text-green-600 dark:text-green-400">
            ${maxValue.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}
