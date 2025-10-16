"use client";

import { useState, useEffect } from "react";
import { getCurrentValidation, getAuditRuns } from "@/lib/actions/audit";
import ValidationSummary from "@/app/components/ValidationSummary";
import AuditLog from "@/app/components/AuditLog";
import AuditSnapshot from "@/app/components/AuditSnapshot";
import type { ValidationCheck, AuditRun } from "@/lib/actions/audit";

export default function AuditPage() {
  const [checks, setChecks] = useState<ValidationCheck[]>([]);
  const [summary, setSummary] = useState<{
    total: number;
    passed: number;
    failed: number;
    warnings: number;
  } | undefined>(undefined);
  const [runs, setRuns] = useState<AuditRun[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);

      // Fetch current validation and recent audit runs in parallel
      const [validationResult, runsResult] = await Promise.all([
        getCurrentValidation(),
        getAuditRuns(20),
      ]);

      if (validationResult.success && validationResult.checks) {
        setChecks(validationResult.checks);
        setSummary(validationResult.summary);
      }

      if (runsResult.success && runsResult.runs) {
        setRuns(runsResult.runs);
      }

      setLoading(false);
    };

    fetchData();
  }, []);

  const handleSelectRun = (runId: string) => {
    setSelectedRunId(runId);
  };

  const handleValidationComplete = async () => {
    // Refresh audit runs after validation
    const runsResult = await getAuditRuns(20);
    if (runsResult.success && runsResult.runs) {
      setRuns(runsResult.runs);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen p-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-center h-64">
            <svg
              className="animate-spin h-12 w-12 text-blue-600"
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
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-8 bg-gray-50 dark:bg-gray-950">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-bold mb-2">Audit & Compliance</h1>
              <p className="text-gray-600 dark:text-gray-400">
                Automated validation checks and audit trail for financial data
              </p>
            </div>
            <a
              href="/"
              className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg font-medium transition-colors"
            >
              ← Back to Dashboard
            </a>
          </div>
        </div>

        {/* Validation Summary - Full Width */}
        <div className="mb-8">
          <ValidationSummary
            initialChecks={checks}
            initialSummary={summary}
          />
        </div>

        {/* Audit Log and Snapshot - Side by Side */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <AuditLog initialRuns={runs} onSelectRun={handleSelectRun} />
          <AuditSnapshot auditRunId={selectedRunId} />
        </div>
      </div>
    </div>
  );
}
