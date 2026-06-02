// The analyst layer: reads a customer's answer and returns scam signals.
//
// We define an interface so the deterministic engine used in the demo and a
// future LLM-backed analyst are interchangeable. The rest of the system only
// ever sees AnalysisResult — it never knows or cares which analyst produced it.

import { SIGNAL_LEXICON, SCAM_PATTERNS } from "./patterns.js";

export interface DetectedSignal {
  patternId: string;
  label: string;
  weight: number;
}

export interface AnalysisResult {
  /** Points this answer adds to the cumulative scam score. */
  delta: number;
  signals: DetectedSignal[];
  /** Plain-English reasoning, logged to the audit trail. */
  rationale: string;
}

export interface ScamAnalyzer {
  /**
   * @param choice  a structured option value, if the question offered choices
   * @param freeText the customer's own words, if any
   */
  analyze(input: { choice?: string; freeText?: string }): AnalysisResult;
}

/**
 * Deterministic analyst. Structured choices carry pre-assigned weights;
 * free text is scanned against the signal lexicon. Reliable on stage, no
 * network, no key — and fully explainable.
 */
export class RuleBasedAnalyzer implements ScamAnalyzer {
  // Weights for the known multiple-choice answers in the question flow.
  private static CHOICE_WEIGHTS: Record<string, { weight: number; pattern: string }> = {
    contacted_yes: { weight: 25, pattern: "impersonation_safe_account" },
    who_bank_police: { weight: 40, pattern: "impersonation_safe_account" },
    who_investment: { weight: 30, pattern: "investment" },
    who_online: { weight: 25, pattern: "romance" },
    who_seller: { weight: 15, pattern: "purchase" },
    who_boss: { weight: 20, pattern: "invoice_ceo" },
    safe_account_yes: { weight: 45, pattern: "impersonation_safe_account" },
    secrecy_yes: { weight: 35, pattern: "impersonation_safe_account" },
  };

  analyze(input: { choice?: string; freeText?: string }): AnalysisResult {
    const signals: DetectedSignal[] = [];
    let delta = 0;

    if (input.choice && RuleBasedAnalyzer.CHOICE_WEIGHTS[input.choice]) {
      const { weight, pattern } = RuleBasedAnalyzer.CHOICE_WEIGHTS[input.choice];
      signals.push({ patternId: pattern, label: SCAM_PATTERNS[pattern].label, weight });
      delta += weight;
    }

    if (input.freeText) {
      for (const { phrase, pattern, weight } of SIGNAL_LEXICON) {
        if (phrase.test(input.freeText)) {
          signals.push({ patternId: pattern, label: SCAM_PATTERNS[pattern].label, weight });
          delta += weight;
        }
      }
    }

    const rationale = signals.length
      ? `Detected ${signals.length} scam signal(s): ${signals
          .map((s) => s.label)
          .join("; ")}.`
      : "No scam signals detected in this answer.";

    return { delta, signals, rationale };
  }
}

/**
 * Placeholder for a Claude-backed analyst. Wire this to the Anthropic SDK to
 * read genuinely free-form answers. It returns the identical AnalysisResult
 * shape, so swapping it in is a one-line change in engine.ts.
 *
 * Intentionally not active in the demo — see docs/ARCHITECTURE.md.
 */
export class LLMAnalyzer implements ScamAnalyzer {
  analyze(_input: { choice?: string; freeText?: string }): AnalysisResult {
    throw new Error("LLMAnalyzer not configured. Use RuleBasedAnalyzer for the demo.");
  }
}
