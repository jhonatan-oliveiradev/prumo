CREATE TABLE "CreditCard" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL,
    "limitMinor" BIGINT NOT NULL,
    "closingDay" INTEGER NOT NULL,
    "dueDay" INTEGER NOT NULL,
    "space" TEXT NOT NULL DEFAULT 'personal',
    CONSTRAINT "CreditCard_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CreditCard_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "CreditCard_workspaceId_clientId_key" ON "CreditCard"("workspaceId", "clientId");

CREATE TABLE "CreditPurchase" (
    "id" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "cardId" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "amountMinor" BIGINT NOT NULL,
    "purchasedOn" DATE NOT NULL,
    "category" TEXT NOT NULL,
    "installments" INTEGER NOT NULL,
    CONSTRAINT "CreditPurchase_pkey" PRIMARY KEY ("id"),
    CONSTRAINT "CreditPurchase_cardId_fkey" FOREIGN KEY ("cardId") REFERENCES "CreditCard"("id") ON DELETE CASCADE ON UPDATE CASCADE
);
CREATE UNIQUE INDEX "CreditPurchase_cardId_clientId_key" ON "CreditPurchase"("cardId", "clientId");

ALTER TABLE "Transaction" ADD COLUMN "creditCardId" TEXT, ADD COLUMN "creditInvoiceCycle" TEXT;
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_creditCardId_fkey" FOREIGN KEY ("creditCardId") REFERENCES "CreditCard"("id") ON DELETE NO ACTION ON UPDATE CASCADE;
CREATE UNIQUE INDEX "Transaction_creditCardId_creditInvoiceCycle_key" ON "Transaction"("creditCardId", "creditInvoiceCycle");
ALTER TABLE "Transaction" ADD CONSTRAINT "Transaction_credit_invoice_fields_check"
    CHECK (("creditCardId" IS NULL) = ("creditInvoiceCycle" IS NULL));
