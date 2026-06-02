// The "wow moment": when the rules engine fires, this dialog interrupts the
// payment, runs the adaptive conversation, and visibly HOLDS the money.
// It never blocks outright — it holds and hands control back to the customer.

import { useState } from "react";
import { api, fmtGBP, type Question, type Trigger, type InterventionDecision } from "../api/client.js";

interface Props {
  interventionId: string;
  paymentId: string;
  amountPence: number;
  firstQuestion: Question;
  trigger: Trigger;
  onClosed: () => void;
}

export function InterventionDialog({
  interventionId,
  paymentId,
  amountPence,
  firstQuestion,
  trigger,
  onClosed,
}: Props) {
  const [question, setQuestion] = useState<Question | null>(firstQuestion);
  const [scamScore, setScamScore] = useState(0);
  const [freeText, setFreeText] = useState("");
  const [decision, setDecision] = useState<Extract<InterventionDecision, { done: true }> | null>(null);
  const [busy, setBusy] = useState(false);

  async function send(choice?: string) {
    setBusy(true);
    try {
      const res = await api.answer(interventionId, { choice, freeText: freeText || undefined });
      setScamScore(res.scamScore);
      if (res.done) {
        setQuestion(null);
        setDecision(res);
      } else {
        setQuestion(res.question);
        setFreeText("");
      }
    } finally {
      setBusy(false);
    }
  }

  async function resolve(action: "release" | "cancel") {
    await api.resolve(paymentId, { action, actor: "customer" });
    onClosed();
  }

  const held = decision?.outcome === "hold";

  return (
    <div className="overlay">
      <div className={`intervention ${held ? "held" : ""}`}>
        <header>
          <span className="shield">🛡️</span>
          <div>
            <h2>Hold on — let's check this together</h2>
            <p className="sub">
              Fortress paused your {fmtGBP(amountPence)} payment for a moment. This takes 20 seconds
              and could save your money.
            </p>
          </div>
        </header>

        {/* Why we stepped in — explainable, not a black box */}
        <details className="why">
          <summary>Why we paused this ({trigger.score} pts)</summary>
          <ul>
            {trigger.reasons.map((r) => (
              <li key={r}>{r}</li>
            ))}
          </ul>
        </details>

        {question && (
          <div className="q">
            <p className="qtext">{question.text}</p>

            {question.type !== "freetext" && (
              <div className="options">
                {question.options?.map((o) => (
                  <button key={o.value} disabled={busy} onClick={() => send(o.value)}>
                    {o.label}
                  </button>
                ))}
              </div>
            )}

            {question.type === "freetext" && (
              <div className="freetext">
                <textarea
                  value={freeText}
                  placeholder="e.g. The bank's fraud team called and said my account isn't safe…"
                  onChange={(e) => setFreeText(e.target.value)}
                  rows={3}
                />
                <button disabled={busy || !freeText.trim()} onClick={() => send()}>
                  Continue
                </button>
              </div>
            )}
          </div>
        )}

        {decision && (
          <div className={`decision ${decision.outcome}`}>
            {held ? (
              <>
                <h3>🚫 We've held this payment</h3>
                <p>
                  Your answers match a known scam pattern. <strong>No money has left your
                  account.</strong> A real bank fraud team would never ask you to move money to a
                  "safe account." We've flagged this for human review.
                </p>
                <p className="rationale">{decision.rationale}</p>
                <div className="actions">
                  <button className="danger" onClick={() => resolve("cancel")}>
                    Cancel this payment — it was a scam
                  </button>
                  <button className="ghost" onClick={() => resolve("release")}>
                    I'm certain it's safe — release it
                  </button>
                </div>
                <p className="agency">
                  You stay in control. We hold and explain; we never block outright.
                </p>
              </>
            ) : (
              <>
                <h3>✅ All clear</h3>
                <p>Thanks — nothing about this looks like a scam. Your payment is on its way.</p>
                <p className="rationale">{decision.rationale}</p>
                <button onClick={onClosed}>Done</button>
              </>
            )}
          </div>
        )}

        <footer className="scoremeter">
          <div className="bar">
            <div className="fill" style={{ width: `${Math.min(scamScore, 100)}%` }} />
          </div>
          <span>scam-likelihood {scamScore}/100</span>
        </footer>
      </div>
    </div>
  );
}
