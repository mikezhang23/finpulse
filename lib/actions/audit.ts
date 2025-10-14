"use server";

import { createServiceRoleClient } from "@/lib/supabase/server";

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

/**
 * Run validation checks and log the audit trail
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
  error?: string;
}> {
  try {
    const supabase = createServiceRoleClient();

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

    // 2. Calculate summary statistics
    const passed = checks.filter((c) => c.status === "PASS").length;
    const failed = checks.filter((c) => c.status === "FAIL").length;
    const warnings = checks.filter((c) => c.status === "WARN").length;
    const total = checks.length;

    const overallStatus = failed > 0 ? "FAIL" : warnings > 0 ? "WARN" : "PASS";

    // 3. Insert audit run record
    const { data: auditRun, error: auditError } = await supabase
      .from("audit_runs")
      .insert({
        run_at: new Date().toISOString(),
        total_checks: total,
        passed,
        failed,
        warnings,
        overall_status: overallStatus,
      })
      .select()
      .single();

    if (auditError) {
      throw new Error(`Failed to create audit run: ${auditError.message}`);
    }

    // 4. Insert snapshot records for each check
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
