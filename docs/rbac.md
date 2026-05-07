# EduViet — Phân quyền RBAC

## Roles hệ thống

| Role | Mô tả |
|------|--------|
| `SUPER_ADMIN` | Quản trị toàn quốc |
| `PROVINCE_ADMIN` | Quản trị cấp tỉnh |
| `DISTRICT_ADMIN` | Quản trị cấp huyện/khu vực |
| `SCHOOL_ADMIN` | Quản trị cấp trường |
| `CONTENT_CREATOR` | Người soạn thảo bài học/tin tức |
| `CONTENT_REVIEWER` | Người review nội dung |
| `CONTENT_APPROVER` | Người duyệt và publish |
| `GRADER` | Người chấm điểm |
| `HOMEROOM_TEACHER` | Giáo viên chủ nhiệm |
| `SUBJECT_TEACHER` | Giáo viên bộ môn |
| `STUDENT` | Học sinh |
| `PARENT` | Phụ huynh |

## Phân cấp địa lý trường học

```
Nation (Quốc gia)
  └── Province (Tỉnh/Thành phố)
        └── District (Quận/Huyện)
              └── School (Trường)
                    └── Class (Lớp)
                          └── Student (Học sinh)
```

## Content workflow

```
DRAFT → REVIEW → APPROVED → PUBLISHED
         ↓                    ↓
       REJECTED            ARCHIVED
```

- `CONTENT_CREATOR` tạo DRAFT
- `CONTENT_REVIEWER` chuyển → REVIEW hoặc REJECTED
- `CONTENT_APPROVER` chuyển → APPROVED → PUBLISHED

## Chat RBAC (per room type)

| Room type | Ai được tham gia |
|-----------|-----------------|
| `CLASS` | Mọi thành viên lớp (STUDENT, SUBJECT_TEACHER, HOMEROOM_TEACHER, SCHOOL_ADMIN) |
| `TEACHER_PARENT` | Giáo viên + phụ huynh học sinh cùng lớp |
| `ONE_ON_ONE` | Chỉ 2 người tham gia |

## Implementation

```typescript
// Backend — middleware
import { authorize } from '../../shared/middleware/authorize';

// Trong route definition
preHandler: [authenticate, authorize('STUDENT', 'SUBJECT_TEACHER')]
```

```typescript
// Nhóm roles hay dùng (từ shared-constants)
import { ADMIN_ROLES, CONTENT_ROLES } from '@eduviet/shared-constants';
// ADMIN_ROLES = [SUPER_ADMIN, PROVINCE_ADMIN, DISTRICT_ADMIN, SCHOOL_ADMIN]
// CONTENT_ROLES = [CONTENT_CREATOR, CONTENT_REVIEWER, CONTENT_APPROVER]
```
