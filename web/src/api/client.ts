// Typed API client. Mirrors the server's domain types so contributors get
// autocomplete and compile-time safety across the stack.

export interface Account {
  id: string;
  name: string;
  sortCode: string;
  accountNumber: string;
  type: "current" | "savings" | "joint";
  balancePence: number;
}

export interface Profile {
  name: string;
  tier: string;
  dailyLimitPence: number;
}

export interface Payee {
  id: string;
  name: string;
  sortCode: string;
  accountNumber: string;
  isNew: boolean;
}

export interface Transaction {
  id: string;
  accountId: string;
  desc: string;
  date: string;
  amountPence: number;
}

export type Posture = "NORMAL" | "HEIGHTENED" | "LOCKDOWN";

export interface Threat {
  id: string;
  name: string;
  category: string;
  severity: "HIGH" | "CRITICAL";
  trend: string;
  targetPayee: string | null;
  posture: Posture;
  active: boolean;
}

export interface Question {
  id: string;
  text: string;
  type: "yesno" | "choice" | "freetext";
  options?: { value: string; label: string }[];
}

export interface Trigger {
  intervene: boolean;
  score: number;
  reasons: string[];
}

export interface PaymentResponse {
  payment: { id: string; status: string; amountPence: number };
  intervention: { interventionId: string; question: Question; trigger: Trigger } | null;
}

export type InterventionDecision =
  | { done: false; question: Question; scamScore: number; rationale: string }
  | { done: true; outcome: "hold" | "release"; scamScore: number; rationale: string };

export interface AuditEntry {
  seq: number;
  timestamp: string;
  actor: string;
  action: string;
  details: Record<string, unknown>;
  hash: string;
}

async function http<T>(url: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  if (!res.ok) throw new Error(`${res.status} ${await res.text()}`);
  return res.json() as Promise<T>;
}

export const api = {
  profile: () => http<Profile>("/api/profile"),
  accounts: () => http<Account[]>("/api/accounts"),
  transactions: (accountId?: string) =>
    http<Transaction[]>("/api/transactions" + (accountId ? `?accountId=${accountId}` : "")),
  payees: () => http<Payee[]>("/api/payees"),
  addPayee: (body: { name: string; sortCode: string; accountNumber: string }) =>
    http<Payee>("/api/payees", { method: "POST", body: JSON.stringify(body) }),
  createPayment: (body: {
    fromAccountId: string;
    payeeId: string;
    amountPence: number;
    reference: string;
    markedUrgent: boolean;
  }) => http<PaymentResponse>("/api/payments", { method: "POST", body: JSON.stringify(body) }),
  answer: (interventionId: string, body: { choice?: string; freeText?: string }) =>
    http<InterventionDecision>(`/api/interventions/${interventionId}/answer`, {
      method: "POST",
      body: JSON.stringify(body),
    }),
  resolve: (paymentId: string, body: { action: "release" | "cancel"; actor: string }) =>
    http(`/api/payments/${paymentId}/resolve`, { method: "POST", body: JSON.stringify(body) }),
  audit: () =>
    http<{ entries: AuditEntry[]; integrity: { valid: boolean; brokenAt?: number } }>("/api/audit"),
  reset: () => http("/api/demo/reset", { method: "POST" }),
  threats: () => http<{ threats: Threat[]; posture: Posture }>("/api/threats"),
  toggleThreat: (id: string) =>
    http<{ threats: Threat[]; posture: Posture }>(`/api/threats/${id}/toggle`, { method: "POST" }),
};

export const fmtGBP = (pence: number) =>
  new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(pence / 100);

export const mask = (accountNumber: string) => `••••${accountNumber.slice(-4)}`;
