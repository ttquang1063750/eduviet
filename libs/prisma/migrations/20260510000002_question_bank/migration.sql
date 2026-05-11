-- ============================================================
-- Migration: replace_exercise_with_question_bank
-- Replaces Exercise (1:N) with Question bank + LessonQuestion junction
-- ============================================================

-- Step 1: Create QuestionType enum (superset of ExerciseType + SINGLE_CHOICE)
-- CreateEnum
CREATE TYPE "QuestionType" AS ENUM ('SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'FILL_IN_BLANK', 'SHORT_ANSWER', 'ESSAY', 'DRAWING');

-- Step 2: Create questions table
-- CreateTable
CREATE TABLE "questions" (
    "id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "type" "QuestionType" NOT NULL,
    "content" TEXT NOT NULL,
    "options" JSONB,
    "correct_answer" JSONB NOT NULL,
    "explanation" TEXT,
    "hints" JSONB NOT NULL DEFAULT '[]',
    "points" INTEGER NOT NULL DEFAULT 10,
    "difficulty" "Difficulty",
    "tags" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    "creator_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deleted_at" TIMESTAMP(3),

    CONSTRAINT "questions_pkey" PRIMARY KEY ("id")
);

-- Step 3: Create lesson_questions junction table
-- CreateTable
CREATE TABLE "lesson_questions" (
    "id" TEXT NOT NULL,
    "lesson_id" TEXT NOT NULL,
    "question_id" TEXT NOT NULL,
    "order_index" INTEGER NOT NULL DEFAULT 0,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "lesson_questions_pkey" PRIMARY KEY ("id")
);

-- Step 4: Migrate existing exercise data → questions
-- Join with lessons to get subject_id and creator_id (exercises had neither)
INSERT INTO "questions" (
    "id", "subject_id", "type", "content",
    "options", "correct_answer", "explanation", "hints",
    "points", "creator_id", "created_at", "updated_at"
)
SELECT
    e."id",
    l."subject_id",
    e."type"::TEXT::"QuestionType",
    e."question",
    e."options",
    e."correct_answer",
    e."explanation",
    e."hints",
    e."points",
    l."creator_id",
    e."created_at",
    e."updated_at"
FROM "exercises" e
JOIN "lessons" l ON l."id" = e."lesson_id";

-- Step 5: Migrate exercise-lesson links → lesson_questions
INSERT INTO "lesson_questions" ("id", "lesson_id", "question_id", "order_index", "created_at")
SELECT
    gen_random_uuid()::TEXT,
    e."lesson_id",
    e."id",
    e."order_index",
    e."created_at"
FROM "exercises" e;

-- Step 6: Add randomize_questions column to lessons
-- AlterTable
ALTER TABLE "lessons" ADD COLUMN "randomize_questions" BOOLEAN NOT NULL DEFAULT false;

-- Step 7: Add indexes to questions
-- CreateIndex
CREATE INDEX "questions_subject_id_idx" ON "questions"("subject_id");

-- CreateIndex
CREATE INDEX "questions_creator_id_idx" ON "questions"("creator_id");

-- Step 8: Add indexes + unique constraint to lesson_questions
-- CreateIndex
CREATE UNIQUE INDEX "lesson_questions_lesson_id_question_id_key" ON "lesson_questions"("lesson_id", "question_id");

-- CreateIndex
CREATE INDEX "lesson_questions_lesson_id_idx" ON "lesson_questions"("lesson_id");

-- CreateIndex
CREATE INDEX "lesson_questions_question_id_idx" ON "lesson_questions"("question_id");

-- Step 9: Add FK constraints
-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_subject_id_fkey"
    FOREIGN KEY ("subject_id") REFERENCES "subjects"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "questions" ADD CONSTRAINT "questions_creator_id_fkey"
    FOREIGN KEY ("creator_id") REFERENCES "users"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_questions" ADD CONSTRAINT "lesson_questions_lesson_id_fkey"
    FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_questions" ADD CONSTRAINT "lesson_questions_question_id_fkey"
    FOREIGN KEY ("question_id") REFERENCES "questions"("id")
    ON DELETE RESTRICT ON UPDATE CASCADE;

-- Step 10: Drop exercises table (data already migrated above)
-- DropTable
DROP TABLE "exercises";

-- Step 11: Drop old ExerciseType enum (no longer referenced)
-- DropEnum
DROP TYPE "ExerciseType";
