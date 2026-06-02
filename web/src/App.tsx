import { useEffect, useState } from "react";
import {
  api,
  fmtGBP,
  type Account,
  type Payee,
  type Profile,
  type Transaction,
  type Question,
  type AuditEntry,
  type Threat,
  type Posture,
} from "./api/client.js";

type View =
  | { name: "dashboard" }
  | { name: "account"; id: string }
  | { name: "pay" }
  | { name: "review" }
  | { name: "interview" }
  | { name: "held" }
  | { name: "success" }
  | { name: "audit" };

interface PayCtx {
  paymentId: string;
  payeeName: string;
  amountPence: number;
  fromName: string;
  reasons: string[];
}
interface Msg { who: "ai" | "me"; text: string; }

const ACTOR_ICON: Record<string, string> = {
  customer: "👤", "rules-engine": "⚙️", "ai-analyst": "🛡️", "ops-review": "🏢", system: "🔧",
};

export default function App() {
  const [profile, setProfile] = useState<Profile | null>(null);
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [payees, setPayees] = useState<Payee[]>([]);
  const [view, setView] = useState<View>({ name: "dashboard" });
  const [accTx, setAccTx] = useState<Transaction[]>([]);

  // payment form
  const [from, setFrom] = useState("acc_current");
  const [payeeId, setPayeeId] = useState("");
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [adding, setAdding] = useState(false);
  const [np, setNp] = useState({ name: "", sortCode: "", accountNumber: "" });

  // in-flight payment + interview
  const [ctx, setCtx] = useState<PayCtx | null>(null);
  const [intId, setIntId] = useState("");
  const [msgs, setMsgs] = useState<Msg[]>([]);
  const [question, setQuestion] = useState<Question | null>(null);
  const [scamScore, setScamScore] = useState(0);
  const [freeText, setFreeText] = useState("");
  const [decision, setDecision] = useState<{ hold: boolean; rationale: string } | null>(null);

  const [audit, setAudit] = useState<{ entries: AuditEntry[]; valid: boolean }>({ entries: [], valid: true });

  // threat intelligence / posture
  const [posture, setPosture] = useState<Posture>("NORMAL");
  const [threats, setThreats] = useState<Threat[]>([]);
  const [socMode, setSocMode] = useState(() => window.location.hash.replace("#", "") === "soc");

  function loadCore() {
    api.profile().then(setProfile);
    api.accounts().then(setAccounts);
    api.payees().then(setPayees);
  }
  function loadThreats() {
    api.threats().then((r) => { setPosture(r.posture); setThreats(r.threats); });
  }
  // The customer app resets to a clean slate on load; the SOC surface never
  // resets (so arming a threat there isn't wiped).
  useEffect(() => { if (!socMode) api.reset().then(loadCore); }, []); // eslint-disable-line react-hooks/exhaustive-deps
  // Poll the threat feed so the posture badge flips ~live when the SOC arms a vector.
  useEffect(() => {
    loadThreats();
    const iv = setInterval(loadThreats, 2000);
    const onHash = () => setSocMode(window.location.hash.replace("#", "") === "soc");
    window.addEventListener("hashchange", onHash);
    return () => { clearInterval(iv); window.removeEventListener("hashchange", onHash); };
  }, []);

  function openAccount(id: string) {
    api.transactions(id).then(setAccTx);
    setView({ name: "account", id });
  }
  function openPay(fromId?: string) {
    if (fromId) setFrom(fromId);
    setPayeeId(""); setAmount(""); setReference(""); setAdding(false);
    setView({ name: "pay" });
  }
  async function saveNewPayee() {
    if (!np.name || !np.sortCode || !np.accountNumber) { alert("Enter the payee name, sort code and account number."); return; }
    const p = await api.addPayee(np);
    await api.payees().then(setPayees);
    setPayeeId(p.id); setAdding(false); setNp({ name: "", sortCode: "", accountNumber: "" });
  }

  async function review() {
    const pe = payees.find((p) => p.id === payeeId);
    const acc = accounts.find((a) => a.id === from);
    if (!pe || !acc) { alert("Choose who to pay."); return; }
    const amountPence = Math.round(parseFloat(amount || "0") * 100);
    if (!(amountPence > 0)) { alert("Enter an amount greater than 0."); return; }
    if (amountPence > acc.balancePence) { alert("That's more than the balance in this account."); return; }

    const res = await api.createPayment({ fromAccountId: from, payeeId, amountPence, reference, markedUrgent: false });
    const base: PayCtx = { paymentId: res.payment.id, payeeName: pe.name, amountPence, fromName: acc.name, reasons: [] };
    if (res.intervention) {
      base.reasons = res.intervention.trigger.reasons;
      setCtx(base);
      setIntId(res.intervention.interventionId);
      setQuestion(res.intervention.question);
      setMsgs([]);
      setScamScore(0);
      setDecision(null);
      setView({ name: "review" });
    } else {
      setCtx(base);
      api.accounts().then(setAccounts);
      setView({ name: "success" });
    }
  }

  function beginInterview() {
    if (question) setMsgs([{ who: "ai", text: question.text }]);
    setView({ name: "interview" });
  }

  async function answer(payload: { choice?: string; freeText?: string }, label: string) {
    setMsgs((m) => [...m, { who: "me", text: label }]);
    setFreeText("");
    const res = await api.answer(intId, payload);
    setScamScore(res.scamScore);
    if (res.done) {
      if (res.outcome === "hold") {
        setDecision({ hold: true, rationale: res.rationale });
        setView({ name: "held" });
      } else {
        api.accounts().then(setAccounts);
        setDecision({ hold: false, rationale: res.rationale });
        setView({ name: "success" });
      }
    } else {
      setQuestion(res.question);
      setMsgs((m) => [...m, { who: "ai", text: res.question.text }]);
    }
  }

  async function resolveHeld(action: "release" | "cancel") {
    if (!ctx) return;
    await api.resolve(ctx.paymentId, { action, actor: "customer" });
    api.accounts().then(setAccounts);
    if (action === "release") { setDecision({ hold: false, rationale: "Released by customer after warning." }); setView({ name: "success" }); }
    else setView({ name: "dashboard" });
  }

  function openAudit() {
    api.audit().then((r) => setAudit({ entries: [...r.entries].reverse(), valid: r.integrity.valid }));
    setView({ name: "audit" });
  }
  function toggleThreat(id: string) {
    api.toggleThreat(id).then((r) => { setThreats(r.threats); setPosture(r.posture); });
  }

  if (socMode) return SocConsole();

  return (
    <div className="phone"><div className="screen">
      <div className="notch" />
      <div className="status"><span>9:41</span><span>5G ▪ 100%</span></div>
      <div className="app">
        {view.name === "dashboard" && Dashboard()}
        {view.name === "account" && AccountScreen({ id: view.id })}
        {view.name === "pay" && PayForm()}
        {view.name === "review" && Review()}
        {view.name === "interview" && Interview()}
        {view.name === "held" && Held()}
        {view.name === "success" && Success()}
        {view.name === "audit" && Audit()}
      </div>
      <div className="home" />
    </div></div>
  );

  function Brand({ sub }: { sub?: string }) {
    return <div className="brandbar"><span className="logo">V</span><b>Vault</b><span className="sub">{sub}</span>{posture !== "NORMAL" && <span className={`pbadge ${posture}`}>🔒 {posture}</span>}</div>;
  }
  function SocConsole() {
    return (
      <div className="soc">
        <h2>🛰 Security Operations<span className="internal">🔒 INTERNAL</span></h2>
        <div className="sublabel">Analyst-only surface · not shown to customers (this is <code>/#soc</code>)</div>
        <div className={`posture ${posture}`}>Defense posture: {posture}</div>
        {threats.map((t) => (
          <div key={t.id} className={`vec ${t.active ? "on" : ""}`}>
            <div className="vid">{t.id} · {t.category}</div>
            <div className="vname">{t.name}</div>
            <span className={`sev ${t.severity}`}>{t.severity}</span>{" "}
            <span className="trend">{t.trend}{t.targetPayee ? ` · scoped to ${t.targetPayee}` : ""}</span>
            <button className={t.active ? "live" : "arm"} onClick={() => toggleThreat(t.id)}>
              {t.active ? "● LIVE — stand down" : "▶ ACTIVATE"}
            </button>
          </div>
        ))}
        <div className="sublabel" style={{ marginTop: 8 }}>Activate a vector → posture rises → the customer app re-screens matching payments live, even trusted ones.</div>
        <a className="home-link" href="#" onClick={() => { window.location.hash = ""; }}>← back to customer app</a>
      </div>
    );
  }
  function Tabs({ active }: { active: string }) {
    return (
      <div className="tabbar">
        <button className={`tab ${active === "home" ? "active" : ""}`} onClick={() => setView({ name: "dashboard" })}><span className="gi">🏠</span>Accounts</button>
        <button className={`tab ${active === "pay" ? "active" : ""}`} onClick={() => openPay()}><span className="gi">💸</span>Pay</button>
        <button className={`tab ${active === "audit" ? "active" : ""}`} onClick={openAudit}><span className="gi">🛡️</span>Activity</button>
      </div>
    );
  }

  function Dashboard() {
    const total = accounts.reduce((s, a) => s + a.balancePence, 0);
    return (<>
      {Brand({ sub: profile?.name })}
      <div className="body">
        <div className="card" style={{ background: "var(--brand)", color: "#fff", border: "none" }}>
          <div className="label" style={{ color: "#bfe9df" }}>Total balance</div>
          <div style={{ fontSize: 30, fontWeight: 800, marginTop: 4 }}>{fmtGBP(total)}</div>
          <div style={{ fontSize: 12, opacity: .85, marginTop: 2 }}>{profile?.tier} · protected</div>
        </div>
        <button className="btn mt" onClick={() => openPay()}>Send money</button>
        <h3 className="sec" style={{ marginTop: 16 }}>Accounts</h3>
        {accounts.map((a) => (
          <button key={a.id} className="card acct" onClick={() => openAccount(a.id)}>
            <div><div className="nm">{a.name}</div><div className="ms">••••{a.accountNumber.slice(-4)} · {a.sortCode}</div></div>
            <div className="bal">{fmtGBP(a.balancePence)}</div>
          </button>
        ))}
      </div>
      {Tabs({ active: "home" })}
    </>);
  }

  function AccountScreen({ id }: { id: string }) {
    const a = accounts.find((x) => x.id === id)!;
    return (<>
      {Brand({})}
      <div className="nav"><button className="back" onClick={() => setView({ name: "dashboard" })}>‹</button><h2>{a.name}</h2></div>
      <div className="body">
        <div className="card" style={{ textAlign: "center" }}>
          <div className="label">Available balance</div>
          <div style={{ fontSize: 30, fontWeight: 800, margin: "4px 0" }}>{fmtGBP(a.balancePence)}</div>
          <div className="ms" style={{ color: "var(--muted)", fontSize: 12 }}>••••{a.accountNumber.slice(-4)} · {a.sortCode}</div>
          <button className="btn mt" onClick={() => openPay(a.id)}>Make a payment</button>
        </div>
        <h3 className="sec">Recent transactions</h3>
        <div className="card">
          {accTx.length ? accTx.map((t) => (
            <div className="txn" key={t.id}>
              <div><div>{t.desc}</div><div className="d">{t.date}</div></div>
              <div className={t.amountPence > 0 ? "pos" : ""} style={{ fontWeight: 700 }}>{t.amountPence > 0 ? "+" : ""}{fmtGBP(Math.abs(t.amountPence))}</div>
            </div>
          )) : <div className="d" style={{ color: "var(--muted)", fontSize: 13 }}>No transactions yet.</div>}
        </div>
      </div>
      {Tabs({ active: "home" })}
    </>);
  }

  function PayForm() {
    return (<>
      {Brand({ sub: "Send money" })}
      <div className="nav"><button className="back" onClick={() => setView({ name: "dashboard" })}>‹</button><h2>Send money</h2></div>
      <div className="body">
        <div className="label">From account</div>
        <select className="field" value={from} onChange={(e) => setFrom(e.target.value)}>
          {accounts.map((a) => <option key={a.id} value={a.id}>{a.name} — {fmtGBP(a.balancePence)}</option>)}
        </select>
        <div className="label mt">Pay to</div>
        <select className="field" value={payeeId} onChange={(e) => setPayeeId(e.target.value)}>
          <option value="">Choose a payee…</option>
          {payees.map((p) => <option key={p.id} value={p.id}>{p.name}{p.isNew ? " (new)" : ""}</option>)}
        </select>
        <button className="btn sec mt" onClick={() => setAdding(!adding)}>{adding ? "✕ Cancel" : "+ Add a new payee"}</button>
        {adding && (
          <div className="addp">
            <div className="label">Payee name</div><input className="field" value={np.name} onChange={(e) => setNp({ ...np, name: e.target.value })} placeholder="e.g. John Smith" />
            <div className="label mt">Sort code</div><input className="field" value={np.sortCode} onChange={(e) => setNp({ ...np, sortCode: e.target.value })} placeholder="00-00-00" />
            <div className="label mt">Account number</div><input className="field" value={np.accountNumber} onChange={(e) => setNp({ ...np, accountNumber: e.target.value })} placeholder="12345678" />
            <button className="btn mt" onClick={saveNewPayee}>Save payee</button>
          </div>
        )}
        <div className="label mt">Amount (£)</div><input className="field" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0.00" inputMode="decimal" />
        <div className="label mt">Reference</div><input className="field" value={reference} onChange={(e) => setReference(e.target.value)} placeholder="What's it for?" />
        <button className="btn mt" disabled={!payeeId} onClick={review}>Continue</button>
        <p className="d" style={{ color: "var(--muted)", fontSize: 11, marginTop: 12 }}>Tip: paying a saved payee clears instantly. Add a new payee and send a large amount to see Vault's scam protection.</p>
      </div>
      {Tabs({ active: "pay" })}
    </>);
  }

  function Review() {
    if (!ctx) return null;
    return (<>
      {Brand({ sub: "Review" })}
      <div className="nav"><button className="back" onClick={() => setView({ name: "pay" })}>‹</button><h2>Review payment</h2></div>
      <div className="body">
        <div className="card">
          <div className="row"><span className="label">To</span><b>{ctx.payeeName}</b></div>
          <div className="row mt"><span className="label">Amount</span><b style={{ fontSize: 18 }}>{fmtGBP(ctx.amountPence)}</b></div>
          <div className="row mt"><span className="label">From</span><span>{ctx.fromName}</span></div>
        </div>
        <div className="banner warn"><span>🔎</span><span><b>Quick safety check.</b> {ctx.reasons.join("; ")}. We'll ask a couple of questions before this leaves your account.</span></div>
        <button className="btn" onClick={beginInterview}>Continue</button>
        <p className="d" style={{ fontSize: 11, color: "var(--muted)", marginTop: 12 }}>A scam payment and an honest one look <i>identical</i> to the rules layer — that's why the conversation matters.</p>
      </div>
    </>);
  }

  function Interview() {
    const isFree = question?.type === "freetext";
    return (<>
      {Brand({ sub: "Safety check" })}
      <div className="nav"><button className="back" onClick={() => setView({ name: "review" })}>‹</button><h2>Vault is checking in</h2></div>
      <div className="body">
        <div className="banner good"><span>👀</span><span>A second pair of eyes, grounded in real scam patterns. Answer honestly — this protects you.</span></div>
        <div className="msgs">
          {msgs.map((m, i) => <div key={i} className={`msg ${m.who}`}><div className="who">{m.who === "ai" ? "Vault" : "You"}</div>{m.text}</div>)}
        </div>
        {question && !isFree && (
          <div className="answers">
            {question.options?.map((o) => <button key={o.value} className="ans" onClick={() => answer({ choice: o.value }, o.label)}>{o.label}</button>)}
          </div>
        )}
        {question && isFree && (
          <div className="composer">
            <textarea rows={2} value={freeText} onChange={(e) => setFreeText(e.target.value)} placeholder="Type what you were told…" />
            <button onClick={() => freeText.trim() && answer({ freeText }, freeText)}>Send</button>
          </div>
        )}
        <div className="meter"><div className="bar"><div className="fill" style={{ width: `${Math.min(scamScore, 100)}%` }} /></div><span>scam-likelihood {scamScore}/100</span></div>
      </div>
    </>);
  }

  function Held() {
    if (!ctx) return null;
    return (<>
      {Brand({ sub: "Payment held" })}
      <div className="body">
        <div className="verdict held">
          <div className="ico">⏸</div>
          <span className="pill red">PAYMENT HELD</span>
          <h3 style={{ marginTop: 10 }}>We've stopped this payment</h3>
          <p>This matches a <b>“safe account” scam</b>. No genuine bank or authority asks you to move money to keep it safe. <b>Your {fmtGBP(ctx.amountPence)} is still in your account.</b></p>
        </div>
        <div className="banner bad" style={{ marginTop: 14 }}><span>📞</span><span>Call us on the number on your card — not any number you were given.</span></div>
        <div className="banner good"><span>📄</span><span><b>Effective warning logged.</b> A hash-chained, timestamped record was created — the proof UK reimbursement rules (PSR) require.</span></div>
        {decision && <p className="d" style={{ color: "var(--muted)", fontSize: 11, textAlign: "center" }}>{decision.rationale}</p>}
        <button className="btn danger" onClick={() => resolveHeld("cancel")}>Cancel — it was a scam</button>
        <button className="btn sec mt" onClick={() => resolveHeld("release")}>I'm certain it's safe — send anyway</button>
        <button className="btn sec mt" onClick={openAudit}>View activity log</button>
      </div>
    </>);
  }

  function Success() {
    if (!ctx) return null;
    return (<>
      {Brand({ sub: "Payment sent" })}
      <div className="body">
        <div className="verdict ok">
          <div className="ico">✓</div>
          <span className="pill green">PAYMENT SENT</span>
          <h3 style={{ marginTop: 10 }}>{fmtGBP(ctx.amountPence)} on its way</h3>
          <p>To <b>{ctx.payeeName}</b>. Vault doesn't just block big payments — it understands them, and gets out of the way when they're genuine.</p>
        </div>
        <button className="btn" onClick={() => setView({ name: "dashboard" })}>Back to accounts</button>
        <button className="btn sec mt" onClick={openAudit}>View activity log</button>
      </div>
    </>);
  }

  function Audit() {
    return (<>
      {Brand({ sub: "Tamper-evident" })}
      <div className="nav"><button className="back" onClick={() => setView({ name: "dashboard" })}>‹</button><h2>Activity log</h2></div>
      <div className="body">
        <div className="banner good"><span>🛡️</span><span>Every step is hash-chained with real SHA-256. Change any entry and the chain breaks — tamper-evident by design.</span></div>
        <div className="card audit">
          {audit.entries.map((e) => (
            <div className="ln" key={e.seq}>
              <span className="ts">{ACTOR_ICON[e.actor] ?? "•"} {e.actor}</span>
              <span>{e.action} <span className="hash">#{e.seq} {e.hash.slice(0, 8)}…</span></span>
            </div>
          ))}
          {audit.valid && <div className="chainok">✓ Chain verified · {audit.entries.length} entries · genesis → head intact</div>}
        </div>
      </div>
      {Tabs({ active: "audit" })}
    </>);
  }
}
