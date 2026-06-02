# Team Alignment — how this build maps to the team demo

The team is building a **demo-focused** app at [`ewoo/telp-demo`](https://github.com/ewoo/telp-demo)
(see its `PLAN.md`). **This repo is the functional reference build** — the same
concept, actually wired up end to end. We deliberately mirror the team's plan so
the two stay narratively consistent.

## What we mirror (kept in sync)

| Item | Team plan | This build |
|---|---|---|
| Product name | Vault | Vault ✅ |
| Concept | Scam Interceptor (APP fraud at point of payment) | ✅ |
| Customer | Alex Morgan, Vault Premier, £10k/day | ✅ (`/api/profile`) |
| Accounts | Current ••••3491 £14,820.55 · Savings ••••8806 £42,100 · Joint ••••1175 £3,265.10 | ✅ (`data/store.ts`) |
| Trusted payees | Jane Foster (Landlord), Thames Water, British Gas | ✅ |
| Two-stage flow | rules triage → AI conversation → release/hold | ✅ (`scam/engine.ts`) |
| Scam typologies | safe-account, investment, purchase, romance, invoice | ✅ (`scam/patterns.ts`) |
| Demo beats | 1) landlord clears 2) £8k car releases 3) £8k safe-account holds | ✅ (header buttons) |
| Guardrails | integer pence, fail-closed, hash-chained audit, reset-to-seed | ✅ |

## Where we differ (intentionally)

- **API shape.** The team plan sketches `/payments/assess`, `/payments/interview`,
  `/payments/confirm`. We use `/payments` (creates + triages), `/interventions/:id/answer`
  (conversation turn), `/payments/:id/resolve` (human-in-the-loop). Same state
  machine, cleaner separation. Easy to rename if we converge.
- **AI analyst.** Team plan calls a live Claude API with a scripted fallback.
  We ship the **deterministic analyst as the default** (reliable on stage, no key)
  behind a `ScamAnalyzer` interface, with `LLMAnalyzer` as a one-line swap-in.
- **Accounts shown unmasked length.** We store full numbers and mask in the UI.

## Keeping in sync

The team's plan may change during the sprint. To re-sync, re-read:
- `https://github.com/ewoo/telp-demo/blob/main/PLAN.md`
- `https://github.com/ewoo/telp-demo/blob/main/TIMELINE.md`
- the shared planning doc

If a detail changes (customer name, account count, demo beats — all listed as
"open decisions" in their plan), update `server/src/data/store.ts` and the demo
buttons in `web/src/App.tsx`, then rebuild.
