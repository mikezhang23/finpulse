"use client";

import { useState, useEffect } from "react";
import { getAuditSnapshots } from "@/lib/actions/audit";
import type { AuditSnapshot as AuditSnapshotType } from "@/lib/actions/audit";

interface AuditSnapshotProps {
  auditRunId: string | null;
}

export default function AuditSnapshot({ auditRunId }: AuditSnapshotProps) {
  const [snapshots, setSnapshots] = useState<AuditSnapshotType[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set()
  );

  useEffect(() => {
    if (!auditRunId) {
      setSnapshots([]);
      return;
    }

    const fetchSnapshots = async () => {
      setLoading(true);
      setError(null);

      const result = await getAuditSnapshots(auditRunId);

      setLoading(false);

      if (result.success && result.snapshots) {
        setSnapshots(result.snapshots);
        // Auto-expand all categories
        const categories = new Set(result.snapshots.map((s) => s.category));
        setExpandedCategories(categories);
      } else {
        setError(result.error || "Failed to fetch snapshots");
      }
    };

    fetchSnapshots();
  }, [auditRunId]);

  const toggleCategory = (category: string) => {
    const newExpanded = new Set(expandedCategories);
    if (newExpanded.has(category)) {
      newExpanded.delete(category);
    } else {
      newExpanded.add(category);
    }
    setExpandedCategories(newExpanded);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "PASS":
        return "text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800";
      case "WARN":
        return "text-yellow-600 dark:text-yellow-400 bg-yellow-50 dark:bg-yellow-900/20 border-yellow-200 dark:border-yellow-800";
      case "FAIL":
        return "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-800";
      default:
        return "text-gray-600 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20 border-gray-200 dark:border-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "PASS":
        return "✓";
      case "WARN":
        return "⚠";
      case "FAIL":
        return "✗";
      default:
        return "?";
    }
  };

  const groupedSnapshots = snapshots.reduce(
    (acc, snapshot) => {
      if (!acc[snapshot.category]) {
        acc[snapshot.category] = [];
      }
      acc[snapshot.category].push(snapshot);
      return acc;
    },
    {} as Record<string, AuditSnapshotType[]>
  );

  if (!auditRunId) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div className="p-6 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-xl font-semibold">Audit Snapshot</h2>
        </div>
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
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
          <p>Select an audit run to view its snapshot</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold">Audit Snapshot</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Run ID: {auditRunId.substring(0, 8)}
        </p>
      </div>

      {/* Loading State */}
      {loading && (
        <div className="p-8 text-center">
          <svg
            className="animate-spin h-8 w-8 mx-auto text-blue-600"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            />
          </svg>
          <p className="mt-4 text-gray-500 dark:text-gray-400">
            Loading snapshot...
          </p>
        </div>
      )}

      {/* Error State */}
      {error && (
        <div className="p-6 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Snapshots by Category */}
      {!loading && !error && (
        <div className="divide-y divide-gray-200 dark:divide-gray-700">
          {Object.entries(groupedSnapshots).map(
            ([category, categorySnapshots]) => (
              <div key={category}>
                {/* Category Header */}
                <button
                  onClick={() => toggleCategory(category)}
                  className="w-full flex items-center justify-between p-4 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <svg
                      className={`w-5 h-5 transition-transform ${
                        expandedCategories.has(category) ? "rotate-90" : ""
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9 5l7 7-7 7"
                      />
                    </svg>
                    <span className="font-medium text-gray-900 dark:text-gray-100">
                      {category.replace(/_/g, " ")}
                    </span>
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      ({categorySnapshots.length} checks)
                    </span>
                  </div>
                  <div className="flex gap-2">
                    {["PASS", "WARN", "FAIL"].map((status) => {
                      const count = categorySnapshots.filter(
                        (s) => s.status === status
                      ).length;
                      if (count === 0) return null;
                      return (
                        <span
                          key={status}
                          className={`px-2 py-1 rounded text-xs font-medium ${getStatusColor(
                            status
                          )}`}
                        >
                          {count} {status}
                        </span>
                      );
                    })}
                  </div>
                </button>

                {/* Category Snapshots */}
                {expandedCategories.has(category) && (
                  <div className="bg-gray-50 dark:bg-gray-900 px-4 pb-4">
                    {categorySnapshots.map((snapshot) => (
                      <div
                        key={snapshot.id}
                        className={`mt-3 p-4 rounded-lg border ${getStatusColor(
                          snapshot.status
                        )}`}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-lg font-semibold">
                                {getStatusIcon(snapshot.status)}
                              </span>
                              <span className="font-medium">
                                {snapshot.check_name}
                              </span>
                            </div>
                            <p className="text-sm mb-2">
                              {snapshot.description}
                            </p>
                            <div className="flex gap-4 text-xs">
                              <span>
                                Total: <strong>{snapshot.total}</strong>
                              </span>
                              {snapshot.failures > 0 && (
                                <span>
                                  Failures: <strong>{snapshot.failures}</strong>
                                </span>
                              )}
                              <span className="text-gray-400 dark:text-gray-600">
                                •
                              </span>
                              <span>
                                {new Date(snapshot.created_at).toLocaleString()}
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          )}
        </div>
      )}

      {/* Empty State */}
      {!loading && !error && snapshots.length === 0 && (
        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
          <p>No snapshot data found for this audit run.</p>
        </div>
      )}
    </div>
  );
}
