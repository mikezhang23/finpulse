"use server";

import { createServiceRoleClient } from "@/lib/supabase/server";
import { detectAnomalies, type Anomaly, type TimeSeriesDataPoint } from "@/lib/utils/anomaly-detection";
import { explainAnomaly } from "@/lib/actions/llm";

export interface AnomalyWithExplanation extends Anomaly {
  explanation?: string;
  explanationSource?: 'openai' | 'anthropic' | 'fallback';
}

/**
 * Fetch AWS cost time-series data and detect anomalies
 */
export async function detectAwsCostAnomalies(threshold: number = 1.5): Promise<{
  success: boolean;
  anomalies?: Anomaly[];
  error?: string;
}> {
  try {
    const supabase = createServiceRoleClient();

    // Fetch time-series data from the view
    const { data, error } = await supabase
      .from('v_aws_costs_timeseries')
      .select('date, total_cost')
      .order('date', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch time-series data: ${error.message}`);
    }

    if (!data || data.length === 0) {
      return {
        success: true,
        anomalies: [],
      };
    }

    // Transform data to TimeSeriesDataPoint format
    const timeSeriesData: TimeSeriesDataPoint[] = data.map(row => ({
      date: row.date,
      value: row.total_cost,
    }));

    // Detect anomalies using z-score algorithm
    const anomalies = detectAnomalies(timeSeriesData, threshold);

    return {
      success: true,
      anomalies,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Get an AI-powered explanation for a specific anomaly
 */
export async function getAnomalyExplanation(anomaly: Anomaly): Promise<{
  success: boolean;
  explanation?: string;
  source?: 'openai' | 'anthropic' | 'fallback';
  error?: string;
}> {
  try {
    const result = await explainAnomaly(anomaly);

    return {
      success: result.success,
      explanation: result.explanation,
      source: result.source,
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

/**
 * Get all anomalies with explanations pre-generated (for dashboard display)
 */
export async function getAnomaliesWithExplanations(threshold: number = 1.5): Promise<{
  success: boolean;
  anomalies?: AnomalyWithExplanation[];
  error?: string;
}> {
  try {
    // First detect anomalies
    const detectionResult = await detectAwsCostAnomalies(threshold);

    if (!detectionResult.success || !detectionResult.anomalies) {
      return {
        success: false,
        error: detectionResult.error || 'Failed to detect anomalies',
      };
    }

    // For each anomaly, get an explanation
    // Note: We'll only explain the top 5 most severe to avoid excessive API calls
    const topAnomalies = detectionResult.anomalies.slice(0, 5);

    const anomaliesWithExplanations: AnomalyWithExplanation[] = await Promise.all(
      topAnomalies.map(async (anomaly) => {
        const explanationResult = await getAnomalyExplanation(anomaly);

        return {
          ...anomaly,
          explanation: explanationResult.explanation,
          explanationSource: explanationResult.source,
        };
      })
    );

    // Add remaining anomalies without explanations
    const remainingAnomalies = detectionResult.anomalies.slice(5);

    return {
      success: true,
      anomalies: [...anomaliesWithExplanations, ...remainingAnomalies],
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}
