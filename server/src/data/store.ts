// In-memory data store + seed scenario.
// Swap this module for a real DB later — every other module depends only on
// these accessor functions, not on the storage mechanism.
//
// Seed data mirrors the team demo plan (ewoo/telp-demo PLAN.md): customer
// Alex Morgan, Vault Premier, three accounts, three trusted payees.

import type { Account, Payee, Payment, Transaction } from "../types.js";

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

export const accounts: Account[] = seedAccounts();
export const payees: Payee[] = seedPayees();
export const payments: Payment[] = [];
export const transactions: Transaction[] = seedTransactions();

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
  payments.length = 0;
}
