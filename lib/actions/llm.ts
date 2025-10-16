"use server";

import type { Anomaly } from "@/lib/utils/anomaly-detection";
import { getBasicExplanation } from "@/lib/utils/anomaly-detection";

/**
 * LLM Integration for Anomaly Explanations
 *
 * Supports multiple providers with graceful fallback to rule-based explanations.
 * Priority: OpenAI > Anthropic > Fallback
 */

interface LLMResponse {
  explanation: string;
  source: 'openai' | 'anthropic' | 'fallback';
  success: boolean;
}

/**
 * Call OpenAI API to explain an anomaly
 */
async function explainWithOpenAI(anomaly: Anomaly): Promise<LLMResponse> {
  const apiKey = process.env.OPENAI_API_KEY;

  if (!apiKey) {
    return {
      explanation: '',
      source: 'fallback',
      success: false,
    };
  }

  try {
    const prompt = `You are a financial analyst explaining AWS cost anomalies. Be concise and actionable.

Anomaly Details:
- Date: ${anomaly.date}
- Actual Cost: $${anomaly.value.toFixed(2)}
- Average Cost: $${anomaly.mean.toFixed(2)}
- Deviation: ${anomaly.deviationPercent.toFixed(1)}% ${anomaly.type === 'SPIKE' ? 'higher' : 'lower'}
- Severity: ${anomaly.severity}
- Z-Score: ${anomaly.zScore.toFixed(2)}

Provide a 2-3 sentence explanation covering:
1. What this anomaly means
2. Most likely causes
3. Recommended action`;

    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [
          {
            role: 'system',
            content: 'You are a helpful financial analyst specializing in cloud cost optimization.',
          },
          {
            role: 'user',
            content: prompt,
          },
        ],
        temperature: 0.7,
        max_tokens: 200,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const data = await response.json();
    const explanation = data.choices[0]?.message?.content?.trim();

    if (!explanation) {
      throw new Error('No explanation returned from OpenAI');
    }

    return {
      explanation,
      source: 'openai',
      success: true,
    };
  } catch (error) {
    console.error('OpenAI API error:', error);
    return {
      explanation: '',
      source: 'fallback',
      success: false,
    };
  }
}

/**
 * Call Anthropic (Claude) API to explain an anomaly
 */
async function explainWithAnthropic(anomaly: Anomaly): Promise<LLMResponse> {
  const apiKey = process.env.ANTHROPIC_API_KEY;

  if (!apiKey) {
    return {
      explanation: '',
      source: 'fallback',
      success: false,
    };
  }

  try {
    const prompt = `You are a financial analyst explaining AWS cost anomalies. Be concise and actionable.

Anomaly Details:
- Date: ${anomaly.date}
- Actual Cost: $${anomaly.value.toFixed(2)}
- Average Cost: $${anomaly.mean.toFixed(2)}
- Deviation: ${anomaly.deviationPercent.toFixed(1)}% ${anomaly.type === 'SPIKE' ? 'higher' : 'lower'}
- Severity: ${anomaly.severity}
- Z-Score: ${anomaly.zScore.toFixed(2)}

Provide a 2-3 sentence explanation covering:
1. What this anomaly means
2. Most likely causes
3. Recommended action`;

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-3-haiku-20240307',
        max_tokens: 200,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    });

    if (!response.ok) {
      throw new Error(`Anthropic API error: ${response.status}`);
    }

    const data = await response.json();
    const explanation = data.content[0]?.text?.trim();

    if (!explanation) {
      throw new Error('No explanation returned from Anthropic');
    }

    return {
      explanation,
      source: 'anthropic',
      success: true,
    };
  } catch (error) {
    console.error('Anthropic API error:', error);
    return {
      explanation: '',
      source: 'fallback',
      success: false,
    };
  }
}

/**
 * Get an AI-powered explanation for an anomaly, with graceful fallback
 *
 * Tries providers in order: OpenAI > Anthropic > Rule-based fallback
 */
export async function explainAnomaly(anomaly: Anomaly): Promise<LLMResponse> {
  // Try OpenAI first
  const openaiResult = await explainWithOpenAI(anomaly);
  if (openaiResult.success) {
    return openaiResult;
  }

  // Try Anthropic second
  const anthropicResult = await explainWithAnthropic(anomaly);
  if (anthropicResult.success) {
    return anthropicResult;
  }

  // Fallback to rule-based explanation
  return {
    explanation: getBasicExplanation(anomaly),
    source: 'fallback',
    success: true,
  };
}
