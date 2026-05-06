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
| Review | `CONTENT_REVIEWER` | Approve/Reject với comments |
| Duyệt publish | `CONTENT_APPROVER` | Approve → PUBLISHED hoặc schedule |
| Quản lý | `SCHOOL_ADMIN`+ | Archive, force-publish |

## Luồng thủ công (Manual)

### 1. CONTENT_CREATOR soạn bài
```
POST /api/lessons (status: DRAFT)
PUT  /api/lessons/:id (cập nhật DRAFT)
POST /api/lessons/:id/submit-review
     → Tự động notify CONTENT_REVIEWER qua email + in-app
```

### 2. CONTENT_REVIEWER review
```
GET  /api/lessons?status=IN_REVIEW (xem queue review)
POST /api/lessons/:id/approve-review
     → Tự động notify CONTENT_APPROVER
POST /api/lessons/:id/reject-review
     body: { reason: "..." }
     → Tự động notify CONTENT_CREATOR với lý do
```

### 3. CONTENT_APPROVER duyệt
```
POST /api/lessons/:id/publish
     body: { scheduledAt?: Date }  // publish ngay hoặc schedule
POST /api/lessons/:id/reject
     body: { reason: "..." }
```

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

## API Endpoints liên quan

```
POST   /api/lessons                     # Tạo draft
PUT    /api/lessons/:id                 # Cập nhật
POST   /api/lessons/:id/submit-review   # Submit review
POST   /api/lessons/:id/approve-review  # Reviewer approve
POST   /api/lessons/:id/reject-review   # Reviewer reject
POST   /api/lessons/:id/publish         # Approver publish
POST   /api/lessons/:id/archive         # Archive
GET    /api/lessons/review-queue        # Danh sách chờ review

# News workflow tương tự
POST   /api/news
POST   /api/news/:id/submit-review
POST   /api/news/:id/approve-review
POST   /api/news/:id/publish
```

## Notifications tự động

| Sự kiện | Người nhận | Kênh |
|---------|-----------|------|
| Bài submit review | REVIEWER | In-app + Email |
| Review approved | APPROVER | In-app + Email |
| Review rejected | CREATOR | In-app + Email (kèm lý do) |
| Approver rejected | CREATOR + REVIEWER | In-app + Email |
| Published | CREATOR | In-app |
| Scheduled publish | CREATOR | In-app (nhắc trước 1 giờ) |

## Audit log bắt buộc
Mọi transition trạng thái phải được log:
```typescript
await auditLog.create({
  userId: currentUser.id,
  action: 'LESSON_STATUS_CHANGED',
  resourceType: 'LESSON',
  resourceId: lesson.id,
  details: { from: 'IN_REVIEW', to: 'APPROVED' },
});
```
