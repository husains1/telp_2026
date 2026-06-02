# Risk, Governance & Regulatory Mapping

The judges score **Risk & Governance Awareness** at 25/100. This is where our
domain expertise shows. Below is how the design maps to real obligations and risks.

## The problem we target

**Authorised Push Payment (APP) fraud** — the customer is socially engineered
into authorising the payment themselves. Traditional fraud controls (rules on
structured transaction data) are blind to it because, by every structured
signal, the payment is legitimate.

## Regulatory hooks (UK context)

| Requirement | How Fortress addresses it |
|---|---|
| **PSR mandatory APP reimbursement** (2024) — banks must reimburse most APP scam victims, and must show whether an *effective warning* was given | The interception conversation **is** the effective warning; the hash-chained audit trail is the evidence it was delivered and acted on |
| **FCA Consumer Duty** — avoid foreseeable harm, support customers | We *hold and explain* in plain English rather than silently failing or blocking; the customer keeps agency |
| **Contingent Reimbursement Model** — proportionate, customer-centric warnings | Warnings are contextual and adaptive, not generic boilerplate |
| **Auditability / SM&CR accountability** | Every decision (rules trigger, each answer, final outcome) is logged with actor, timestamp, and a tamper-evident hash |

## Key risks we identified and addressed

- **False positives erode trust** → we *never auto-decline*; worst case is a
  20-second conversation. Friction over autonomy, by design.
- **Over-blocking / loss of agency** → the customer can always release a held
  payment; we hold and escalate, we don't seize control.
- **Black-box AI decisions** → the rules trigger is fully inspectable; the
  analyst returns explicit, labelled signals; everything is in the audit trail.
- **AI scope creep** → the LLM's role is narrowly bounded to *reading
  unstructured answers*. Thresholds, routing, and the no-auto-decline rule are
  deterministic and owned by us.
- **Data privacy** → demo uses synthetic data only; no real customer data. A
  production build would minimise retention of the free-text answers and treat
  them as sensitive.
- **Audit tampering** → hash-chained log; `verifyChain()` proves integrity.

## Honest limitations (say these out loud)

- The demo analyst is **deterministic pattern matching**, not a live model — by
  choice, for reliability. The interface is built for a real model to drop in.
- In-memory state; no real payment rails, auth, or KYC.
- Thresholds are illustrative and would need tuning against real fraud data and
  false-positive tolerance.
