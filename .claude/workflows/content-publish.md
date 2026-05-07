---
name: content-publish
description: Workflow soạn thảo → review → duyệt → publish cho bài học và tin tức. Hỗ trợ cả thủ công và tự động.
---

# Content Publish Workflow

## Các trạng thái nội dung
```
DRAFT → IN_REVIEW → APPROVED → PUBLISHED
                 ↓                    ↓
             REJECTED             ARCHIVED
```

## Roles tham gia

| Bước | Role | Hành động |
|------|------|-----------|
| Soạn thảo | `CONTENT_CREATOR` | Tạo/sửa DRAFT |
| Submit review | `CONTENT_CREATOR` | Chuyển DRAFT → IN_REVIEW |
| Review | `CONTENT_REVIEWER` | Approve/Reject với note |
| Duyệt publish | `CONTENT_APPROVER` | APPROVED → PUBLISHED |
| Quản lý | `SCHOOL_ADMIN`+ | Archive, force-publish |

## Luồng thủ công (Manual)

### 1. CONTENT_CREATOR soạn bài
```
POST /api/lessons
     body: { title, subjectId, grade, topic, difficulty, theory, estimatedMinutes }
     → Tạo với status: DRAFT

PATCH /api/lessons/:id
     → Cập nhật DRAFT (chỉ creator hoặc admin)

POST /api/lessons/:id/submit-review
     → Chuyển DRAFT → IN_REVIEW
     → Tự động notify CONTENT_REVIEWER qua in-app notification
```

### 2. CONTENT_REVIEWER review
```
GET  /api/lessons?status=IN_REVIEW
     → Danh sách bài chờ review (chỉ REVIEWER/APPROVER/ADMIN xem được)

POST /api/lessons/:id/review
     body: { action: 'approve' }
     → Chuyển IN_REVIEW → APPROVED, set reviewerId

POST /api/lessons/:id/review
     body: { action: 'reject', note: 'Lý do từ chối...' }
     → Chuyển IN_REVIEW → REJECTED, lưu reviewNote
     → Tự động notify CONTENT_CREATOR với lý do
```

### 3. CONTENT_APPROVER publish
```
POST /api/lessons/:id/publish
     → Chuyển APPROVED → PUBLISHED, set publishedAt = now()
     → Tự động notify CONTENT_CREATOR
```

## Các API endpoints thực tế (đã implement)

```
POST   /api/lessons                   # Tạo draft — CONTENT_CREATOR+
GET    /api/lessons                   # List (filter by status cho admin)
GET    /api/lessons/:slug             # Chi tiết (ẩn correctAnswer với non-admin)
PATCH  /api/lessons/:id               # Cập nhật — creator hoặc admin
POST   /api/lessons/:id/submit-review # DRAFT → IN_REVIEW
POST   /api/lessons/:id/review        # IN_REVIEW → APPROVED/REJECTED (body: { action, note? })
POST   /api/lessons/:id/publish       # APPROVED → PUBLISHED
```

**Lưu ý quan trọng:** `review` dùng một endpoint duy nhất với `action: 'approve' | 'reject'`, không tách thành approve-review/reject-review riêng.

## Luồng tự động (Automated)

Dùng agent `content-seeder` để tạo bài tự động theo cấp độ:

```bash
# Trong Claude Code
pnpm seed:content -- --subject=MATH --grade=10 --topic="Hàm số" --count=5
```

Bài tự động tạo luôn ở DRAFT — vẫn phải qua review workflow trước khi publish.

### Automated schedule
Có thể setup cron job để tự động publish bài đã được duyệt (APPROVED) vào giờ cố định:
```
Mỗi ngày 6:00 sáng → publish các bài có scheduledAt <= now()
```

## Notification tự động (chưa implement đầy đủ)

| Sự kiện | Người nhận | Kênh hiện tại |
|---------|-----------|---------------|
| Bài submit review | REVIEWER | In-app (NotificationsService) |
| Review rejected | CREATOR | In-app (NotificationsService) |
| Published | CREATOR | In-app (NotificationsService) |
| *(Email/SMS chưa connect — BullMQ queue chưa implement)* | | |

## Audit log bắt buộc
Mọi transition trạng thái được log tự động qua `writeAuditLog()` trong LessonsService:
```typescript
// Ví dụ trong service.submitForReview():
await writeAuditLog(this.prisma, {
  userId: actorId,
  action: 'LESSON_SUBMITTED_FOR_REVIEW',
  resourceType: 'LESSON',
  resourceId: lesson.id,
  details: { from: 'DRAFT', to: 'IN_REVIEW' },
});
```

## Blog content (đã implement — tương tự Lessons)
```
POST   /api/blog/posts               # Tạo post (DRAFT)
POST   /api/blog/posts/:id/publish   # Publish
GET    /api/blog/posts               # List published posts
GET    /api/blog/posts/:slug         # Chi tiết
POST   /api/blog/posts/:id/comments  # Thêm comment
POST   /api/blog/comments/:id/hide   # Ẩn comment (moderator)
DELETE /api/blog/comments/:id        # Xóa comment (moderator)
```
