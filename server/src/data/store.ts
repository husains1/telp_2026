// In-memory data store + seed scenario.
// Swap this module for a real DB later — every other module depends only on
// these accessor functions, not on the storage mechanism.
//
// Seed data mirrors the team demo plan (ewoo/telp-demo PLAN.md): customer
// Alex Morgan, Vault Premier, three accounts, three trusted payees.

import type { Account, Payee, Payment, Transaction, Threat, Posture } from "../types.js";

export const profile = {
  name: "Alex Morgan",
  tier: "Vault Premier",
  dailyLimitPence: 10_000_00,
};

const seedAccounts = (): Account[] => [
  {
    id: "acc_current",
    name: "Current Account",
    sortCode: "04-29-11",
    accountNumber: "20583491",
    type: "current",
    balancePence: 14_820_55,
  },
  {
    id: "acc_savings",
    name: "Savings",
    sortCode: "04-29-11",
    accountNumber: "44128806",
    type: "savings",
    balancePence: 42_100_00,
  },
  {
    id: "acc_joint",
    name: "Joint Account",
    sortCode: "04-29-11",
    accountNumber: "77451175",
    type: "joint",
    balancePence: 3_265_10,
  },
];

const seedPayees = (): Payee[] => [
  trusted("payee_landlord", "Jane Foster (Landlord)", "20-00-00", "31114520"),
  trusted("payee_water", "Thames Water", "60-80-09", "70114488"),
  trusted("payee_gas", "British Gas", "40-05-30", "55012390"),
];

function trusted(id: string, name: string, sortCode: string, accountNumber: string): Payee {
  return { id, name, sortCode, accountNumber, addedAt: "2023-01-01T09:00:00.000Z", isNew: false };
}

const seedTransactions = (): Transaction[] => [
  { id: "t1", accountId: "acc_current", desc: "ACME Corp — Salary", date: "31 May", amountPence: 3_400_00 },
  { id: "t2", accountId: "acc_current", desc: "Jane Foster — Rent", date: "28 May", amountPence: -1_450_00 },
  { id: "t3", accountId: "acc_current", desc: "Tesco Stores", date: "27 May", amountPence: -64_20 },
  { id: "t4", accountId: "acc_current", desc: "TfL Travel", date: "26 May", amountPence: -12_50 },
  { id: "t5", accountId: "acc_savings", desc: "Transfer from Current", date: "25 May", amountPence: 500_00 },
  { id: "t6", accountId: "acc_joint", desc: "Sainsbury's", date: "24 May", amountPence: -88_40 },
];

// Threat-intelligence feed — seeded vectors, dormant until armed from the SOC.
const seedThreats = (): Threat[] => [
  { id: "TIV-2026-031", name: "Thames Water billing-scam surge", category: "impersonation / APP", severity: "HIGH", trend: "+280% this week", targetPayee: "Thames Water", posture: "HEIGHTENED", active: false },
  { id: "TIV-2026-014", name: "“Safe account” bank-impersonation surge", category: "impersonation / APP", severity: "HIGH", trend: "+340% this week", targetPayee: null, posture: "HEIGHTENED", active: false },
  { id: "TIV-2026-008", name: "AI voice-clone impersonation", category: "impersonation", severity: "HIGH", trend: "on the rise", targetPayee: null, posture: "HEIGHTENED", active: false },
  { id: "TIV-2026-021", name: "SIM-swap + credential-stuffing ATO", category: "account takeover", severity: "CRITICAL", trend: "active campaign", targetPayee: null, posture: "LOCKDOWN", active: false },
];

export const accounts: Account[] = seedAccounts();
export const payees: Payee[] = seedPayees();
export const payments: Payment[] = [];
export const transactions: Transaction[] = seedTransactions();
export const threats: Threat[] = seedThreats();

const POSTURE_RANK: Record<Posture, number> = { NORMAL: 0, HEIGHTENED: 1, LOCKDOWN: 2 };

export function getThreats(): Threat[] {
  return threats;
}
export function activeThreats(): Threat[] {
  return threats.filter((t) => t.active);
}
export function posture(): Posture {
  let best: Posture = "NORMAL";
  for (const t of activeThreats()) if (POSTURE_RANK[t.posture] > POSTURE_RANK[best]) best = t.posture;
  return best;
}
/** Active advisories scoped to this payee — these override trusted status. */
export function advisoriesTargeting(payeeName: string): Threat[] {
  const n = (payeeName || "").toLowerCase();
  return activeThreats().filter((t) => t.targetPayee && n.includes(t.targetPayee.toLowerCase()));
}
export function toggleThreat(id: string): Threat | undefined {
  const t = threats.find((x) => x.id === id);
  if (t) t.active = !t.active;
  return t;
}

export function getTransactions(accountId?: string): Transaction[] {
  return accountId ? transactions.filter((t) => t.accountId === accountId) : transactions;
}

export function addTransaction(accountId: string, desc: string, amountPence: number): void {
  transactions.unshift({ id: `t_${Date.now()}`, accountId, desc, date: "Today", amountPence });
}

export function getAccount(id: string): Account | undefined {
  return accounts.find((a) => a.id === id);
}

export function getPayee(id: string): Payee | undefined {
  return payees.find((p) => p.id === id);
}

export function addPayee(p: Omit<Payee, "id" | "addedAt" | "isNew">): Payee {
  const payee: Payee = {
    ...p,
    id: `payee_${Date.now()}`,
    addedAt: new Date().toISOString(),
    isNew: true,
  };
  payees.push(payee);
  return payee;
}

export function debit(accountId: string, amountPence: number): void {
  const acc = getAccount(accountId);
  if (acc) acc.balancePence -= amountPence;
}

/** Restore the demo scenario to a clean slate between run-throughs. */
export function resetDemo(): void {
  accounts.splice(0, accounts.length, ...seedAccounts());
  payees.splice(0, payees.length, ...seedPayees());
  transactions.splice(0, transactions.length, ...seedTransactions());
  threats.splice(0, threats.length, ...seedThreats());
  payments.length = 0;
}
