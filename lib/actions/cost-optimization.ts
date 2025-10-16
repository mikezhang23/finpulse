"use server";

import { createServiceRoleClient } from "@/lib/supabase/server";

// ============================================================================
// TYPE DEFINITIONS
// ============================================================================

export interface CostTrend {
  date: string;
  daily_total: number;
  avg_7day: number;
  avg_30day: number;
  dod_change_pct: number | null;
  wow_change_pct: number | null;
  mom_change_pct: number | null;
  trend_direction: "increasing" | "stable" | "decreasing";
}

export interface WasteDetection {
  dept: string;
  total_cost: number;
  avg_cost: number;
  transaction_count: number;
  first_seen: string;
  last_seen: string;
  days_active: number;
  is_low_utilization: boolean;
  is_over_provisioned: boolean;
  is_stale: boolean;
  is_high_variance: boolean;
  waste_score: number;
  waste_category: string;
}

export interface SavingsOpportunity {
  dept: string;
  resource_count: number;
  current_monthly_cost: number;
  stale_resource_savings: number;
  rightsizing_savings: number;
  reserved_instance_savings: number;
  consolidation_savings: number;
  total_savings: number;
  savings_pct: number;
  primary_action: string;
  last_activity: string;
}

export interface CostOptimizationData {
  trends: CostTrend[];
  waste: WasteDetection[];
  savings: SavingsOpportunity[];
  summary: {
    total_potential_savings: number;
    total_waste_items: number;
    highest_risk_dept: string | null;
    trend_status: string;
  };
}

// ============================================================================
// MAIN ACTION: Fetch Cost Optimization Data
// ============================================================================

export async function getAwsCostOptimization(): Promise<{
  success: boolean;
  data?: CostOptimizationData;
  error?: string;
}> {
  try {
    const supabase = createServiceRoleClient();

    // Fetch data from all three views in parallel
    const [trendsResult, wasteResult, savingsResult] = await Promise.all([
      supabase
        .from("v_aws_cost_trends")
        .select("*")
        .order("date", { ascending: false })
        .limit(30),
      supabase
        .from("v_aws_waste_detection")
        .select("*")
        .order("waste_score", { ascending: false })
        .order("total_cost", { ascending: false })
        .limit(20),
      supabase
        .from("v_aws_savings_opportunities")
        .select("*")
        .order("total_savings", { ascending: false })
        .limit(10),
    ]);

    // Check for errors
    if (trendsResult.error) {
      throw new Error(`Cost Trends: ${trendsResult.error.message}`);
    }
    if (wasteResult.error) {
      throw new Error(`Waste Detection: ${wasteResult.error.message}`);
    }
    if (savingsResult.error) {
      throw new Error(`Savings Opportunities: ${savingsResult.error.message}`);
    }

    const trends = (trendsResult.data || []) as CostTrend[];
    const waste = (wasteResult.data || []) as WasteDetection[];
    const savings = (savingsResult.data || []) as SavingsOpportunity[];

    // Calculate summary metrics
    const total_potential_savings = savings.reduce(
      (sum, opp) => sum + opp.total_savings,
      0
    );

    const total_waste_items = waste.length;

    // Find department with highest waste
    const deptWasteMap = new Map<string, number>();
    waste.forEach((item) => {
      const current = deptWasteMap.get(item.dept) || 0;
      deptWasteMap.set(item.dept, current + item.waste_score);
    });
    const highest_risk_dept =
      deptWasteMap.size > 0
        ? Array.from(deptWasteMap.entries()).reduce((a, b) =>
            a[1] > b[1] ? a : b
          )[0]
        : null;

    // Determine overall trend status
    const latestTrend = trends[0];
    const trend_status = latestTrend
      ? latestTrend.trend_direction === "increasing"
        ? "Costs trending up"
        : latestTrend.trend_direction === "decreasing"
        ? "Costs trending down"
        : "Costs stable"
      : "No trend data";

    return {
      success: true,
      data: {
        trends,
        waste,
        savings,
        summary: {
          total_potential_savings,
          total_waste_items,
          highest_risk_dept,
          trend_status,
        },
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
