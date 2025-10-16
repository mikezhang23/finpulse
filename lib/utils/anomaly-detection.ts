/**
 * Anomaly Detection using Z-Score
 *
 * A simple statistical method to detect unusual spikes or dips in time-series data.
 * Z-score measures how many standard deviations away a value is from the mean.
 */

export type AnomalyType = 'SPIKE' | 'DIP';
export type AnomalySeverity = 'CRITICAL' | 'WARNING' | 'INFO' | 'NORMAL';

export interface TimeSeriesDataPoint {
  date: string;
  value: number;
}

export interface Anomaly {
  date: string;
  value: number;
  mean: number;
  stdDev: number;
  zScore: number;
  type: AnomalyType;
  severity: AnomalySeverity;
  deviationPercent: number;
}

/**
 * Calculate mean (average) of an array of numbers
 */
function calculateMean(values: number[]): number {
  if (values.length === 0) return 0;
  const sum = values.reduce((acc, val) => acc + val, 0);
  return sum / values.length;
}

/**
 * Calculate standard deviation of an array of numbers
 */
function calculateStdDev(values: number[], mean: number): number {
  if (values.length === 0) return 0;
  const squaredDiffs = values.map(val => Math.pow(val - mean, 2));
  const avgSquaredDiff = calculateMean(squaredDiffs);
  return Math.sqrt(avgSquaredDiff);
}

/**
 * Calculate z-score for a single value
 * Z-score = (value - mean) / stdDev
 */
function calculateZScore(value: number, mean: number, stdDev: number): number {
  if (stdDev === 0) return 0;
  return (value - mean) / stdDev;
}

/**
 * Classify anomaly severity based on z-score magnitude
 */
function classifySeverity(absZScore: number): AnomalySeverity {
  if (absZScore >= 3) return 'CRITICAL';  // 99.7% confidence
  if (absZScore >= 2) return 'WARNING';   // 95% confidence
  if (absZScore >= 1.5) return 'INFO';    // Notable deviation
  return 'NORMAL';
}

/**
 * Determine anomaly type (spike or dip) based on z-score sign
 */
function determineType(zScore: number): AnomalyType {
  return zScore > 0 ? 'SPIKE' : 'DIP';
}

/**
 * Calculate deviation percentage from mean
 */
function calculateDeviationPercent(value: number, mean: number): number {
  if (mean === 0) return 0;
  return ((value - mean) / mean) * 100;
}

/**
 * Detect anomalies in time-series data using z-score method
 *
 * @param data - Array of time-series data points
 * @param threshold - Minimum |z-score| to consider as anomaly (default: 1.5)
 * @returns Array of detected anomalies, sorted by severity and date
 */
export function detectAnomalies(
  data: TimeSeriesDataPoint[],
  threshold: number = 1.5
): Anomaly[] {
  if (data.length < 3) {
    // Need at least 3 data points for meaningful statistics
    return [];
  }

  // Extract values and calculate statistics
  const values = data.map(d => d.value);
  const mean = calculateMean(values);
  const stdDev = calculateStdDev(values, mean);

  // Detect anomalies
  const anomalies: Anomaly[] = [];

  data.forEach(point => {
    const zScore = calculateZScore(point.value, mean, stdDev);
    const absZScore = Math.abs(zScore);

    // Only include if above threshold
    if (absZScore >= threshold) {
      anomalies.push({
        date: point.date,
        value: point.value,
        mean,
        stdDev,
        zScore,
        type: determineType(zScore),
        severity: classifySeverity(absZScore),
        deviationPercent: calculateDeviationPercent(point.value, mean),
      });
    }
  });

  // Sort by severity (critical first), then by absolute z-score (highest first)
  const severityOrder: Record<AnomalySeverity, number> = {
    'CRITICAL': 0,
    'WARNING': 1,
    'INFO': 2,
    'NORMAL': 3,
  };

  return anomalies.sort((a, b) => {
    const severityDiff = severityOrder[a.severity] - severityOrder[b.severity];
    if (severityDiff !== 0) return severityDiff;
    return Math.abs(b.zScore) - Math.abs(a.zScore);
  });
}

/**
 * Get a simple rule-based explanation for an anomaly (fallback when no LLM available)
 */
export function getBasicExplanation(anomaly: Anomaly): string {
  const direction = anomaly.type === 'SPIKE' ? 'spike' : 'dip';
  const percentChange = Math.abs(anomaly.deviationPercent).toFixed(1);

  let explanation = `Detected a ${anomaly.severity.toLowerCase()} ${direction} in AWS costs on ${anomaly.date}. `;
  explanation += `The cost was $${anomaly.value.toFixed(2)}, which is ${percentChange}% `;
  explanation += anomaly.type === 'SPIKE' ? 'higher' : 'lower';
  explanation += ` than the average of $${anomaly.mean.toFixed(2)}. `;

  if (anomaly.severity === 'CRITICAL') {
    explanation += 'This is a highly unusual deviation that warrants immediate investigation. ';
  } else if (anomaly.severity === 'WARNING') {
    explanation += 'This is a significant deviation that should be reviewed. ';
  } else {
    explanation += 'This is a notable deviation worth monitoring. ';
  }

  // Add common causes
  if (anomaly.type === 'SPIKE') {
    explanation += 'Common causes: increased usage, new services, misconfiguration, or unusual traffic patterns.';
  } else {
    explanation += 'Common causes: reduced usage, service shutdowns, cost optimizations, or billing adjustments.';
  }

  return explanation;
}
