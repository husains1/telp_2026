// Knowledge base of Authorised Push Payment (APP) scam patterns.
//
// These are the real typologies the UK regulator (PSR) and UK Finance track.
// The rules engine and the analyst both read from this single source so that
// "what we look for" is explainable to a regulator in one place.

export interface ScamPattern {
  id: string;
  label: string;
  /** Plain-English description shown in the audit trail. */
  description: string;
}

export const SCAM_PATTERNS: Record<string, ScamPattern> = {
  impersonation_safe_account: {
    id: "impersonation_safe_account",
    label: "Bank/police impersonation — 'safe account'",
    description:
      "Customer told by a 'bank' or 'police' to move money to a safe account. No legitimate institution ever asks this.",
  },
  investment: {
    id: "investment",
    label: "Investment / crypto scam",
    description:
      "Pressure to move money into a high-return investment or crypto platform, often time-limited.",
  },
  purchase: {
    id: "purchase",
    label: "Purchase scam",
    description:
      "Payment for goods/services that don't exist, often from a marketplace listing.",
  },
  romance: {
    id: "romance",
    label: "Romance scam",
    description: "Payment to someone met online who is in sudden need.",
  },
  invoice_ceo: {
    id: "invoice_ceo",
    label: "Invoice / CEO fraud",
    description:
      "Changed bank details on an invoice, or an 'urgent' request from a boss/supplier.",
  },
};

/**
 * Signal lexicon for reading free-text answers. Each phrase maps to a pattern
 * and a weight. This is deliberately simple and inspectable — when an LLM
 * analyst is plugged in, it returns the same {pattern, weight} shape so the
 * downstream scoring and audit logic never changes.
 */
export const SIGNAL_LEXICON: { phrase: RegExp; pattern: string; weight: number }[] = [
  { phrase: /safe account/i, pattern: "impersonation_safe_account", weight: 45 },
  { phrase: /\bbank\b.*(told|asked|said|called)/i, pattern: "impersonation_safe_account", weight: 30 },
  { phrase: /(fraud team|security team|police|hmrc|tax)/i, pattern: "impersonation_safe_account", weight: 25 },
  { phrase: /(protect|move).*(money|funds|savings)/i, pattern: "impersonation_safe_account", weight: 20 },
  { phrase: /(invest|crypto|bitcoin|trading|returns?)/i, pattern: "investment", weight: 30 },
  { phrase: /(don'?t tell|keep.*(secret|private)|not mention)/i, pattern: "impersonation_safe_account", weight: 35 },
  { phrase: /(urgent|immediately|right now|act fast|deadline)/i, pattern: "impersonation_safe_account", weight: 15 },
  { phrase: /(met (him|her|them) online|dating|never met)/i, pattern: "romance", weight: 30 },
  { phrase: /(marketplace|facebook|ebay|gumtree|listing|deposit)/i, pattern: "purchase", weight: 20 },
  { phrase: /(invoice|supplier|new bank details|changed.*details)/i, pattern: "invoice_ceo", weight: 25 },
];

/** Score above which we hold and escalate rather than release. */
export const HOLD_THRESHOLD = 60;
