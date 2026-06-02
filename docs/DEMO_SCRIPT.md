# 4-Minute Demo Script — "The Save"

> Concept A. Strongest emotional arc — a human gets saved on screen, and
> governance is the hero, not a footnote. Aligned with the team demo plan
> (`ewoo/telp-demo` PLAN.md).

**Headline to land:** *"Two payments. Same amount. Same new payee. A rules
engine sees one transaction twice. Vault sees a customer buying a car — and a
customer being robbed."*

---

### 0:00–0:45 — The hook (lead with the problem)

> "Last year, UK customers lost over **£450 million** to scams where *they*
> pressed send. The bank's defences don't fire — because the transaction is
> technically authorised. The customer was tricked into doing it themselves.
> Regulators now require banks to reimburse these. Nobody has solved the
> detection problem, because the signal isn't in the data — it's in the
> conversation."

Show the dashboard: **Alex Morgan, Vault Premier.** Three accounts, balances.
*It's a normal bank.*

### 0:45–1:00 — Beat 1: routine payment clears

> "Alex pays the landlord — a trusted payee, normal amount." Send → **clears
> instantly.** No friction. Vault doesn't get in the way of normal life.

### 1:00–1:45 — Beat 2: the car (the control case)

Click **▶ Beat 2: car (clears)**.
> "Now £8,000 to a brand-new payee. The rules layer flags it — new payee, large
> amount." The interceptor opens. Answer honestly: *contacted by a seller*, *not
> a safe account*, free-text *"buying a used car I found on a listing."*
> The score stays low → **payment released.**

> "That's the point everyone misses: a new £8k payee is **not** automatically
> fraud. Block it and you've broken a legitimate customer. Vault asked, listened,
> and got out of the way."

### 1:45–2:45 — Beat 3: the scam (the save)

Click **▶ Beat 3: scam (holds)**.
> "Same £8,000. Same 'new payee'. But Alex has been told by a 'fraud team' to
> move money to a **safe account**." Send → the interceptor opens.
> - *"Did someone contact you?"* → **Yes**
> - *"Who?"* → **My bank / police / HMRC**
> - *"A safe account?"* → **Yes**
> - Free-text what they were told → watch the **scam-likelihood meter** climb.

**The wow:** **🚫 We've held this payment — no money has left your account.**
Point at the balance: *still there.* The money visibly never moved.

### 2:45–3:25 — The governance beat (the hero)

> "Notice what it did **not** do. It didn't block her outright. We deliberately
> chose **friction over autonomy** — it *holds* and *explains*, preserving her
> agency, and routes to human review. We told the system **not** to auto-decline,
> because false positives erode trust faster than anything. And it **fails
> closed**: if the AI errors, the payment holds — we never fail open on money."
>
> "Every step — the trigger, every answer, the decision — is written to an
> **immutable, hash-chained audit trail**." Point at the **🔒 chain verified**
> badge. "That's the *proof of an effective warning* the reimbursement rules
> require. Tamper with one row and the whole chain breaks."

### 3:25–4:00 — Close (expertise + what's next)

> "Our edge is domain judgement: APP fraud is a *behavioural* problem, so we put
> the AI exactly where the old stack is blind — at the point of payment, reading
> the human, not the transaction. We kept the AI on a short leash: it reads
> answers; *we* own the thresholds, the no-auto-decline rule, and fail-closed."
>
> "Next: a confidence score, tiered intervention, per-user risk policies — and
> swap the deterministic analyst for a live model behind the same interface."

---

## Handoffs (5 presenters)

- **Risk** — opens with the hook & the £450m problem.
- **Product** — drives the screen through Beats 1–3.
- **AI/Tech** — explains the two-stage engine at the "wow".
- **Compliance** — owns the governance beat & audit trail.
- **Operations** — closes on human review + what's next.

## If something breaks

Click a demo-beat button to reset to seed, then re-run. The engine is
deterministic — the same inputs always produce the same outcome. No network or
API key required.
