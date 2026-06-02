import { useEffect, useState } from "react";
import { api, fmtGBP, type Account, type Payee, type PaymentResponse } from "./api/client.js";
import { InterventionDialog } from "./components/InterventionDialog.js";
import { AuditTrail } from "./components/AuditTrail.js";

export default function App() {
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [payees, setPayees] = useState<Payee[]>([]);
  const [auditKey, setAuditKey] = useState(0);

  // payment form
  const [fromAccountId, setFromAccountId] = useState("acc_savings");
  const [payeeId, setPayeeId] = useState("");
  const [amount, setAmount] = useState("4000");
  const [reference, setReference] = useState("");
  const [markedUrgent, setMarkedUrgent] = useState(false);

  const [active, setActive] = useState<PaymentResponse | null>(null);

  function refresh() {
    api.accounts().then(setAccounts);
    api.payees().then((p) => {
      setPayees(p);
      if (!payeeId && p.length) setPayeeId(p[p.length - 1].id);
    });
    setAuditKey((k) => k + 1);
  }
  useEffect(refresh, []); // eslint-disable-line react-hooks/exhaustive-deps

  // One-click: set up Sarah's scam scenario so the demo is reliable.
  async function loadScamScenario() {
    await api.reset();
    const payee = await api.addPayee({
      name: "Safe Account (J Stevens)",
      sortCode: "60-12-99",
      accountNumber: "78451200",
    });
    setFromAccountId("acc_savings");
    setPayeeId(payee.id);
    setAmount("4000");
    setReference("Account protection");
    setMarkedUrgent(true);
    refresh();
  }

  async function pay() {
    const res = await api.createPayment({
      fromAccountId,
      payeeId,
      amountPence: Math.round(parseFloat(amount || "0") * 100),
      reference,
      markedUrgent,
    });
    setActive(res);
    setAuditKey((k) => k + 1);
    if (!res.intervention) refresh();
  }

  return (
    <div className="app">
      <header className="topbar">
        <div className="brand">
          <span className="logo">🏰 FORTRESS</span>
          <span className="tagline">the bank that assumes the attacker has AI too</span>
        </div>
        <button className="reset" onClick={loadScamScenario}>
          ▶ Load demo scenario
        </button>
      </header>

      <main className="grid">
        <section className="panel">
          <h2>Your accounts</h2>
          <div className="accounts">
            {accounts.map((a) => (
              <div key={a.id} className={`account ${a.type}`}>
                <div className="acc-name">{a.name}</div>
                <div className="acc-meta">{a.sortCode} · {a.accountNumber}</div>
                <div className="acc-balance">{fmtGBP(a.balancePence)}</div>
              </div>
            ))}
          </div>

          <h2>Make a payment</h2>
          <div className="form">
            <label>
              From
              <select value={fromAccountId} onChange={(e) => setFromAccountId(e.target.value)}>
                {accounts.map((a) => (
                  <option key={a.id} value={a.id}>
                    {a.name} — {fmtGBP(a.balancePence)}
                  </option>
                ))}
              </select>
            </label>
            <label>
              To payee
              <select value={payeeId} onChange={(e) => setPayeeId(e.target.value)}>
                {payees.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.isNew ? "(new)" : ""}
                  </option>
                ))}
              </select>
            </label>
            <label>
              Amount (£)
              <input value={amount} onChange={(e) => setAmount(e.target.value)} inputMode="decimal" />
            </label>
            <label>
              Reference
              <input value={reference} onChange={(e) => setReference(e.target.value)} />
            </label>
            <label className="check">
              <input
                type="checkbox"
                checked={markedUrgent}
                onChange={(e) => setMarkedUrgent(e.target.checked)}
              />
              Mark as urgent
            </label>
            <button className="primary" onClick={pay} disabled={!payeeId}>
              Send {amount ? fmtGBP(Math.round(parseFloat(amount || "0") * 100)) : ""}
            </button>
          </div>
        </section>

        <AuditTrail refreshKey={auditKey} />
      </main>

      {active?.intervention && (
        <InterventionDialog
          interventionId={active.intervention.interventionId}
          paymentId={active.payment.id}
          amountPence={active.payment.amountPence}
          firstQuestion={active.intervention.question}
          trigger={active.intervention.trigger}
          onClosed={() => {
            setActive(null);
            refresh();
          }}
        />
      )}
    </div>
  );
}
