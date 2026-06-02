# Architecture

A small TypeScript monorepo. Two processes, in-memory state, zero external
dependencies at runtime — so it always runs on stage.

```
┌──────────────────┐     /api/*      ┌──────────────────────────────┐
│  web (React/Vite)│ ───────────────▶│  server (Express)            │
│  :5173           │◀─────────────── │  :4000                       │
└──────────────────┘    JSON         │                              │
                                      │  routes/api.ts  (controllers)│
                                      │  data/store.ts  (in-memory)  │
                                      │  scam/                       │
                                      │    patterns.ts (knowledge)   │
                                      │    engine.ts   (rules + flow)│
                                      │    analyzer.ts (pluggable AI)│
                                      │  audit.ts (hash-chained log) │
                                      └──────────────────────────────┘
```

## The two-stage interception

1. **Rules trigger** (`engine.assessPayment`) — cheap, deterministic checks on
   *structured* data: new payee, large amount, urgency, balance ratio, payee-name
   lures. Decides **whether** to intervene. Runs on every payment.
2. **Adaptive conversation** (`engine.startIntervention` / `answerIntervention`)
   — when triggered, asks a short sequence of questions. The **analyst** reads
   each answer (structured choice *and* free text), returns scam **signals**, and
   we accumulate a score. Decides **what to do**: hold + escalate, or release.

This mirrors the pitch exactly: *"a cheap rules layer decides whether a payment
needs a closer look; when it fires, an AI opens a short, adaptive conversation."*

## The analyst is pluggable

`scam/analyzer.ts` defines the `ScamAnalyzer` interface. Two implementations:

- **`RuleBasedAnalyzer`** (default) — lexicon + weighted choices. Deterministic,
  no network, no API key. This is what runs in the demo.
- **`LLMAnalyzer`** (stub) — wire to the Anthropic SDK to read genuinely
  free-form answers. Returns the identical `AnalysisResult` shape, so swapping it
  in is **one line** in `engine.ts`.

> This is the honest "what Claude did vs. what we decided" story: *we* designed
> the control flow, thresholds, and the no-auto-decline rule; the AI's job is
> narrowly scoped to reading unstructured answers.

## The audit trail

`audit.ts` is an append-only log where each entry's SHA-256 hash covers the
previous hash (a mini blockchain). `verifyChain()` re-checks the whole chain, so
the UI can show a live "🔒 chain verified" badge. Tampering with any past entry
breaks every hash after it.

## Why in-memory?

It's a one-hour build and a 4-minute demo. A real deployment swaps `data/store.ts`
for a database and `audit.ts` for an append-only store (e.g. QLDB / WORM bucket)
— nothing else changes, because every other module depends only on the accessors.
