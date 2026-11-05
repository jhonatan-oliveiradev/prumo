-- AlterTable
ALTER TABLE "Transaction" ADD COLUMN     "recurringScheduledOn" DATE;

-- AlterTable
ALTER TABLE "RecurringRule" ADD COLUMN     "clientId" TEXT,
ADD COLUMN     "generatedThroughOn" DATE,
ADD COLUMN     "space" TEXT NOT NULL DEFAULT 'personal';

-- CreateIndex
CREATE UNIQUE INDEX "Transaction_workspaceId_recurringRuleId_recurringScheduledO_key" ON "Transaction"("workspaceId", "recurringRuleId", "recurringScheduledOn");

-- CreateIndex
CREATE UNIQUE INDEX "RecurringRule_workspaceId_clientId_key" ON "RecurringRule"("workspaceId", "clientId");

