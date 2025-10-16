"use server";

import { createServiceRoleClient } from "@/lib/supabase/server";
import { detectAwsCostAnomalies, getAnomalyExplanation } from "@/lib/actions/anomalies";
import type { Anomaly } from "@/lib/utils/anomaly-detection";

export interface ValidationCheck {
  check_name: string;
  category: string;
  status: "PASS" | "FAIL" | "WARN";
  failures: number;
  total: number;
  description: string;
}

export interface AuditRun {
  id: string;
  run_at: string;
  total_checks: number;
  passed: number;
  failed: number;
  warnings: number;
  overall_status: string;
  snapshot_json?: AuditSnapshotJson;
  note?: string;
  anomalies_count?: number;
}

export interface AuditSnapshot {
  id: string;
  audit_run_id: string;
  check_name: string;
  category: string;
  status: string;
  failures: number;
  total: number;
  description: string;
  created_at: string;
}

export interface AnomalyWithExplanation extends Anomaly {
  explanation?: string;
  explanationSource?: 'openai' | 'anthropic' | 'fallback';
}

export interface AuditSnapshotJson {
  timestamp: string;
  checks: ValidationCheck[];
  anomalies: AnomalyWithExplanation[];
  summary: {
    totalChecks: number;
    passed: number;
    failed: number;
    warnings: number;
    anomaliesDetected: number;
    criticalAnomalies: number;
    warningAnomalies: number;
    infoAnomalies: number;
  };
}

/**
 * Run validation checks and log the audit trail with anomaly detection
 */
