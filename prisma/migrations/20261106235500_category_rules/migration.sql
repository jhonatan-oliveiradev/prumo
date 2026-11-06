-- Additive storage for ordered, explicit user-defined categorization rules.
-- Existing transactions, credit purchases and categories are unchanged.
CREATE TABLE "CategoryRule" (
  "id" TEXT NOT NULL,
  "workspaceId" TEXT NOT NULL,
  "phrase" TEXT NOT NULL,
  "categoryName" TEXT NOT NULL,
  "direction" "CategoryType" NOT NULL,
  "scope" TEXT NOT NULL DEFAULT 'all',
  "enabled" BOOLEAN NOT NULL DEFAULT true,
  "priority" INTEGER NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "CategoryRule_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "CategoryRule_workspaceId_priority_idx"
  ON "CategoryRule"("workspaceId","priority");

ALTER TABLE "CategoryRule"
 ADD CONSTRAINT "CategoryRule_workspaceId_fkey"
 FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "CategoryRule"
 ADD CONSTRAINT "CategoryRule_priority_check"
 CHECK ("priority" >= 0 AND "priority" < 50);

ALTER TABLE "CategoryRule"
 ADD CONSTRAINT "CategoryRule_scope_check"
 CHECK ("scope" IN ('all','personal','work'));
