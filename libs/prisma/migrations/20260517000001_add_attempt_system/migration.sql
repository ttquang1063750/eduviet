-- Migration: add_attempt_system
-- Adds Attempt + AttemptAnswer tables for the grading/assessment feature.
-- Also extends Lesson with time_limit_sec and max_attempts for exam config.
-- Safe: all new tables + nullable/default columns → no locking on existing rows.

-- Rollback strategy:
--   DROP TABLE IF EXISTS attempt_answers CASCADE;
--   DROP TABLE IF EXISTS attempts CASCADE;
--   DROP TYPE IF EXISTS "AttemptMode";
--   DROP TYPE IF EXISTS "AttemptStatus";
--   ALTER TABLE lessons DROP COLUMN IF EXISTS time_limit_sec;
--   ALTER TABLE lessons DROP COLUMN IF EXISTS max_attempts;

-- ─── Enums ───────────────────────────────────────────────────────────────────

CREATE TYPE "AttemptMode" AS ENUM ('PRACTICE', 'TEST', 'MOCK_EXAM');
CREATE TYPE "AttemptStatus" AS ENUM ('IN_PROGRESS', 'SUBMITTED', 'GRADED');

-- ─── Lesson exam config (nullable / default → no row locking) ────────────────

ALTER TABLE "lessons"
  ADD COLUMN "time_limit_sec" INTEGER,
  ADD COLUMN "max_attempts"   INTEGER NOT NULL DEFAULT 0;

-- ─── Attempt ─────────────────────────────────────────────────────────────────

CREATE TABLE "attempts" (
  "id"             TEXT NOT NULL,
  "student_id"     TEXT NOT NULL,
  "lesson_id"      TEXT NOT NULL,
  "mode"           "AttemptMode"   NOT NULL DEFAULT 'PRACTICE',
  "status"         "AttemptStatus" NOT NULL DEFAULT 'IN_PROGRESS',
  "started_at"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "submitted_at"   TIMESTAMP(3),
  "time_limit_sec" INTEGER,
  "total_score"    INTEGER,
  "max_score"      INTEGER,
  "created_at"     TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at"     TIMESTAMP(3) NOT NULL,

  CONSTRAINT "attempts_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "attempts_student_id_idx"            ON "attempts"("student_id");
CREATE INDEX "attempts_lesson_id_idx"             ON "attempts"("lesson_id");
CREATE INDEX "attempts_student_id_lesson_id_idx"  ON "attempts"("student_id", "lesson_id");

ALTER TABLE "attempts"
  ADD CONSTRAINT "attempts_student_id_fkey"
    FOREIGN KEY ("student_id") REFERENCES "users"("id")   ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "attempts_lesson_id_fkey"
    FOREIGN KEY ("lesson_id")  REFERENCES "lessons"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- ─── AttemptAnswer ───────────────────────────────────────────────────────────

CREATE TABLE "attempt_answers" (
  "id"           TEXT NOT NULL,
  "attempt_id"   TEXT NOT NULL,
  "question_id"  TEXT NOT NULL,
  "answer"       JSONB,
  "is_correct"   BOOLEAN,
  "score"        INTEGER,
  "feedback"     TEXT,
  "graded_by_id" TEXT,
  "graded_at"    TIMESTAMP(3),
  "created_at"   TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "attempt_answers_pkey"               PRIMARY KEY ("id"),
  CONSTRAINT "attempt_answers_attempt_question_uq" UNIQUE ("attempt_id", "question_id")
);

CREATE INDEX "attempt_answers_attempt_id_idx"  ON "attempt_answers"("attempt_id");
CREATE INDEX "attempt_answers_question_id_idx" ON "attempt_answers"("question_id");

ALTER TABLE "attempt_answers"
  ADD CONSTRAINT "attempt_answers_attempt_id_fkey"
    FOREIGN KEY ("attempt_id")   REFERENCES "attempts"("id")   ON DELETE CASCADE ON UPDATE CASCADE,
  ADD CONSTRAINT "attempt_answers_question_id_fkey"
    FOREIGN KEY ("question_id")  REFERENCES "questions"("id")  ON DELETE RESTRICT ON UPDATE CASCADE,
  ADD CONSTRAINT "attempt_answers_graded_by_id_fkey"
    FOREIGN KEY ("graded_by_id") REFERENCES "users"("id")      ON DELETE SET NULL ON UPDATE CASCADE;
