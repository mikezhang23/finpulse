"use client";

import { useState } from "react";
import type { Anomaly } from "@/lib/utils/anomaly-detection";
import { getAnomalyExplanation } from "@/lib/actions/anomalies";

interface AnomaliesPanelProps {
  anomalies: Anomaly[];
}

export default function AnomaliesPanel({ anomalies }: AnomaliesPanelProps) {
  const [expandedAnomaly, setExpandedAnomaly] = useState<string | null>(null);
  const [explanations, setExplanations] = useState<Record<string, { text: string; source: string; loading: boolean }>>({});

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'CRITICAL':
        return 'bg-red-100 dark:bg-red-900/20 text-red-800 dark:text-red-300 border-red-300 dark:border-red-700';
      case 'WARNING':
        return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-800 dark:text-yellow-300 border-yellow-300 dark:border-yellow-700';
      case 'INFO':
        return 'bg-blue-100 dark:bg-blue-900/20 text-blue-800 dark:text-blue-300 border-blue-300 dark:border-blue-700';
      default:
        return 'bg-gray-100 dark:bg-gray-900/20 text-gray-800 dark:text-gray-300 border-gray-300 dark:border-gray-700';
    }
  };

  const getTypeIcon = (type: string) => {
    return type === 'SPIKE' ? '↑' : '↓';
  };

  const handleExplain = async (anomaly: Anomaly) => {
    const key = anomaly.date;

    // Toggle if already expanded
    if (expandedAnomaly === key) {
      setExpandedAnomaly(null);
      return;
    }

    setExpandedAnomaly(key);

    // If already have explanation, just expand
    if (explanations[key]) {
      return;
    }

    // Set loading state
    setExplanations(prev => ({
      ...prev,
      [key]: { text: '', source: '', loading: true },
    }));

    // Fetch explanation
    const result = await getAnomalyExplanation(anomaly);

    setExplanations(prev => ({
      ...prev,
      [key]: {
        text: result.explanation || 'Failed to generate explanation',
        source: result.source || 'error',
        loading: false,
      },
    }));
  };

  if (anomalies.length === 0) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-xl font-semibold mb-4">Cost Anomalies</h2>
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          <svg
            className="w-16 h-16 mx-auto mb-4 opacity-50"
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
          <p className="text-lg font-medium">No anomalies detected</p>
          <p className="text-sm mt-1">Your AWS costs are within normal ranges</p>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <h2 className="text-xl font-semibold">Cost Anomalies</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
          {anomalies.length} unusual cost pattern{anomalies.length !== 1 ? 's' : ''} detected
        </p>
      </div>

      {/* Anomalies List */}
      <div className="divide-y divide-gray-200 dark:divide-gray-700">
        {anomalies.map((anomaly) => {
          const key = anomaly.date;
          const explanation = explanations[key];
          const isExpanded = expandedAnomaly === key;

          return (
            <div key={key} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors">
              <div className="flex items-start justify-between gap-4">
                {/* Left: Anomaly Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`inline-flex items-center px-2 py-1 rounded text-xs font-semibold border ${getSeverityColor(
                        anomaly.severity
                      )}`}
                    >
                      {anomaly.severity}
                    </span>
                    <span className="text-2xl">{getTypeIcon(anomaly.type)}</span>
                    <span className="text-sm text-gray-600 dark:text-gray-400">
                      {new Date(anomaly.date).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                        ${anomaly.value.toFixed(2)}
                      </span>
                      <span className="text-sm text-gray-500 dark:text-gray-400">
                        (avg: ${anomaly.mean.toFixed(2)})
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">
                      {Math.abs(anomaly.deviationPercent).toFixed(1)}%{' '}
                      {anomaly.type === 'SPIKE' ? 'higher' : 'lower'} than average
                      <span className="ml-2 text-xs">
                        (z-score: {anomaly.zScore.toFixed(2)})
                      </span>
                    </p>
                  </div>
                </div>

                {/* Right: Explain Button */}
                <button
                  onClick={() => handleExplain(anomaly)}
                  className="px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg text-sm font-medium transition-colors flex items-center gap-2 whitespace-nowrap"
                >
                  {explanation?.loading ? (
                    <>
                      <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
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
                      Explaining...
                    </>
                  ) : (
                    <>
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                        />
                      </svg>
                      Explain
                    </>
                  )}
                </button>
              </div>

              {/* Explanation */}
              {isExpanded && explanation && !explanation.loading && (
                <div className="mt-4 p-4 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                  <div className="flex items-start gap-2">
                    <svg
                      className="w-5 h-5 text-purple-600 dark:text-purple-400 mt-0.5 flex-shrink-0"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z"
                      />
                    </svg>
                    <div className="flex-1">
                      <p className="text-sm text-gray-700 dark:text-gray-300">
                        {explanation.text}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
                        Source: {explanation.source === 'openai' ? 'OpenAI' : explanation.source === 'anthropic' ? 'Claude' : 'Rule-based analysis'}
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
