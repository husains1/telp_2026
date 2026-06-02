// In-memory data store + seed scenario.
// Swap this module for a real DB later — every other module depends only on
// these accessor functions, not on the storage mechanism.

import type { Account, Payee, Payment } from "../types.js";

export const accounts: Account[] = [
  {
    id: "acc_current",
    name: "Everyday Current",
    sortCode: "04-29-11",
    accountNumber: "10293847",
    type: "current",
    balancePence: 842_15,
  },
  {
    id: "acc_savings",
    name: "Fortress Savings",
    sortCode: "04-29-11",
    accountNumber: "55619203",
    type: "savings",
    balancePence: 12_500_00,
  },
];

export const payees: Payee[] = [
  {
    id: "payee_landlord",
    name: "J Okafor (Rent)",
    sortCode: "20-00-00",
    accountNumber: "31114520",
    addedAt: "2023-08-01T09:00:00.000Z",
    isNew: false,
  },
];

export const payments: Payment[] = [];

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
  accounts[0].balancePence = 842_15;
  accounts[1].balancePence = 12_500_00;
  payees.length = 1;
  payments.length = 0;
}
