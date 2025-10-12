"use client";

export default function LastRefreshed({ timestamp }: { timestamp: string }) {
  return (
    <div className="bg-gray-100 dark:bg-gray-800 rounded-lg p-4 text-sm text-gray-600 dark:text-gray-400">
      Last refreshed: <span suppressHydrationWarning>{new Date(timestamp).toLocaleString()}</span>
    </div>
  );
}
