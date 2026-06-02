# 🛡️ Vault — security is the product

> **Vault is the bank built for the era when your attacker has AI too — starting
> with an AI that catches the scams traditional fraud controls are blind to.**

For a century, banks won because they were harder to fool than you are. Frontier
AI is breaking that: cloned voices that beat phone auth, deepfakes that clear
video KYC, scams run at machine scale. Every incumbent still defends the
perimeter against last decade's attacker. **Vault assumes the attacker already
has the same models we do — and makes security the product, not the fine print.**

Our wedge is the threat the old stack is blind to: **Authorised Push Payment
(APP) fraud** — where the customer is tricked into sending the money *themselves*,
and every deterministic signal says the transaction is legitimate. The real
signal lives in unstructured human behaviour, which is exactly what an LLM can
read and a rules engine can't.

This repo is the **functional reference build** — the working counterpart to the
team's demo. It implements the **Scam Interceptor**: the "second pair of eyes"
that opens when money moves.

> **Naming:** the founding thesis is "Fortress — assume the attacker has AI too";
> the product the team is shipping is **Vault**. We use Vault throughout to stay
> consistent with the team demo (`ewoo/telp-demo`).

---

## The headline

> **Two payments. Same amount. Same new payee. A rules engine sees one
> transaction twice. Vault sees a customer buying a car — and a customer being
> robbed.**

## What it does

1. **List accounts & balances** — a normal-looking online bank (Alex Morgan, Vault Premier).
2. **Make a payment** — to trusted or new payees.
3. **The Scam Interceptor** — a cheap rules layer decides *whether* a payment
   needs a closer look. When it fires, an adaptive conversation (grounded in real
   APP-scam patterns) reads the customer's answers and **holds the payment before
   the money is gone** — it never blocks outright, and it **fails closed** (an AI
   error holds, never releases).
4. **Immutable, hash-chained audit trail** — every decision is logged and
   tamper-evident: the "proof of an effective warning" UK reimbursement rules require.

## Quickstart

```bash
npm run install:all   # installs root, server, and web deps
npm run dev           # starts API (:4000) and web (:5173) together
```

Open **http://localhost:5173**. Use the header buttons to load a demo beat:

- **▶ Beat 2: car (clears)** — £8,000 to a new car dealer → intervenes, then releases.
- **▶ Beat 3: scam (holds)** — £8,000 to a "safe account" → intervenes, then **holds**.

(A normal payment to a trusted payee — e.g. the landlord — clears with no friction.)

## The 4-minute demo

See [`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md). The headline: *the screen
visibly stops the money in real time*, and governance is the hero.

## Docs

- [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) — how it's built
- [`docs/DEMO_SCRIPT.md`](docs/DEMO_SCRIPT.md) — the 4-minute narrative
- [`docs/PITCH.md`](docs/PITCH.md) — the pitch & concept ranking
- [`docs/REGULATORY.md`](docs/REGULATORY.md) — risk & governance mapping
- [`docs/TEAM_ALIGNMENT.md`](docs/TEAM_ALIGNMENT.md) — how this build maps to the team demo plan

## Want to contribute?

5-person build with clear module ownership mapped to areas of expertise. See
[`CONTRIBUTING.md`](CONTRIBUTING.md).

---

*Built for The Build Sprint. Concept A — Scam Interceptor. Build boldly, govern wisely.*
