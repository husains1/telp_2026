# 4-Minute Demo Script — "The Save"

> Concept A. Strongest emotional arc — a human gets saved on screen, and
> governance is the hero, not a footnote.

**Setup before you start:** open the app, click **▶ Load demo scenario** once to
seed Sarah's situation. Have the audit panel visible on the right.

---

### 0:00–0:45 — The hook (lead with the problem)

> "Last year, UK customers lost over **£450 million** to scams where *they*
> pressed send. The bank's defences don't fire — because the transaction is
> technically authorised. The customer was tricked into doing it themselves.
> Regulators now require banks to reimburse these. Nobody has solved the
> detection problem, because the signal isn't in the data — it's in the
> conversation."

### 0:45–2:30 — The flow (show, don't tell)

> "Meet Sarah. Someone claiming to be her bank's fraud team told her to move
> £4,000 to a 'safe account'. She's mid-scam, right now."

1. Point out the accounts and balance — *it's a normal bank.*
2. Show the payment already filled: new payee **"Safe Account"**, **£4,000**,
   marked **urgent**. Click **Send**.
3. **The app interrupts.** Show the "Why we paused this" reasons — new payee,
   large amount, urgent, safe-account name.
4. Walk through the questions:
   - *"Did someone contact you and tell you to make this payment?"* → **Yes**
   - *"Who did they say they were?"* → **My bank / police / HMRC**
   - *"Were you told this is a safe account?"* → **Yes**
   - Free-text: type what the "bank" told her → watch the **scam-likelihood meter** climb.
5. **The wow:** the screen shows **🚫 We've held this payment — no money has left
   your account.** Point at the savings balance: *still £12,500.* The money
   visibly never moved.

### 2:30–3:15 — The governance beat (the hero)

> "Notice what it did **not** do. It didn't block her outright. We deliberately
> chose **friction over autonomy** — it *holds* and *explains*, preserving her
> agency, and routes to human review. We told the system **not** to auto-decline,
> because false positives erode trust faster than anything."
>
> "And every step — the trigger, every answer, the decision — is written to an
> **immutable, hash-chained audit trail**." Point at the live panel and the
> **🔒 chain verified** badge. "That's the *proof of an effective warning* the
> reimbursement rules require. Tamper with one row and the whole chain breaks."

### 3:15–4:00 — Close (expertise + what's next)

> "Our edge is domain judgement: we know APP fraud is a *behavioural* problem, so
> we put the AI exactly where the old stack is blind — at the point of payment,
> reading the human, not the transaction. We kept the AI on a short leash: it
> reads answers; *we* own the thresholds and the no-auto-decline rule."
>
> "Next we'd add a confidence score, tiered intervention, and per-user risk
> policies — and swap the deterministic analyst for a live model behind the same
> interface."

---

## Handoffs (5 presenters)

- **Risk** — opens with the hook & the £450m problem.
- **Product** — drives the screen through the flow.
- **AI/Tech** — explains the two-stage engine at the "wow".
- **Compliance** — owns the governance beat & audit trail.
- **Operations** — closes on human review + what's next.

## If something breaks

Click **▶ Load demo scenario** to reset, then re-run. The engine is deterministic
— the same inputs always produce the hold. No network or API key required.
