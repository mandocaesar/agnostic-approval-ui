-- AlterTable
ALTER TABLE "ApprovalFlow" ADD COLUMN     "activeVersionId" TEXT;

-- AlterTable
ALTER TABLE "FlowVersion" ADD COLUMN     "isActive" BOOLEAN NOT NULL DEFAULT false;

-- CreateIndex
CREATE INDEX "FlowVersion_flowId_isActive_idx" ON "FlowVersion"("flowId", "isActive");
