// The interception engine: a cheap rules layer that decides WHETHER a payment
// needs a closer look, and an adaptive conversation that decides WHAT to do.
//
// Design principle (the governance beat): we never auto-decline. The engine
// holds and escalates, preserving customer agency and creating an audit trail.
// False positives erode trust, so the worst case is a short conversation.

import type { Account, Payee, Payment } from "../types.js";
import { record } from "../audit.js";
import { RuleBasedAnalyzer, type ScamAnalyzer } from "./analyzer.js";
import { HOLD_THRESHOLD } from "./patterns.js";

// Swap to LLMAnalyzer here to use a real model — nothing else changes.
const analyst: ScamAnalyzer = new RuleBasedAnalyzer();

// ---- Step 1: the rules trigger -------------------------------------------

export interface TriggerResult {
  intervene: boolean;
  score: number;
  reasons: string[];
}

const NEW_PAYEE_AMOUNT_THRESHOLD = 500_00; // £500

/** Deterministic, structured-data checks. Cheap and runs on every payment. */
export function assessPayment(
  payment: Payment,
  account: Account,
  payee: Payee,
  advisories: { name: string }[] = []
): TriggerResult {
  const reasons: string[] = [];
  let score = 0;

  // Entity-scoped threat advisory overrides a payee's trusted status.
  if (advisories.length) {
    reasons.push(`Trusted payee under active threat advisory — ${advisories[0].name}`);
  }

  if (payee.isNew) {
    score += 30;
    reasons.push("First payment to a brand-new payee");
  }
  if (payment.amountPence >= NEW_PAYEE_AMOUNT_THRESHOLD) {
    score += 20;
    reasons.push("Large amount (≥ £500)");
  }
  if (payment.markedUrgent) {
    score += 20;
    reasons.push("Customer marked the payment urgent");
  }
  if (payment.amountPence > account.balancePence * 0.5) {
    score += 15;
    reasons.push("Payment is more than half the account balance");
  }
  if (/safe|secure|protect|hold/i.test(payee.name)) {
    score += 25;
    reasons.push("Payee name resembles a 'safe account' lure");
  }

  return { intervene: score >= 40 || advisories.length > 0, score, reasons };
}

// ---- Step 2: the adaptive conversation -----------------------------------

export interface Question {
  id: string;
  text: string;
  type: "yesno" | "choice" | "freetext";
  options?: { value: string; label: string }[];
}

interface Session {
  id: string;
  paymentId: string;
  scamScore: number;
  step: number;
  finished: boolean;
  flow: Question[];
  holdThreshold: number;
}

/** Scoped, entity-specific conversation used when an advisory targets a payee. */
function advisoryFlow(payeeName: string, advName: string): Question[] {
  return [
    {
      id: "prompted",
      text: `There's currently a surge in scams impersonating ${payeeName} (${advName}). I know this payment normally just goes through — so quickly: are you paying your usual bill, or did you get a call, text or email prompting this payment?`,
      type: "choice",
      options: [
        { value: "normal_bill", label: "Just my normal bill — like every month" },
        { value: "arrears_prompt", label: "I got a text saying my account is in arrears" },
      ],
    },
  ];
}

const sessions = new Map<string, Session>();

const QUESTION_FLOW: Question[] = [
  {
    id: "contacted",
    text: "Before we move this money — did someone recently contact you and tell you to make this payment, or help you set it up?",
    type: "choice",
    options: [
      { value: "contacted_yes", label: "Yes, someone contacted me" },
      { value: "contacted_no", label: "No, this was entirely my idea" },
    ],
  },
  {
    id: "who",
    text: "Who did they say they were?",
    type: "choice",
    options: [
      { value: "who_bank_police", label: "My bank, the police, or HMRC" },
      { value: "who_investment", label: "An investment or crypto company" },
      { value: "who_online", label: "Someone I met online" },
      { value: "who_seller", label: "A seller or marketplace" },
      { value: "who_boss", label: "My employer or a supplier" },
    ],
  },
  {
    id: "safe_account",
    text: "Were you told this is a 'safe account', or that moving the money will protect it?",
    type: "yesno",
    options: [
      { value: "safe_account_yes", label: "Yes" },
      { value: "safe_account_no", label: "No" },
    ],
  },
  {
    id: "detail",
    text: "In your own words, what did they tell you? (This helps us protect you.)",
    type: "freetext",
  },
];

