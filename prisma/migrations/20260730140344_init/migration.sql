-- CreateEnum
CREATE TYPE "Role" AS ENUM ('STUDENT', 'CONTENT_EDITOR', 'ADMIN');

-- CreateEnum
CREATE TYPE "TestType" AS ENUM ('ACADEMIC', 'GENERAL');

-- CreateEnum
CREATE TYPE "ModuleType" AS ENUM ('LISTENING', 'READING', 'WRITING', 'SPEAKING');

-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('MULTIPLE_CHOICE', 'TRUE_FALSE_NOT_GIVEN', 'MATCHING_HEADINGS', 'SENTENCE_COMPLETION', 'MAP_LABELING');

-- CreateEnum
CREATE TYPE "AttemptStatus" AS ENUM ('IN_PROGRESS', 'SUBMITTED', 'EXPIRED', 'ABANDONED');

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "clerkId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "role" "Role" NOT NULL DEFAULT 'STUDENT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SavedProgress" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "testAttemptId" TEXT NOT NULL,
    "responsesJson" JSONB NOT NULL,
    "flaggedJson" JSONB NOT NULL,
    "remainingSeconds" INTEGER NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "SavedProgress_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Test" (
    "id" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "type" "TestType" NOT NULL,
    "isPublished" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Test_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Module" (
    "id" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "type" "ModuleType" NOT NULL,
    "order" INTEGER NOT NULL,
    "timeLimitMinutes" INTEGER NOT NULL,

    CONSTRAINT "Module_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Passage" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "bodyText" TEXT NOT NULL,

    CONSTRAINT "Passage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "AudioTrack" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "audioUrl" TEXT NOT NULL,
    "durationSeconds" INTEGER NOT NULL,
    "transcript" TEXT,

    CONSTRAINT "AudioTrack_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionGroup" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "passageId" TEXT,
    "audioTrackId" TEXT,
    "type" "QuestionType" NOT NULL,
    "order" INTEGER NOT NULL,
    "instructions" TEXT NOT NULL,
    "groupData" JSONB,

    CONSTRAINT "QuestionGroup_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Question" (
    "id" TEXT NOT NULL,
    "groupId" TEXT NOT NULL,
    "order" INTEGER NOT NULL,
    "prompt" TEXT,
    "points" DOUBLE PRECISION NOT NULL DEFAULT 1,
    "data" JSONB,
    "correctAnswer" JSONB NOT NULL,

    CONSTRAINT "Question_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WritingTask" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "taskNumber" INTEGER NOT NULL,
    "prompt" TEXT NOT NULL,
    "imageUrl" TEXT,
    "minWords" INTEGER NOT NULL,
    "timeLimitMinutes" INTEGER NOT NULL,

    CONSTRAINT "WritingTask_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpeakingPart" (
    "id" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "partNumber" INTEGER NOT NULL,
    "cueCardText" TEXT,
    "prepTimeSeconds" INTEGER,
    "speakingTimeSeconds" INTEGER,
    "questions" JSONB NOT NULL,

    CONSTRAINT "SpeakingPart_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "WritingResponse" (
    "id" TEXT NOT NULL,
    "moduleAttemptId" TEXT NOT NULL,
    "writingTaskId" TEXT NOT NULL,
    "responseText" TEXT NOT NULL,
    "wordCount" INTEGER NOT NULL,
    "timeSpentSeconds" INTEGER NOT NULL DEFAULT 0,
    "submittedAt" TIMESTAMP(3),

    CONSTRAINT "WritingResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "SpeakingResponse" (
    "id" TEXT NOT NULL,
    "moduleAttemptId" TEXT NOT NULL,
    "speakingPartId" TEXT NOT NULL,
    "audioUrl" TEXT NOT NULL,
    "durationSeconds" INTEGER NOT NULL,
    "submittedAt" TIMESTAMP(3),

    CONSTRAINT "SpeakingResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestAttempt" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "testId" TEXT NOT NULL,
    "status" "AttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "submittedAt" TIMESTAMP(3),
    "overallBand" DOUBLE PRECISION,

    CONSTRAINT "TestAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ModuleAttempt" (
    "id" TEXT NOT NULL,
    "testAttemptId" TEXT NOT NULL,
    "moduleId" TEXT NOT NULL,
    "rawScore" DOUBLE PRECISION,
    "maxRawScore" DOUBLE PRECISION,
    "bandScore" DOUBLE PRECISION,
    "examinerNotes" TEXT,
    "timeSpentSeconds" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ModuleAttempt_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuestionResponse" (
    "id" TEXT NOT NULL,
    "moduleAttemptId" TEXT NOT NULL,
    "questionId" TEXT NOT NULL,
    "userAnswer" JSONB,
    "isCorrect" BOOLEAN,
    "timeSpentSeconds" INTEGER NOT NULL DEFAULT 0,
    "flagged" BOOLEAN NOT NULL DEFAULT false,
    "answeredAt" TIMESTAMP(3),

    CONSTRAINT "QuestionResponse_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "BandScoreConversion" (
    "id" TEXT NOT NULL,
    "testType" "TestType" NOT NULL,
    "moduleType" "ModuleType" NOT NULL,
    "minRaw" INTEGER NOT NULL,
    "maxRaw" INTEGER NOT NULL,
    "band" DOUBLE PRECISION NOT NULL,

    CONSTRAINT "BandScoreConversion_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "User_clerkId_key" ON "User"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE INDEX "User_clerkId_idx" ON "User"("clerkId");

-- CreateIndex
CREATE UNIQUE INDEX "SavedProgress_testAttemptId_key" ON "SavedProgress"("testAttemptId");

-- CreateIndex
CREATE INDEX "SavedProgress_userId_idx" ON "SavedProgress"("userId");

-- CreateIndex
CREATE INDEX "Test_type_isPublished_idx" ON "Test"("type", "isPublished");

-- CreateIndex
CREATE INDEX "Module_testId_idx" ON "Module"("testId");

-- CreateIndex
CREATE UNIQUE INDEX "Module_testId_type_key" ON "Module"("testId", "type");

-- CreateIndex
CREATE INDEX "Passage_moduleId_idx" ON "Passage"("moduleId");

-- CreateIndex
CREATE INDEX "AudioTrack_moduleId_idx" ON "AudioTrack"("moduleId");

-- CreateIndex
CREATE INDEX "QuestionGroup_moduleId_idx" ON "QuestionGroup"("moduleId");

-- CreateIndex
CREATE INDEX "QuestionGroup_passageId_idx" ON "QuestionGroup"("passageId");

-- CreateIndex
CREATE INDEX "QuestionGroup_audioTrackId_idx" ON "QuestionGroup"("audioTrackId");

-- CreateIndex
CREATE INDEX "Question_groupId_idx" ON "Question"("groupId");

-- CreateIndex
CREATE INDEX "WritingTask_moduleId_idx" ON "WritingTask"("moduleId");

-- CreateIndex
CREATE UNIQUE INDEX "WritingTask_moduleId_taskNumber_key" ON "WritingTask"("moduleId", "taskNumber");

-- CreateIndex
CREATE INDEX "SpeakingPart_moduleId_idx" ON "SpeakingPart"("moduleId");

-- CreateIndex
CREATE UNIQUE INDEX "SpeakingPart_moduleId_partNumber_key" ON "SpeakingPart"("moduleId", "partNumber");

-- CreateIndex
CREATE INDEX "WritingResponse_moduleAttemptId_idx" ON "WritingResponse"("moduleAttemptId");

-- CreateIndex
CREATE UNIQUE INDEX "WritingResponse_moduleAttemptId_writingTaskId_key" ON "WritingResponse"("moduleAttemptId", "writingTaskId");

-- CreateIndex
CREATE INDEX "SpeakingResponse_moduleAttemptId_idx" ON "SpeakingResponse"("moduleAttemptId");

-- CreateIndex
CREATE UNIQUE INDEX "SpeakingResponse_moduleAttemptId_speakingPartId_key" ON "SpeakingResponse"("moduleAttemptId", "speakingPartId");

-- CreateIndex
CREATE INDEX "TestAttempt_userId_idx" ON "TestAttempt"("userId");

-- CreateIndex
CREATE INDEX "TestAttempt_testId_idx" ON "TestAttempt"("testId");

-- CreateIndex
CREATE INDEX "ModuleAttempt_testAttemptId_idx" ON "ModuleAttempt"("testAttemptId");

-- CreateIndex
CREATE UNIQUE INDEX "ModuleAttempt_testAttemptId_moduleId_key" ON "ModuleAttempt"("testAttemptId", "moduleId");

-- CreateIndex
CREATE INDEX "QuestionResponse_moduleAttemptId_idx" ON "QuestionResponse"("moduleAttemptId");

-- CreateIndex
CREATE INDEX "QuestionResponse_questionId_idx" ON "QuestionResponse"("questionId");

-- CreateIndex
CREATE UNIQUE INDEX "QuestionResponse_moduleAttemptId_questionId_key" ON "QuestionResponse"("moduleAttemptId", "questionId");

-- CreateIndex
CREATE INDEX "BandScoreConversion_testType_moduleType_idx" ON "BandScoreConversion"("testType", "moduleType");

-- CreateIndex
CREATE UNIQUE INDEX "BandScoreConversion_testType_moduleType_minRaw_maxRaw_key" ON "BandScoreConversion"("testType", "moduleType", "minRaw", "maxRaw");

-- AddForeignKey
ALTER TABLE "SavedProgress" ADD CONSTRAINT "SavedProgress_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SavedProgress" ADD CONSTRAINT "SavedProgress_testAttemptId_fkey" FOREIGN KEY ("testAttemptId") REFERENCES "TestAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Module" ADD CONSTRAINT "Module_testId_fkey" FOREIGN KEY ("testId") REFERENCES "Test"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Passage" ADD CONSTRAINT "Passage_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "AudioTrack" ADD CONSTRAINT "AudioTrack_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionGroup" ADD CONSTRAINT "QuestionGroup_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionGroup" ADD CONSTRAINT "QuestionGroup_passageId_fkey" FOREIGN KEY ("passageId") REFERENCES "Passage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionGroup" ADD CONSTRAINT "QuestionGroup_audioTrackId_fkey" FOREIGN KEY ("audioTrackId") REFERENCES "AudioTrack"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Question" ADD CONSTRAINT "Question_groupId_fkey" FOREIGN KEY ("groupId") REFERENCES "QuestionGroup"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WritingTask" ADD CONSTRAINT "WritingTask_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpeakingPart" ADD CONSTRAINT "SpeakingPart_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WritingResponse" ADD CONSTRAINT "WritingResponse_moduleAttemptId_fkey" FOREIGN KEY ("moduleAttemptId") REFERENCES "ModuleAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "WritingResponse" ADD CONSTRAINT "WritingResponse_writingTaskId_fkey" FOREIGN KEY ("writingTaskId") REFERENCES "WritingTask"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpeakingResponse" ADD CONSTRAINT "SpeakingResponse_moduleAttemptId_fkey" FOREIGN KEY ("moduleAttemptId") REFERENCES "ModuleAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "SpeakingResponse" ADD CONSTRAINT "SpeakingResponse_speakingPartId_fkey" FOREIGN KEY ("speakingPartId") REFERENCES "SpeakingPart"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestAttempt" ADD CONSTRAINT "TestAttempt_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestAttempt" ADD CONSTRAINT "TestAttempt_testId_fkey" FOREIGN KEY ("testId") REFERENCES "Test"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModuleAttempt" ADD CONSTRAINT "ModuleAttempt_testAttemptId_fkey" FOREIGN KEY ("testAttemptId") REFERENCES "TestAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ModuleAttempt" ADD CONSTRAINT "ModuleAttempt_moduleId_fkey" FOREIGN KEY ("moduleId") REFERENCES "Module"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionResponse" ADD CONSTRAINT "QuestionResponse_moduleAttemptId_fkey" FOREIGN KEY ("moduleAttemptId") REFERENCES "ModuleAttempt"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuestionResponse" ADD CONSTRAINT "QuestionResponse_questionId_fkey" FOREIGN KEY ("questionId") REFERENCES "Question"("id") ON DELETE CASCADE ON UPDATE CASCADE;
