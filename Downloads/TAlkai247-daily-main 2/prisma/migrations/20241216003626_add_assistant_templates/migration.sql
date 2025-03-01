-- CreateTable
CREATE TABLE "AssistantTemplate" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "tags" TEXT[],
    "type" TEXT NOT NULL,
    "systemPrompt" TEXT NOT NULL,
    "firstMessage" TEXT NOT NULL,
    "tools" JSONB NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "createdBy" TEXT,

    CONSTRAINT "AssistantTemplate_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "AssistantTemplate" ADD CONSTRAINT "AssistantTemplate_createdBy_fkey" FOREIGN KEY ("createdBy") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
