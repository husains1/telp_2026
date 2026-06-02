import { useEffect, useState } from "react";
import {
  api,
  fmtGBP,
  mask,
  type Account,
  type Payee,
  type Profile,
  type PaymentResponse,
} from "./api/client.js";
import { InterventionDialog } from "./components/InterventionDialog.js";
import { AuditTrail } from "./components/AuditTrail.js";

export default function App() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [payees, setPayees] = useState<Payee[]>([]);
  const [auditKey, setAuditKey] = useState(0);

  // payment form
  const [fromAccountId, setFromAccountId] = useState("acc_current");
  const [payeeId, setPayeeId] = useState("");
  const [amount, setAmount] = useState("8000");
  const [reference, setReference] = useState("");
  const [markedUrgent, setMarkedUrgent] = useState(false);

  const [active, setActive] = useState<PaymentResponse | null>(null);

  function refresh() {
    api.profile().then(setProfile);
    api.accounts().then(setAccounts);
    api.payees().then(setPayees);
    setAuditKey((k) => k + 1);
  }
  useEffect(refresh, []);

  // Two demo beats with the SAME amount + SAME "new payee" shape — the
  // contrast is the whole pitch. One clears, one is held.
  async function loadBeat(kind: "car" | "scam") {
    await api.reset();
    const payee =
      kind === "car"
        ? await api.addPayee({ name: "Prestige Motors Ltd", sortCode: "30-16-22", accountNumber: "44102291" })
        : await api.addPayee({ name: "Safe Account (Fraud Team)", sortCode: "60-12-99", accountNumber: "78451200" });
    setFromAccountId("acc_current");
    setPayeeId(payee.id);
    setAmount("8000");
    setReference(kind === "car" ? "Used car — balance" : "Account protection");
    setMarkedUrgent(kind === "scam");
    api.profile().then(setProfile);
    api.accounts().then(setAccounts);
    api.payees().then((p) => setPayees(p));
    setAuditKey((k) => k + 1);
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
          <span className="logo">🛡️ VAULT</span>
          <span className="tagline">security is the product — not the fine print</span>
        </div>
        <div className="who">
          {profile && (
            <>
              <span className="cust">{profile.name}</span>
              <span className="tier">{profile.tier} · {fmtGBP(profile.dailyLimitPence)}/day limit</span>
            </>
          )}
        </div>
        <div className="scenarios">
          <button className="ghostbtn" onClick={() => loadBeat("car")}>▶ Beat 2: car (clears)</button>
          <button className="reset" onClick={() => loadBeat("scam")}>▶ Beat 3: scam (holds)</button>
        </div>
      </header>

      <main className="grid">
        <section className="panel">
          <h2>Accounts</h2>
          <div className="accounts">
            {accounts.map((a) => (
              <div key={a.id} className={`account ${a.type}`}>
                <div className="acc-name">{a.name}</div>
                <div className="acc-meta">{a.sortCode} · {mask(a.accountNumber)}</div>
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
                <option value="">Select a payee…</option>
                {payees.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} {p.isNew ? "(new)" : "✓ trusted"}
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
