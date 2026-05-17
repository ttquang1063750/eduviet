-- CreateTable
CREATE TABLE "lesson_assignments" (
    "id" TEXT NOT NULL,
    "lesson_id" TEXT NOT NULL,
    "school_id" TEXT,
    "class_id" TEXT,
    "user_id" TEXT,
    "assigned_by_id" TEXT NOT NULL,
    "note" TEXT,
    "due_date" TIMESTAMP(3),
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "lesson_assignments_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "lesson_assignments_lesson_id_idx" ON "lesson_assignments"("lesson_id");

-- CreateIndex
CREATE INDEX "lesson_assignments_school_id_idx" ON "lesson_assignments"("school_id");

-- CreateIndex
CREATE INDEX "lesson_assignments_class_id_idx" ON "lesson_assignments"("class_id");

-- CreateIndex
CREATE INDEX "lesson_assignments_user_id_idx" ON "lesson_assignments"("user_id");

-- AddForeignKey
ALTER TABLE "lesson_assignments" ADD CONSTRAINT "lesson_assignments_lesson_id_fkey" FOREIGN KEY ("lesson_id") REFERENCES "lessons"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_assignments" ADD CONSTRAINT "lesson_assignments_school_id_fkey" FOREIGN KEY ("school_id") REFERENCES "schools"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_assignments" ADD CONSTRAINT "lesson_assignments_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_assignments" ADD CONSTRAINT "lesson_assignments_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "lesson_assignments" ADD CONSTRAINT "lesson_assignments_assigned_by_id_fkey" FOREIGN KEY ("assigned_by_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- CreateTable
CREATE TABLE "class_subject_teachers" (
    "id" TEXT NOT NULL,
    "class_id" TEXT NOT NULL,
    "subject_id" TEXT NOT NULL,
    "teacher_id" TEXT NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "class_subject_teachers_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "class_subject_teachers_class_id_idx" ON "class_subject_teachers"("class_id");

-- CreateIndex
CREATE INDEX "class_subject_teachers_teacher_id_idx" ON "class_subject_teachers"("teacher_id");

-- CreateIndex
CREATE UNIQUE INDEX "class_subject_teachers_class_id_subject_id_teacher_id_key" ON "class_subject_teachers"("class_id", "subject_id", "teacher_id");

-- AddForeignKey
ALTER TABLE "class_subject_teachers" ADD CONSTRAINT "class_subject_teachers_class_id_fkey" FOREIGN KEY ("class_id") REFERENCES "classes"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_subject_teachers" ADD CONSTRAINT "class_subject_teachers_subject_id_fkey" FOREIGN KEY ("subject_id") REFERENCES "subjects"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "class_subject_teachers" ADD CONSTRAINT "class_subject_teachers_teacher_id_fkey" FOREIGN KEY ("teacher_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
