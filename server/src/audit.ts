// Immutable, hash-chained audit log.
// Each entry's hash covers the previous hash, so any tampering with an
// earlier record breaks the chain. This is the "proof of an effective
// warning" that UK APP-reimbursement rules require — and it makes a great
// live visual in the demo.

import { createHash } from "node:crypto";
import type { AuditEntry } from "./types.js";

const GENESIS = "0".repeat(64);
const chain: AuditEntry[] = [];

function hashEntry(e: Omit<AuditEntry, "hash">): string {
  const payload = JSON.stringify({
    seq: e.seq,
    timestamp: e.timestamp,
    actor: e.actor,
    action: e.action,
    details: e.details,
    prevHash: e.prevHash,
  });
  return createHash("sha256").update(payload).digest("hex");
}

export function record(
  actor: string,
  action: string,
  details: Record<string, unknown> = {}
): AuditEntry {
  const prevHash = chain.length ? chain[chain.length - 1].hash : GENESIS;
  const base = {
    seq: chain.length + 1,
    timestamp: new Date().toISOString(),
    actor,
    action,
    details,
    prevHash,
  };
  const entry: AuditEntry = { ...base, hash: hashEntry(base) };
  chain.push(entry);
  return entry;
}

export function getTrail(): AuditEntry[] {
  return [...chain];
}

/** Re-verify the whole chain — proves to a judge it can't be quietly edited. */
export function verifyChain(): { valid: boolean; brokenAt?: number } {
  let prevHash = GENESIS;
  for (const e of chain) {
    const expected = hashEntry({ ...e });
    if (e.prevHash !== prevHash || e.hash !== expected) {
      return { valid: false, brokenAt: e.seq };
    }
    prevHash = e.hash;
  }
  return { valid: true };
}
