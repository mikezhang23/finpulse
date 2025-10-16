"use client";

import { useState } from "react";
import { runValidationChecks } from "@/lib/actions/audit";
import type { ValidationCheck } from "@/lib/actions/audit";

interface ValidationSummaryProps {
  initialChecks?: ValidationCheck[];
  initialSummary?: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
  };
}

export default function ValidationSummary({
  initialChecks = [],
  initialSummary,
}: ValidationSummaryProps) {
  const [checks, setChecks] = useState<ValidationCheck[]>(initialChecks);
  const [summary, setSummary] = useState(initialSummary);
  const [isRunning, setIsRunning] = useState(false);
  const [lastRunId, setLastRunId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [expandedCategories, setExpandedCategories] = useState<Set<string>>(
    new Set(["COMPLIANCE", "DATA_QUALITY", "DATA_COMPLETENESS"])
  );

  const handleRunValidation = async () => {
    setIsRunning(true);
    setError(null);

    const result = await runValidationChecks();

    setIsRunning(false);

    if (result.success && result.checks && result.summary) {
      setChecks(result.checks);
      setSummary(result.summary);
      setLastRunId(result.auditRunId || null);
    } else {
      setError(result.error || "Failed to run validation");
    }
  };

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

  const groupedChecks = checks.reduce(
    (acc, check) => {
      if (!acc[check.category]) {
        acc[check.category] = [];
      }
      acc[check.category].push(check);
      return acc;
    },
    {} as Record<string, ValidationCheck[]>
  );

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
        <div>
          <h2 className="text-xl font-semibold">Validation Summary</h2>
          {lastRunId && (
            <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
              Last run: {lastRunId.substring(0, 8)}
            </p>
          )}
        </div>
        <button
          onClick={handleRunValidation}
          disabled={isRunning}
          className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isRunning ? (
            <>
              <svg
                className="animate-spin h-5 w-5"
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
              Running...
            </>
          ) : (
            <>
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
              Run Validation
            </>
          )}
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="p-6 bg-red-50 dark:bg-red-900/20 border-b border-red-200 dark:border-red-800">
          <p className="text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Summary Stats */}
      {summary && (
        <div className="grid grid-cols-4 gap-4 p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900 dark:text-gray-100">
              {summary.total}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Total Checks
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600 dark:text-green-400">
              {summary.passed}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Passed
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600 dark:text-yellow-400">
              {summary.warnings}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Warnings
            </div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-red-600 dark:text-red-400">
              {summary.failed}
            </div>
            <div className="text-sm text-gray-500 dark:text-gray-400">
              Failed
            </div>
          </div>
        </div>
      )}

      {/* Validation Checks by Category */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {Object.entries(groupedChecks).map(([category, categoryChecks]) => (
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
                  ({categoryChecks.length} checks)
                </span>
              </div>
              <div className="flex gap-2">
                {["PASS", "WARN", "FAIL"].map((status) => {
                  const count = categoryChecks.filter(
                    (c) => c.status === status
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

            {/* Category Checks */}
            {expandedCategories.has(category) && (
              <div className="bg-gray-50 dark:bg-gray-900 px-4 pb-4">
                {categoryChecks.map((check) => (
                  <div
                    key={check.check_name}
                    className={`mt-3 p-4 rounded-lg border ${getStatusColor(
                      check.status
                    )}`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-lg font-semibold">
                            {getStatusIcon(check.status)}
                          </span>
                          <span className="font-medium">
                            {check.check_name}
                          </span>
                        </div>
                        <p className="text-sm mb-2">{check.description}</p>
                        <div className="flex gap-4 text-xs">
                          <span>
                            Total: <strong>{check.total}</strong>
                          </span>
                          {check.failures > 0 && (
                            <span>
                              Failures: <strong>{check.failures}</strong>
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Empty State */}
      {checks.length === 0 && (
        <div className="p-8 text-center text-gray-500 dark:text-gray-400">
          <p className="mb-4">No validation checks available.</p>
          <p className="text-sm">
            Click "Run Validation" to execute all checks.
          </p>
        </div>
      )}
    </div>
  );
}
