// HTTP surface for the Fortress demo. Thin controllers — all the interesting
// logic lives in the scam engine, the store, and the audit log.

import { Router } from "express";
import {
  accounts,
  payees,
  payments,
  getAccount,
  getPayee,
  addPayee,
  debit,
  resetDemo,
  profile,
  getTransactions,
  addTransaction,
  getThreats,
  posture,
  advisoriesTargeting,
  toggleThreat,
} from "../data/store.js";
import { getTrail, verifyChain, record } from "../audit.js";
import {
  assessPayment,
  startIntervention,
  answerIntervention,
  getPaymentIdForIntervention,
} from "../scam/engine.js";
import type { Payment } from "../types.js";

export const api = Router();

// ---- Accounts -------------------------------------------------------------
api.get("/profile", (_req, res) => res.json(profile));
api.get("/accounts", (_req, res) => res.json(accounts));
api.get("/payees", (_req, res) => res.json(payees));
api.get("/transactions", (req, res) =>
  res.json(getTransactions(req.query.accountId as string | undefined))
);

// Record a completed payment in the account's transaction history.
function recordTxn(payment: Payment): void {
  const payee = getPayee(payment.payeeId);
  const desc = (payee?.name ?? "Payment") + (payment.reference ? ` — ${payment.reference}` : "");
  addTransaction(payment.fromAccountId, desc, -payment.amountPence);
}

api.post("/payees", (req, res) => {
  const { name, sortCode, accountNumber } = req.body ?? {};
  if (!name || !sortCode || !accountNumber) {
    return res.status(400).json({ error: "name, sortCode, accountNumber required" });
  }
  const payee = addPayee({ name, sortCode, accountNumber });
  record("customer", "payee.added", { payeeId: payee.id, name });
  res.status(201).json(payee);
});

// ---- Payments -------------------------------------------------------------
// Creating a payment runs the rules trigger. If it fires, we open an
// intervention instead of moving the money.
api.post("/payments", (req, res) => {
  const { fromAccountId, payeeId, amountPence, reference, markedUrgent } = req.body ?? {};
  const account = getAccount(fromAccountId);
  const payee = getPayee(payeeId);
  if (!account || !payee) {
    return res.status(400).json({ error: "Unknown account or payee" });
  }
  if (typeof amountPence !== "number" || amountPence <= 0) {
    return res.status(400).json({ error: "amountPence must be a positive number" });
  }

  const payment: Payment = {
    id: `pay_${Date.now()}`,
    fromAccountId,
    payeeId,
    amountPence,
    reference: reference ?? "",
    markedUrgent: !!markedUrgent,
    status: "cleared",
    createdAt: new Date().toISOString(),
  };
  payments.push(payment);

  record("customer", "payment.initiated", {
    paymentId: payment.id,
    payeeId,
    amountPence,
    markedUrgent: payment.markedUrgent,
  });

  const advisories = advisoriesTargeting(payee.name);
  const currentPosture = posture();
  const trigger = assessPayment(payment, account, payee, advisories);
  record("rules-engine", "payment.assessed", {
    paymentId: payment.id,
    triggerScore: trigger.score,
    intervene: trigger.intervene,
    reasons: trigger.reasons,
    posture: currentPosture,
    advisory: advisories[0]?.id ?? null,
  });

  if (trigger.intervene) {
    payment.status = "review_required";
    const holdThreshold = currentPosture === "LOCKDOWN" ? 45 : currentPosture === "HEIGHTENED" ? 55 : 70;
    const advisory = advisories[0];
    const { interventionId, question } = startIntervention(payment, {
      holdThreshold,
      advisory: advisory ? { name: advisory.name } : undefined,
      payeeName: payee.name,
    });
    return res.json({
      payment,
      intervention: { interventionId, question, trigger },
    });
  }

  // Cleared straight through.
  debit(account.id, amountPence);
  recordTxn(payment);
  record("rules-engine", "payment.cleared", { paymentId: payment.id });
  res.json({ payment, intervention: null });
});

// ---- Intervention conversation -------------------------------------------
api.post("/interventions/:id/answer", (req, res) => {
  const { choice, freeText } = req.body ?? {};
  try {
    const decision = answerIntervention(req.params.id, { choice, freeText });
    if (decision.done) {
      const paymentId = getPaymentIdForIntervention(req.params.id);
      const payment = payments.find((p) => p.id === paymentId);
      if (payment) {
        if (decision.outcome === "hold") {
          payment.status = "held";
        } else {
          payment.status = "cleared";
          debit(payment.fromAccountId, payment.amountPence);
          recordTxn(payment);
        }
      }
    }
    res.json(decision);
  } catch (e) {
    res.status(400).json({ error: (e as Error).message });
  }
});

// Customer or ops acts on a held payment (the governance, human-in-the-loop step).
api.post("/payments/:id/resolve", (req, res) => {
  const { action, actor } = req.body ?? {}; // action: "release" | "cancel"
  const payment = payments.find((p) => p.id === req.params.id);
  if (!payment) return res.status(404).json({ error: "Payment not found" });

  if (action === "release") {
    payment.status = "released";
    debit(payment.fromAccountId, payment.amountPence);
    recordTxn(payment);
    record(actor ?? "ops-review", "payment.released_after_hold", { paymentId: payment.id });
  } else {
    payment.status = "cancelled";
    record(actor ?? "customer", "payment.cancelled_after_warning", { paymentId: payment.id });
  }
  res.json(payment);
});

// ---- Audit trail ----------------------------------------------------------
api.get("/audit", (_req, res) => {
  res.json({ entries: getTrail(), integrity: verifyChain() });
});

// ---- Security / fraud center ---------------------------------------------
// All payments, newest first, with payee names resolved — powers the
// "flagged & held payments" list in the Security Center.
api.get("/payments", (_req, res) => {
  const list = [...payments].reverse().map((p) => ({
    id: p.id,
    payeeName: getPayee(p.payeeId)?.name ?? p.payeeId,
    amountPence: p.amountPence,
    status: p.status,
    reference: p.reference,
    createdAt: p.createdAt,
  }));
  res.json(list);
});

api.post("/fraud/report", (req, res) => {
  const { paymentId } = req.body ?? {};
  const payment = payments.find((p) => p.id === paymentId);
  if (payment) payment.status = "cancelled";
  record("customer", "fraud.reported", { paymentId: paymentId ?? null });
  res.json({ ok: true });
});

// ---- Threat intelligence / Security Operations ---------------------------
api.get("/threats", (_req, res) => {
  res.json({ threats: getThreats(), posture: posture() });
});

api.post("/threats/:id/toggle", (req, res) => {
  const t = toggleThreat(req.params.id);
  if (!t) return res.status(404).json({ error: "Unknown threat" });
  record("ops-review", t.active ? "threat.activated" : "threat.stood_down", { id: t.id, name: t.name });
  record("ops-review", "posture.changed", { posture: posture() });
  res.json({ threats: getThreats(), posture: posture() });
});

// ---- Demo control ---------------------------------------------------------
api.post("/demo/reset", (_req, res) => {
  resetDemo();
  record("ops-review", "demo.reset", {});
  res.json({ ok: true });
});
