# Active Task: Lesson Assignment System — Phân công bài học theo scope

## Mục tiêu
Học sinh **chỉ thấy bài học khi được gán** (không có assignment = không thấy bài nào).
Giáo viên/admin gán bài học ở 3 mức:
- **Theo lớp**: tất cả học sinh trong lớp thấy
- **Theo trường**: tất cả học sinh trong trường thấy
- **Theo cá nhân**: chỉ một học sinh cụ thể thấy

Quyền gán: SUBJECT_TEACHER, HOMEROOM_TEACHER, SCHOOL_ADMIN, SUPER_ADMIN (+ PROVINCE/DISTRICT_ADMIN).

## Trạng thái: COMPLETED
Hoàn thành: 2026-05-17

## Phase 1: Schema + BE Core (steps 1-8)

- [x] 1. `libs/prisma/schema.prisma` — thêm `LessonAssignment` model
       ✅ Thêm `LessonAssignment` model + `ClassSubjectTeacher` model.
       ✅ Thêm relations vào Lesson, School, Class, User models.

- [x] 2. Migration `20260517000002_add_lesson_assignment`
       ✅ Đã tạo manual migration SQL.

- [x] 3. `packages/shared-types/src/lesson.types.ts` — thêm `LessonAssignment` interface + `AssignmentScope` type
       ✅ Updated shared types.

- [x] 4. `apps/backend/src/modules/lessons/lessons.repository.ts` — UPDATE `findMany()` query
       ✅ Logic filtering by studentContext implemented.

- [x] 5. `apps/backend/src/modules/lessons/lessons.service.ts` — UPDATE `list()` method
       ✅ Resolved studentContext from userId.

- [x] 6. `apps/backend/src/modules/lesson-assignments/lesson-assignments.repository.ts` — NEW
       ✅ Methods implemented.

- [x] 7. `apps/backend/src/modules/lesson-assignments/lesson-assignments.service.ts` — NEW
       ✅ RBAC for Subject/Homeroom teachers.

- [x] 8. `apps/backend/src/modules/lesson-assignments/lesson-assignments.routes.ts` — NEW
       ✅ Registered in main.ts.

## Phase 2: FE (steps 9-12)

- [x] 9. `apps/frontend/src/app/core/services/lesson-assignments.service.ts` — NEW
       ✅ Methods: `listByLesson`, `assign`, `unassign`.

- [x] 10. `apps/frontend/src/app/features/admin/lessons/components/lesson-assignment-panel.component.*` — NEW (3 files)
        ✅ Panel gán bài học dạng Tab.

- [x] 11. `apps/frontend/src/app/features/lessons/components/lesson-list.component.*` — UPDATE
        ✅ Cập nhật Empty State.

- [x] 12. `apps/frontend/src/app/features/student-dashboard/student-dashboard.component.*` — UPDATE
        ✅ Cập nhật label "Bài học được gán".


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
