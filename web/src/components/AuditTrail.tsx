// Live, hash-chained audit trail. The integrity badge re-verifies the chain
// on the server — a tangible "regulator-readable, tamper-evident" visual.

import { useEffect, useState } from "react";
import { api, type AuditEntry } from "../api/client.js";

const ACTOR_ICON: Record<string, string> = {
  customer: "👤",
  "rules-engine": "⚙️",
  "ai-analyst": "🧠",
  "ops-review": "🏢",
  system: "🔧",
};

export function AuditTrail({ refreshKey }: { refreshKey: number }) {
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [valid, setValid] = useState(true);

  useEffect(() => {
    api.audit().then((r) => {
      setEntries([...r.entries].reverse());
      setValid(r.integrity.valid);
    });
  }, [refreshKey]);

  return (
    <aside className="audit">
      <div className="audit-head">
        <h3>Immutable audit trail</h3>
        <span className={`integrity ${valid ? "ok" : "bad"}`}>
          {valid ? "🔒 chain verified" : "⚠️ chain broken"}
        </span>
      </div>
      <ol>
        {entries.map((e) => (
          <li key={e.seq}>
            <div className="row">
              <span className="actor">{ACTOR_ICON[e.actor] ?? "•"} {e.actor}</span>
              <span className="action">{e.action}</span>
            </div>
            <code className="hash" title={e.hash}>#{e.seq} · {e.hash.slice(0, 12)}…</code>
          </li>
        ))}
      </ol>
    </aside>
  );
}
