export default function ChartSkeleton() {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6 animate-pulse">
      {/* Title skeleton */}
      <div className="h-6 bg-gray-200 dark:bg-gray-700 rounded w-1/3 mb-4" />

      {/* Chart area skeleton */}
      <div className="h-60 bg-gray-100 dark:bg-gray-700/50 rounded mb-4 flex items-end justify-around px-4 pb-4 gap-2">
        <div className="bg-gray-200 dark:bg-gray-600 rounded-t w-full" style={{ height: '60%' }} />
        <div className="bg-gray-200 dark:bg-gray-600 rounded-t w-full" style={{ height: '80%' }} />
        <div className="bg-gray-200 dark:bg-gray-600 rounded-t w-full" style={{ height: '45%' }} />
        <div className="bg-gray-200 dark:bg-gray-600 rounded-t w-full" style={{ height: '90%' }} />
        <div className="bg-gray-200 dark:bg-gray-600 rounded-t w-full" style={{ height: '70%' }} />
        <div className="bg-gray-200 dark:bg-gray-600 rounded-t w-full" style={{ height: '55%' }} />
      </div>

      {/* Stats skeleton */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700 flex gap-6">
        <div className="flex-1">
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-2" />
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-full" />
        </div>
        <div className="flex-1">
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-2" />
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-full" />
        </div>
        <div className="flex-1">
          <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3 mb-2" />
          <div className="h-5 bg-gray-200 dark:bg-gray-700 rounded w-full" />
        </div>
      </div>
    </div>
  );
}
