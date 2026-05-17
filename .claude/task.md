# Active Task: Lesson Assignment System — Phân công bài học theo scope

## Mục tiêu
Học sinh **chỉ thấy bài học khi được gán** (không có assignment = không thấy bài nào).
Giáo viên/admin gán bài học ở 3 mức:
- **Theo lớp**: tất cả học sinh trong lớp thấy
- **Theo trường**: tất cả học sinh trong trường thấy
- **Theo cá nhân**: chỉ một học sinh cụ thể thấy

Quyền gán: SUBJECT_TEACHER, HOMEROOM_TEACHER, SCHOOL_ADMIN, SUPER_ADMIN (+ PROVINCE/DISTRICT_ADMIN).

## Trạng thái: IN_PROGRESS
Bắt đầu: 2026-05-17
Step hiện tại: 1 — Schema Prisma: LessonAssignment model

## Phase 1: Schema + BE Core (steps 1-8)

- [ ] 1. `libs/prisma/schema.prisma` — thêm `LessonAssignment` model
       ```prisma
       model LessonAssignment {
         id           String    @id @default(uuid())
         lessonId     String    @map("lesson_id")
         lesson       Lesson    @relation(fields: [lessonId], references: [id], onDelete: Cascade)
         // Exactly ONE target — school, class, or user
         schoolId     String?   @map("school_id")
         school       School?   @relation(fields: [schoolId], references: [id])
         classId      String?   @map("class_id")
         class        Class?    @relation(fields: [classId], references: [id])
         userId       String?   @map("user_id")
         user         User?     @relation("AssignedToUser", fields: [userId], references: [id])
         assignedById String    @map("assigned_by_id")
         assignedBy   User      @relation("AssignedByUser", fields: [assignedById], references: [id])
         note         String?   @db.Text
         dueDate      DateTime? @map("due_date")
         createdAt    DateTime  @default(now()) @map("created_at")
         updatedAt    DateTime  @updatedAt @map("updated_at")
         @@index([lessonId])
         @@index([schoolId])
         @@index([classId])
         @@index([userId])
         @@map("lesson_assignments")
       }
       ```
       Thêm `lessonAssignments LessonAssignment[]` relations vào Lesson, School, Class, User.

- [ ] 2. Migration `20260517000002_add_lesson_assignment`

- [ ] 3. `packages/shared-types/src/lesson.types.ts` — thêm `LessonAssignment` interface + `AssignmentScope` type

- [ ] 4. `apps/backend/src/modules/lessons/lessons.repository.ts` — UPDATE `findMany()` query
       Thêm parameter `studentId?: string` để filter lessons visible to a student:
       ```typescript
       // If studentId provided → show ONLY lessons with assignments matching:
       //   - assignment.userId === studentId  OR
       //   - assignment.classId IN (classes student is enrolled in)  OR
       //   - assignment.schoolId === student.schoolId
       ```
       Dùng Prisma `where.OR` với nested include `lessonAssignments`.

- [ ] 5. `apps/backend/src/modules/lessons/lessons.service.ts` — UPDATE `list()` method
       Nếu `userRoles` chứa STUDENT → truyền `studentId` vào repository query.
       Admin/teacher vẫn thấy tất cả PUBLISHED lessons như cũ.

- [ ] 6. `apps/backend/src/modules/lesson-assignments/lesson-assignments.repository.ts` — NEW
       Methods:
       - `create(data)` — tạo assignment
       - `delete(id)` — xoá assignment
       - `findByLesson(lessonId)` — list assignments cho một bài học
       - `findByTarget(scope, targetId)` — list assignments theo target

- [ ] 7. `apps/backend/src/modules/lesson-assignments/lesson-assignments.service.ts` — NEW
       - `assign(actorId, actorRoles, lessonId, scope, targetId, note?, dueDate?)` — tạo assignment với RBAC check:
         - SUBJECT_TEACHER: chỉ được gán cho class/user mà mình là giáo viên bộ môn trong class đó
         - HOMEROOM_TEACHER: chỉ được gán cho homeroom class của mình + học sinh trong lớp đó
         - SCHOOL_ADMIN: chỉ được gán trong phạm vi school của mình
         - SUPER_ADMIN/PROVINCE/DISTRICT: không giới hạn
       - `unassign(id, actorId, actorRoles)` — xoá assignment + RBAC
       - `listByLesson(lessonId, actorId, actorRoles)` — xem assignments của bài học

- [ ] 8. `apps/backend/src/modules/lesson-assignments/lesson-assignments.routes.ts` — NEW
       - `GET /api/lesson-assignments?lessonId=` — list assignments
       - `POST /api/lesson-assignments` — create (body: lessonId, scope, targetId, note?, dueDate?)
       - `DELETE /api/lesson-assignments/:id` — delete
       Register trong `main.ts`

## Phase 2: FE (steps 9-12)

- [ ] 9. `apps/frontend/src/app/core/services/lesson-assignments.service.ts` — NEW
       HTTP: getByLesson(), assign(), unassign()

- [ ] 10. `apps/frontend/src/app/features/admin/lessons/components/lesson-assignment-panel.component.*` — NEW (3 files)
        Panel trong lesson-admin-detail hoặc lesson-admin-list:
        - Tab/section "Phân công bài học"
        - Form: chọn scope (Trường/Lớp/Cá nhân) + target (select school/class/user) + note + dueDate
        - Table: danh sách assignments hiện tại với nút xoá

- [ ] 11. `apps/frontend/src/app/features/lessons/components/lesson-list.component.*` — UPDATE
        - Nếu user là student → gọi API với student context, hiển thị badge "Được gán bởi [teacher]"
        - Nếu không có assignment nào → empty state "Chưa có bài học nào được gán cho bạn"

- [ ] 12. `apps/frontend/src/app/features/student-dashboard/student-dashboard.component.*` — UPDATE
        - Section "Bài học được gán" thay vì "Tất cả bài học" → reflect assignment-based visibility

## Context quan trọng

### Query logic cho student lesson list
```typescript
// Prisma where clause khi studentId có:
where: {
  status: 'PUBLISHED',
  deletedAt: null,
  lessonAssignments: {
    some: {
      OR: [
        { userId: studentId },
        {
          classId: {
            in: enrolledClassIds // từ ClassEnrollment
          }
        },
        { schoolId: student.schoolId },
      ]
    }
  }
}
```

### RBAC gán bài học
| Role | Được gán cho |
|------|-------------|
| SUBJECT_TEACHER | Class/User mà mình là giáo viên bộ môn trong class đó |
| HOMEROOM_TEACHER | Homeroom class + học sinh trong lớp đó |
| SCHOOL_ADMIN | Bất kỳ school/class/user trong trường mình quản lý |
| SUPER_ADMIN/PROVINCE/DISTRICT | Không giới hạn |

### Constraint
- Mỗi (lessonId, schoolId/classId/userId) là unique — không gán trùng
- Khi xoá class/school/user → cascade delete assignments liên quan
- Student không thể gán bài học
- Parent không thể gán bài học

### scope values
```typescript
type AssignmentScope = 'SCHOOL' | 'CLASS' | 'USER';
```

## Files đã tạo/sửa
(Điền khi thực thi)

## Bước tiếp theo sau task này
- Notification khi có bài học mới được gán
- Thống kê tiến độ hoàn thành bài học theo lớp/trường (cho teacher/admin)
