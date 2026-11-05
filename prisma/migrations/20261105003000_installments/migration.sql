ALTER TABLE "Transaction"
  ADD COLUMN "installmentGroupId" TEXT,
  ADD COLUMN "installmentNumber" INTEGER,
  ADD COLUMN "installmentCount" INTEGER;
CREATE INDEX "Transaction_workspaceId_installmentGroupId_idx" ON "Transaction"("workspaceId", "installmentGroupId");
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_installment_valid" CHECK (
  ("installmentGroupId" IS NULL AND "installmentNumber" IS NULL AND "installmentCount" IS NULL)
  OR ("installmentGroupId" IS NOT NULL AND "installmentNumber" IS NOT NULL AND "installmentCount" IS NOT NULL
    AND "kind" = 'EXPENSE' AND "installmentCount" BETWEEN 2 AND 60 AND "installmentNumber" BETWEEN 1 AND "installmentCount")
);
