-- Additive, backward-compatible ledger for deliberate balance reconciliations.
-- Does not modify or backfill existing account balances or transactions.
CREATE TABLE "AccountBalanceReconciliation" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "accountId" TEXT NOT NULL,
  "deltaMinor" BIGINT NOT NULL,
  "balanceBeforeMinor" BIGINT NOT NULL,
  "balanceAfterMinor" BIGINT NOT NULL,
  "occurredOn" DATE NOT NULL,
  "note" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "AccountBalanceReconciliation_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "AccountBalanceReconciliation_workspaceId_occurredOn_idx"
  ON "AccountBalanceReconciliation"("workspaceId","occurredOn");
CREATE INDEX "AccountBalanceReconciliation_accountId_occurredOn_idx"
  ON "AccountBalanceReconciliation"("accountId","occurredOn");

ALTER TABLE "AccountBalanceReconciliation"
 ADD CONSTRAINT "AccountBalanceReconciliation_workspaceId_fkey"
 FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AccountBalanceReconciliation"
 ADD CONSTRAINT "AccountBalanceReconciliation_accountId_fkey"
 FOREIGN KEY ("accountId") REFERENCES "Account"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AccountBalanceReconciliation"
 ADD CONSTRAINT "AccountBalanceReconciliation_nonzero_delta"
 CHECK ("deltaMinor" <> 0 AND "balanceAfterMinor" - "balanceBeforeMinor" = "deltaMinor");
