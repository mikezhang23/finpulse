"use client";

import type { DeptDataPoint } from "@/lib/actions/database";

interface ExpenseByDeptChartProps {
  data: DeptDataPoint[];
}

export default function ExpenseByDeptChart({ data }: ExpenseByDeptChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 className="text-lg font-semibold mb-4">Expenses by Department</h3>
        <div className="h-64 flex items-center justify-center text-gray-500 dark:text-gray-400">
          No expense data available
        </div>
      </div>
    );
  }

  // Sort by value descending and take top 10
  const sortedData = [...data].sort((a, b) => b.value - a.value).slice(0, 10);
  const maxValue = Math.max(...sortedData.map(d => d.value));

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
      <h3 className="text-lg font-semibold mb-4">Expenses by Department</h3>

      {/* Chart Container */}
      <div className="space-y-3" style={{ height: '240px', overflowY: 'auto' }}>
        {sortedData.map((item, index) => {
          const percentage = (item.value / maxValue) * 100;
          return (
            <div key={index}>
              <div className="flex justify-between items-center mb-1">
                <span className="text-sm font-medium text-gray-700 dark:text-gray-300 truncate">
                  {item.dept}
                </span>
                <span className="text-sm font-semibold text-blue-600 dark:text-blue-400 ml-2">
                  ${item.value.toLocaleString()}
                </span>
              </div>
              <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                <div
                  className="bg-blue-600 dark:bg-blue-500 h-2 rounded-full transition-all duration-500"
                  style={{ width: `${percentage}%` }}
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* Stats */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 flex gap-6">
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Total Departments</div>
          <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
            {data.length}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Total Spend</div>
          <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
            ${data.reduce((sum, d) => sum + d.value, 0).toLocaleString()}
          </div>
        </div>
        <div>
          <div className="text-xs text-gray-500 dark:text-gray-400">Highest</div>
          <div className="text-lg font-semibold text-blue-600 dark:text-blue-400">
            ${maxValue.toLocaleString()}
          </div>
        </div>
      </div>
    </div>
  );
}