export async function runValidationChecks(): Promise<{
  success: boolean;
  auditRunId?: string;
  checks?: ValidationCheck[];
  summary?: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
  };
  snapshot?: AuditSnapshotJson;
  note?: string;
  error?: string;
}> {
  try {
    const supabase = createServiceRoleClient();
    const timestamp = new Date().toISOString();

    // 1. Fetch validation checks from the view
    const { data: checks, error: checksError } = await supabase
      .from("v_validation_checks")
      .select("*");

    if (checksError) {
      throw new Error(`Failed to fetch validation checks: ${checksError.message}`);
    }

    if (!checks || checks.length === 0) {
      throw new Error("No validation checks found");
    }

    // 2. Detect anomalies with a threshold of 1.5 standard deviations
    const anomalyResult = await detectAwsCostAnomalies(1.5);
    const anomalies: AnomalyWithExplanation[] = [];

    if (anomalyResult.success && anomalyResult.anomalies) {
      // Get explanations for top 5 anomalies to avoid excessive API calls
      const topAnomalies = anomalyResult.anomalies.slice(0, 5);

      for (const anomaly of topAnomalies) {
        const explanationResult = await getAnomalyExplanation(anomaly);
        anomalies.push({
          ...anomaly,
          explanation: explanationResult.explanation,
          explanationSource: explanationResult.source,
        });
      }

      // Add remaining anomalies without explanations
      const remainingAnomalies = anomalyResult.anomalies.slice(5);
      anomalies.push(...remainingAnomalies);
    }

    // 3. Calculate summary statistics
    const passed = checks.filter((c) => c.status === "PASS").length;
    const failed = checks.filter((c) => c.status === "FAIL").length;
    const warnings = checks.filter((c) => c.status === "WARN").length;
    const total = checks.length;

    const criticalAnomalies = anomalies.filter((a) => a.severity === "CRITICAL").length;
    const warningAnomalies = anomalies.filter((a) => a.severity === "WARNING").length;
    const infoAnomalies = anomalies.filter((a) => a.severity === "INFO").length;

    const overallStatus = failed > 0 ? "FAIL" : warnings > 0 ? "WARN" : "PASS";

    // 4. Create JSON snapshot
    const snapshotJson: AuditSnapshotJson = {
      timestamp,
      checks: checks as ValidationCheck[],
      anomalies,
      summary: {
        totalChecks: total,
        passed,
        failed,
        warnings,
        anomaliesDetected: anomalies.length,
        criticalAnomalies,
        warningAnomalies,
        infoAnomalies,
      },
    };

    // 5. Generate human-readable note
    const runTime = new Date(timestamp).toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });

    let note = `Validation completed at ${runTime}. ${passed}/${total} checks passed`;
    if (failed > 0) note += `, ${failed} failed`;
    if (warnings > 0) note += `, ${warnings} warning${warnings > 1 ? 's' : ''}`;
    note += '.';

    if (anomalies.length > 0) {
      note += ` ${anomalies.length} cost anomal${anomalies.length > 1 ? 'ies' : 'y'} detected`;

      const anomalyDetails: string[] = [];
      if (criticalAnomalies > 0) anomalyDetails.push(`${criticalAnomalies} CRITICAL`);
      if (warningAnomalies > 0) anomalyDetails.push(`${warningAnomalies} WARNING`);
      if (infoAnomalies > 0) anomalyDetails.push(`${infoAnomalies} INFO`);

      if (anomalyDetails.length > 0) {
        note += `: ${anomalyDetails.join(', ')}`;
      }

      // Add details of top 2 most severe anomalies
      const topTwo = anomalies.slice(0, 2);
      if (topTwo.length > 0) {
        const details = topTwo.map(a =>
          `${a.severity} ${a.type.toLowerCase()} on ${a.date} (${a.deviationPercent > 0 ? '+' : ''}${a.deviationPercent.toFixed(1)}%)`
        ).join(', ');
        note += `. Examples: ${details}`;
      }
    }

    note += ` Overall status: ${overallStatus}.`;

    // 6. Insert audit run record with snapshot and note
    const { data: auditRun, error: auditError } = await supabase
      .from("audit_runs")
      .insert({
        run_at: timestamp,
        total_checks: total,
        passed,
        failed,
        warnings,
        overall_status: overallStatus,
        snapshot_json: snapshotJson,
        note,
        anomalies_count: anomalies.length,
      })
      .select()
      .single();

    if (auditError) {
      throw new Error(`Failed to create audit run: ${auditError.message}`);
    }

    // 7. Insert snapshot records for each check (for backward compatibility)
    const snapshots = checks.map((check) => ({
      audit_run_id: auditRun.id,
      check_name: check.check_name,
      category: check.category,
      status: check.status,
      failures: check.failures,
      total: check.total,
      description: check.description,
    }));

    const { error: snapshotError } = await supabase
      .from("audit_snapshots")
      .insert(snapshots);

    if (snapshotError) {
      throw new Error(`Failed to create snapshots: ${snapshotError.message}`);
    }

    return {
      success: true,
      auditRunId: auditRun.id,
      checks: checks as ValidationCheck[],
      summary: {
        total,
        passed,
        failed,
        warnings,
      },
      snapshot: snapshotJson,
      note,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Get recent audit runs
 */
export async function getAuditRuns(limit = 10): Promise<{
  success: boolean;
  runs?: AuditRun[];
  error?: string;
}> {
  try {
    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from("audit_runs")
      .select("*")
      .order("run_at", { ascending: false })
      .limit(limit);

    if (error) {
      throw new Error(`Failed to fetch audit runs: ${error.message}`);
    }

    return {
      success: true,
      runs: data as AuditRun[],
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Get snapshots for a specific audit run
 */
export async function getAuditSnapshots(auditRunId: string): Promise<{
  success: boolean;
  snapshots?: AuditSnapshot[];
  error?: string;
}> {
  try {
    const supabase = createServiceRoleClient();

    const { data, error } = await supabase
      .from("audit_snapshots")
      .select("*")
      .eq("audit_run_id", auditRunId)
      .order("category", { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch snapshots: ${error.message}`);
    }

    return {
      success: true,
      snapshots: data as AuditSnapshot[],
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Get current validation status without logging
 */
export async function getCurrentValidation(): Promise<{
  success: boolean;
  checks?: ValidationCheck[];
  summary?: {
    total: number;
    passed: number;
    failed: number;
    warnings: number;
  };
  error?: string;
}> {
  try {
    const supabase = createServiceRoleClient();

    const { data: checks, error } = await supabase
      .from("v_validation_checks")
      .select("*");

    if (error) {
      throw new Error(`Failed to fetch validation checks: ${error.message}`);
    }

    if (!checks || checks.length === 0) {
      throw new Error("No validation checks found");
    }

    const passed = checks.filter((c) => c.status === "PASS").length;
    const failed = checks.filter((c) => c.status === "FAIL").length;
    const warnings = checks.filter((c) => c.status === "WARN").length;
    const total = checks.length;

    return {
      success: true,
      checks: checks as ValidationCheck[],
      summary: {
        total,
        passed,
        failed,
        warnings,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