export function startIntervention(
  payment: Payment,
  opts: { holdThreshold?: number; advisory?: { name: string }; payeeName?: string } = {}
): {
  interventionId: string;
  question: Question;
} {
  const id = `int_${Date.now()}`;
  const flow =
    opts.advisory && opts.payeeName
      ? advisoryFlow(opts.payeeName, opts.advisory.name)
      : QUESTION_FLOW;
  sessions.set(id, {
    id,
    paymentId: payment.id,
    scamScore: 0,
    step: 0,
    finished: false,
    flow,
    holdThreshold: opts.holdThreshold ?? HOLD_THRESHOLD,
  });
  record("ai-analyst", "intervention.opened", {
    interventionId: id,
    paymentId: payment.id,
    advisory: opts.advisory?.name ?? null,
    holdThreshold: opts.holdThreshold ?? HOLD_THRESHOLD,
  });
  return { interventionId: id, question: flow[0] };
}

export type InterventionDecision =
  | { done: false; question: Question; scamScore: number; rationale: string }
  | {
      done: true;
      outcome: "hold" | "release";
      scamScore: number;
      rationale: string;
    };

export function answerIntervention(
  interventionId: string,
  answer: { choice?: string; freeText?: string }
): InterventionDecision {
  const session = sessions.get(interventionId);
  if (!session || session.finished) {
    throw new Error("Unknown or finished intervention session");
  }

  const current = session.flow[session.step];

  // Fail-closed: if the analyst errors (e.g. a live LLM times out), we treat
  // the answer as maximally suspicious and hold. We never fail open on money.
  let analysis;
  try {
    analysis = analyst.analyze(answer);
  } catch (err) {
    record("ai-analyst", "intervention.analyst_error_fail_closed", {
      interventionId,
      error: (err as Error).message,
    });
    session.scamScore = HOLD_THRESHOLD;
    return finish(session);
  }
  session.scamScore += analysis.delta;

  record("ai-analyst", "intervention.answer_analysed", {
    interventionId,
    question: current.id,
    answer,
    delta: analysis.delta,
    runningScore: session.scamScore,
    signals: analysis.signals,
    rationale: analysis.rationale,
  });

  // Adaptive routing: if the customer says no one contacted them, we don't
  // interrogate further — agency and low friction matter. Jump to the end.
  if (current.id === "contacted" && answer.choice === "contacted_no") {
    return finish(session);
  }

  session.step += 1;
  if (session.step >= session.flow.length) {
    return finish(session);
  }

  return {
    done: false,
    question: session.flow[session.step],
    scamScore: session.scamScore,
    rationale: analysis.rationale,
  };
}

function finish(session: Session): InterventionDecision {
  session.finished = true;
  const threshold = session.holdThreshold;
  const outcome = session.scamScore >= threshold ? "hold" : "release";
  const rationale =
    outcome === "hold"
      ? `Cumulative scam score ${session.scamScore} ≥ ${threshold}. Payment held and escalated to human review — deliberately NOT auto-declined.`
      : `Cumulative scam score ${session.scamScore} < ${threshold}. No strong scam pattern; payment released.`;

  record("ai-analyst", `intervention.decision.${outcome}`, {
    interventionId: session.id,
    paymentId: session.paymentId,
    scamScore: session.scamScore,
    rationale,
  });

  return { done: true, outcome, scamScore: session.scamScore, rationale };
}

export function getPaymentIdForIntervention(interventionId: string): string | undefined {
  return sessions.get(interventionId)?.paymentId;
}
