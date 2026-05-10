# EduViet — Phân quyền RBAC

## Mô hình đa vai trò (Multi-Role)

Mỗi user có thể có **nhiều roles đồng thời** — lưu dưới dạng `roles: Json` (mảng) trên model `User`.
Ngoài ra mỗi user có thể có **chức danh** (`title: String?`) là text tự do, chỉ dùng để hiển thị profile, không ảnh hưởng phân quyền.

Ví dụ hợp lệ: một người vừa là `SUBJECT_TEACHER` vừa là `CONTENT_CREATOR`.

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

### Backend — authorize() middleware (OR logic)

```typescript
import { authorize } from '../../shared/middleware/authorize';

// Trong route definition — pass nếu user có ÍT NHẤT 1 role khớp
preHandler: [authenticate, authorize('STUDENT', 'SUBJECT_TEACHER')]
```

Logic nội bộ:
```typescript
// request.user.roles là UserRole[]
const hasRole = allowedRoles.some((r) => request.user.roles.includes(r));
```

### Frontend — AuthService

```typescript
// Pass nếu user có ít nhất 1 role khớp
this.authService.hasRole('CONTENT_APPROVER', 'SUPER_ADMIN')
```

### JWT payload

```typescript
// user.roles là mảng — không còn user.role đơn
declare module '@fastify/jwt' {
  interface FastifyJWT {
    user: { id: string; email: string; roles: UserRole[]; };
  }
}
```

```typescript
// Nhóm roles hay dùng (từ shared-constants)
import { ADMIN_ROLES, CONTENT_ROLES } from '@eduviet/shared-constants';
// ADMIN_ROLES = [SUPER_ADMIN, PROVINCE_ADMIN, DISTRICT_ADMIN, SCHOOL_ADMIN]
// CONTENT_ROLES = [CONTENT_CREATOR, CONTENT_REVIEWER, CONTENT_APPROVER]
```
