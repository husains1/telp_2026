# 🏰 Fortress — the bank that assumes the attacker has AI too

> **Fortress is the bank built for the era when your attacker has AI too — starting with an AI that catches the scams traditional fraud controls are blind to.**

For a century, banks won because they were harder to fool than you are. Frontier
AI is breaking that: cloned voices that beat phone auth, deepfakes that clear
video KYC, scams run at machine scale. Every incumbent still defends the
perimeter against last decade's attacker. **Fortress assumes the attacker
already has the same models we do — and makes security the product, not the
fine print.**

Our wedge is the threat the old stack is blind to: **Authorised Push Payment
(APP) fraud** — where the customer is tricked into sending the money *themselves*,
and every deterministic signal says the transaction is legitimate. The real
signal lives in unstructured human behaviour, which is exactly what an LLM can
read and a rules engine can't.

This repo is the **functional reference build** of the **Scam Interceptor** —
the "second pair of eyes" that opens when money moves.

---

## What it does

1. **List accounts & balances** — a normal-looking online bank.
2. **Make a payment** — to existing or new payees.
3. **The Scam Interceptor** — a cheap rules layer decides *whether* a payment
   needs a closer look. When it fires, an adaptive conversation (grounded in
   real APP-scam patterns) reads the customer's answers and **holds the payment
   before the money is gone** — it never blocks outright.
4. **Immutable, hash-chained audit trail** — every decision is logged and
   tamper-evident: the "proof of an effective warning" that UK reimbursement
   rules require.

## Quickstart

```bash
npm run install:all   # installs root, server, and web deps
npm run dev           # starts API (:4000) and web (:5173) together
```

Open **http://localhost:5173**, click **▶ Load demo scenario**, then **Send**.

## The 4-minute demo

See [`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md). The headline: *the screen
visibly stops the money in real time*, and governance is the hero.

## Architecture

A small TypeScript monorepo. See [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md).

```
server/   Node + Express API · in-memory data · scam engine · audit chain
web/      React + Vite SPA · accounts, payment flow, intervention, audit trail
docs/     architecture, demo script, pitch, regulatory mapping
```

The scam engine is **deterministic and reliable for the demo**, but built behind
an analyst interface so a real Claude API call drops in with a one-line change
(`RuleBasedAnalyzer` → `LLMAnalyzer`).

## Want to contribute?

This is a 5-person build with clear module ownership mapped to areas of
expertise. See [`CONTRIBUTING.md`](CONTRIBUTING.md).

---

*Built for The Build Sprint. Concept A — Scam Interceptor. Build boldly, govern wisely.*
