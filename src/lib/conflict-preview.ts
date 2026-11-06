import type {FinanceData} from './finance';

export type WorkspaceCounts = {
  accounts: number;
  transactions: number;
  goals: number;
  cards: number;
  recurrences: number;
  transfers: number;
};
export type ConflictPreview = {device: WorkspaceCounts; cloud: WorkspaceCounts; cloudRevision: number};

/** Read-only diagnostic; never selects or mutates a user's financial data. */
export function countWorkspaceEntries(data: FinanceData): WorkspaceCounts {
  return {
    accounts: data.accounts.length,
    transactions: data.transactions.length,
    goals: data.goals.length,
    cards: data.creditCards?.length ?? 0,
    recurrences: data.recurringRules?.length ?? 0,
    transfers: data.transfers?.length ?? 0,
  };
}

export function describeWorkspaceConflict(device: FinanceData, cloud: FinanceData, cloudRevision: number): ConflictPreview {
  return {device: countWorkspaceEntries(device), cloud: countWorkspaceEntries(cloud), cloudRevision};
}
