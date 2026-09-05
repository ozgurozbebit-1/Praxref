-- CreateSchema
CREATE SCHEMA IF NOT EXISTS "public";

-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('CLINICIAN', 'PARENT');
CREATE TYPE "GameType" AS ENUM ('FOCUS_HUNT', 'SELECTIVE_ATTENTION', 'INHIBITION', 'WORKING_MEMORY');
CREATE TYPE "SessionStatus" AS ENUM ('PLANNED', 'ACTIVE', 'COMPLETED', 'ABANDONED');
CREATE TYPE "ErrorType" AS ENUM ('OMISSION', 'COMMISSION', 'IMPULSIVE', 'TIMEOUT', 'OTHER');

-- CreateTable
CREATE TABLE "User" ("id" TEXT NOT NULL, "email" TEXT NOT NULL, "name" TEXT NOT NULL, "role" "UserRole" NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "User_pkey" PRIMARY KEY ("id"));
CREATE TABLE "Clinician" ("id" TEXT NOT NULL, "userId" TEXT NOT NULL, CONSTRAINT "Clinician_pkey" PRIMARY KEY ("id"));
CREATE TABLE "Parent" ("id" TEXT NOT NULL, "userId" TEXT NOT NULL, CONSTRAINT "Parent_pkey" PRIMARY KEY ("id"));
CREATE TABLE "Child" ("id" TEXT NOT NULL, "displayName" TEXT NOT NULL, "clinicianId" TEXT NOT NULL, "parentId" TEXT, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "Child_pkey" PRIMARY KEY ("id"));
CREATE TABLE "Session" ("id" TEXT NOT NULL, "childId" TEXT NOT NULL, "status" "SessionStatus" NOT NULL DEFAULT 'PLANNED', "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "Session_pkey" PRIMARY KEY ("id"));
CREATE TABLE "GameRun" ("id" TEXT NOT NULL, "childId" TEXT NOT NULL, "sessionId" TEXT NOT NULL, "gameType" "GameType" NOT NULL, "difficulty" INTEGER NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "GameRun_pkey" PRIMARY KEY ("id"));
CREATE TABLE "GameTrial" ("id" TEXT NOT NULL, "childId" TEXT NOT NULL, "sessionId" TEXT NOT NULL, "gameType" "GameType" NOT NULL, "difficulty" INTEGER NOT NULL, "expectedResponse" TEXT NOT NULL, "actualResponse" TEXT, "correct" BOOLEAN NOT NULL, "reactionTimeMs" INTEGER, "errorType" "ErrorType", "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "GameTrial_pkey" PRIMARY KEY ("id"));
CREATE TABLE "DifficultyState" ("id" TEXT NOT NULL, "childId" TEXT NOT NULL, "gameType" "GameType" NOT NULL, "level" INTEGER NOT NULL DEFAULT 1, CONSTRAINT "DifficultyState_pkey" PRIMARY KEY ("id"));
CREATE TABLE "CognitiveScore" ("id" TEXT NOT NULL, "childId" TEXT NOT NULL, "sessionId" TEXT, "sustainedAttention" INTEGER NOT NULL, "selectiveAttention" INTEGER NOT NULL, "inhibition" INTEGER NOT NULL, "workingMemory" INTEGER NOT NULL, "reactionTimeStability" INTEGER NOT NULL, "sessionAdherence" INTEGER NOT NULL, "calculatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "CognitiveScore_pkey" PRIMARY KEY ("id"));
CREATE TABLE "WeeklyReport" ("id" TEXT NOT NULL, "childId" TEXT NOT NULL, "weekStart" TIMESTAMP(3) NOT NULL, "summary" TEXT NOT NULL, "scoreSnapshot" JSONB NOT NULL, CONSTRAINT "WeeklyReport_pkey" PRIMARY KEY ("id"));
CREATE TABLE "ClinicianNote" ("id" TEXT NOT NULL, "childId" TEXT NOT NULL, "clinicianId" TEXT NOT NULL, "body" TEXT NOT NULL, "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP, CONSTRAINT "ClinicianNote_pkey" PRIMARY KEY ("id"));

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
CREATE UNIQUE INDEX "Clinician_userId_key" ON "Clinician"("userId");
CREATE UNIQUE INDEX "Parent_userId_key" ON "Parent"("userId");
CREATE UNIQUE INDEX "DifficultyState_childId_gameType_key" ON "DifficultyState"("childId", "gameType");
CREATE UNIQUE INDEX "WeeklyReport_childId_weekStart_key" ON "WeeklyReport"("childId", "weekStart");

-- AddForeignKey
ALTER TABLE "Clinician" ADD CONSTRAINT "Clinician_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Parent" ADD CONSTRAINT "Parent_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Child" ADD CONSTRAINT "Child_clinicianId_fkey" FOREIGN KEY ("clinicianId") REFERENCES "Clinician"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Child" ADD CONSTRAINT "Child_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "Parent"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "Session" ADD CONSTRAINT "Session_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GameRun" ADD CONSTRAINT "GameRun_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GameRun" ADD CONSTRAINT "GameRun_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GameTrial" ADD CONSTRAINT "GameTrial_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "GameTrial" ADD CONSTRAINT "GameTrial_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "DifficultyState" ADD CONSTRAINT "DifficultyState_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CognitiveScore" ADD CONSTRAINT "CognitiveScore_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "CognitiveScore" ADD CONSTRAINT "CognitiveScore_sessionId_fkey" FOREIGN KEY ("sessionId") REFERENCES "Session"("id") ON DELETE SET NULL ON UPDATE CASCADE;
ALTER TABLE "WeeklyReport" ADD CONSTRAINT "WeeklyReport_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ClinicianNote" ADD CONSTRAINT "ClinicianNote_childId_fkey" FOREIGN KEY ("childId") REFERENCES "Child"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "ClinicianNote" ADD CONSTRAINT "ClinicianNote_clinicianId_fkey" FOREIGN KEY ("clinicianId") REFERENCES "Clinician"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
