# Contributing to Fortress

This is a 5-person sprint build. The codebase is split into modules with clear
ownership so everyone can work in parallel without stepping on each other.
**Every contributor should be able to speak to the whole solution** — these
boundaries are about focus, not silos.

## Module ownership (map to your expertise)

| Area | Owns | Files | What "good" looks like |
|---|---|---|---|
| 🎯 **Risk** | The rules trigger & scam scoring | `server/src/scam/engine.ts`, `server/src/scam/patterns.ts` | Sensible thresholds, real APP typologies, low false-positive friction |
| 🧠 **AI / Tech** | Analyst layer & architecture | `server/src/scam/analyzer.ts`, `server/src/index.ts`, `server/src/routes/api.ts` | Clean analyst interface so a real LLM drops in; tidy API |
| 🎨 **Product / Client experience** | The customer journey & copy | `web/src/**` (esp. `InterventionDialog.tsx`) | Plain-English warnings, calm UX, the "save" lands emotionally |
| ⚖️ **Compliance** | Audit trail & regulatory mapping | `server/src/audit.ts`, `docs/REGULATORY.md` | Tamper-evident log, Consumer Duty / APP-reimbursement alignment |
| 🏢 **Operations** | Human-in-the-loop / hold handling | `/payments/:id/resolve` flow, ops narrative | A held payment routes to review and can be released or cancelled |

## Workflow

1. **Branch** off the working branch: `git checkout -b your-area/short-description`
2. **Run locally**: `npm run install:all` then `npm run dev`
3. **Keep types in sync**: server types live in `server/src/types.ts`; the web
   client mirrors them in `web/src/api/client.ts`. If you change one, change both.
4. **Both packages must compile**: `npm run build` before you push.
5. **Open a PR** into the working branch. Keep PRs small and focused on your module.

## Design principles (don't break these)

- **Friction over autonomy.** The interceptor *holds and escalates* — it must
  never auto-decline. Preserving customer agency is the whole point.
- **Explainable, not a black box.** Every decision shows its reasons and writes
  to the audit trail.
- **Demo must never fail.** The deterministic analyst is the default. LLM is
  opt-in and behind an interface.

## Ground rules (from the brief)

- No confidential firm data, client information, or proprietary systems.
- Claude Code is a tool — be ready to explain every decision it made vs. what
  *we* decided.
