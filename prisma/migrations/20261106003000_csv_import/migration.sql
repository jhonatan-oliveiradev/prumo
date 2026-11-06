ALTER TABLE "CreditPurchase"
  ADD COLUMN "importBatchId" TEXT,
  ADD COLUMN "importExternalId" TEXT,
  ADD COLUMN "statementCycle" TEXT;

CREATE UNIQUE INDEX "CreditPurchase_cardId_importExternalId_key"
  ON "CreditPurchase"("cardId", "importExternalId");

ALTER TABLE "CreditPurchase" ADD CONSTRAINT "CreditPurchase_importBatchId_fkey"
  FOREIGN KEY ("importBatchId") REFERENCES "ImportBatch"("id")
  ON DELETE SET NULL ON UPDATE CASCADE;
