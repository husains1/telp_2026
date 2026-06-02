// Shared domain types for the Fortress backend.
// Kept framework-free so the web client can mirror these shapes.

export interface Account {
  id: string;
  name: string;
  sortCode: string;
  accountNumber: string;
  type: "current" | "savings";
  balancePence: number;
}

export interface Payee {
  id: string;
  name: string;
  sortCode: string;
  accountNumber: string;
  /** When the payee was first added — new payees are higher risk. */
  addedAt: string;
  isNew: boolean;
}

export type PaymentStatus =
  | "cleared" // released to the rails
  | "review_required" // intervention session open
  | "held" // held pending human review (the "save")
  | "released" // human/customer cleared it after a hold
  | "cancelled"; // customer abandoned it

export interface Payment {
  id: string;
  fromAccountId: string;
  payeeId: string;
  amountPence: number;
  reference: string;
  markedUrgent: boolean;
  status: PaymentStatus;
  createdAt: string;
}

/** Append-only, hash-chained audit entry — the compliance backbone. */
export interface AuditEntry {
  seq: number;
  timestamp: string;
  actor: string; // "customer" | "rules-engine" | "ai-analyst" | "ops-review"
  action: string;
  details: Record<string, unknown>;
  prevHash: string;
  hash: string;
}
