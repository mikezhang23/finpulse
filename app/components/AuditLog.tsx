"use client";

import { useState } from "react";
import type { AuditRun } from "@/lib/actions/audit";

interface AuditLogProps {
  initialRuns?: AuditRun[];
  onSelectRun?: (runId: string) => void;
}

export default function AuditLog({
  initialRuns = [],
  onSelectRun,
}: AuditLogProps) {
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);

  const handleSelectRun = (runId: string) => {
    setSelectedRunId(runId);
    if (onSelectRun) {
      onSelectRun(runId);
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-2 py-1 rounded-full text-xs font-medium";
    switch (status) {
      case "PASS":
        return `${baseClasses} bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300`;
      case "WARN":
        return `${baseClasses} bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300`;
      case "FAIL":
        return `${baseClasses} bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300`;
      default:
        return `${baseClasses} bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-300`;
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  };

  const getRelativeTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days}d ago`;
    if (hours > 0) return `${hours}h ago`;
    if (minutes > 0) return `${minutes}m ago`;
    return "Just now";
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold">Audit Log</h2>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {initialRuns.length} recent runs
        </span>
      </div>

      {/* Audit Runs List */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {initialRuns.map((run) => (
          <button
            key={run.id}
            onClick={() => handleSelectRun(run.id)}
            className={`w-full p-4 text-left transition-colors ${
              selectedRunId === run.id
                ? "bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500"
                : "hover:bg-gray-50 dark:hover:bg-gray-900"
            }`}
          >
            <div className="flex items-start justify-between mb-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm font-mono text-gray-500 dark:text-gray-400">
                    {run.id.substring(0, 8)}
                  </span>
                  <span className={getStatusBadge(run.overall_status)}>
                    {run.overall_status}
                  </span>
                  {run.anomalies_count !== undefined && run.anomalies_count > 0 && (
                    <span className="px-2 py-1 rounded-full text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                      {run.anomalies_count} anomal{run.anomalies_count > 1 ? 'ies' : 'y'}
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <span>{formatDate(run.run_at)}</span>
                  <span className="text-gray-400 dark:text-gray-600">•</span>
                  <span>{getRelativeTime(run.run_at)}</span>
                </div>
                {run.note && (
                  <p className="mt-2 text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                    {run.note}
                  </p>
                )}
              </div>
            </div>

            {/* Stats Grid */}
            <div className="grid grid-cols-4 gap-3">
              <div className="text-center p-2 bg-gray-50 dark:bg-gray-900 rounded">
                <div className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                  {run.total_checks}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Total
                </div>
              </div>
              <div className="text-center p-2 bg-green-50 dark:bg-green-900/20 rounded">
                <div className="text-lg font-semibold text-green-700 dark:text-green-300">
                  {run.passed}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Passed
                </div>
              </div>
              <div className="text-center p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded">
                <div className="text-lg font-semibold text-yellow-700 dark:text-yellow-300">
                  {run.warnings}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Warnings
                </div>
              </div>
              <div className="text-center p-2 bg-red-50 dark:bg-red-900/20 rounded">
                <div className="text-lg font-semibold text-red-700 dark:text-red-300">
                  {run.failed}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">
                  Failed
                </div>
              </div>
            </div>
          </button>
        ))}
      </div>

      {/* Empty State */}
      {initialRuns.length === 0 && (
        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
          <svg
            className="w-12 h-12 mx-auto mb-4 opacity-50"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
            />
          </svg>
          <p className="mb-2">No audit runs found</p>
          <p className="text-sm">
            Run validation checks to create your first audit trail.
          </p>
        </div>
      )}
    </div>
  );
}
