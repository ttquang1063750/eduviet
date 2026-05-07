# Active Task: Live Chat — P1

## Mục tiêu
Implement real-time chat hoàn chỉnh: floating widget (FAB), 3 loại room (CLASS/TEACHER_PARENT/ONE_ON_ONE), typing indicator, read receipts, edit/delete message, file upload. Design đã được duyệt.

## Trạng thái: COMPLETED
Bắt đầu: 2026-05-07
Hoàn thành: 2026-05-07

## Steps

### Backend (8 steps)
- [x] B1. Thêm `@socket.io/redis-adapter` vào `apps/backend/package.json`
- [x] B2. Tạo `apps/backend/src/plugins/socket.plugin.ts`
- [x] B3. Tạo `apps/backend/src/modules/chat/chat.repository.ts`
- [x] B4. Tạo `apps/backend/src/modules/chat/chat.service.ts`
- [x] B5. Tạo `apps/backend/src/modules/chat/chat.gateway.ts`
- [x] B6. Tạo `apps/backend/src/modules/chat/chat.routes.ts`
- [x] B7. Cập nhật `apps/backend/src/main.ts` — đăng ký socketPlugin + chatRoutes
- [x] B8. Cập nhật `apps/backend/src/modules/classes/classes.service.ts` — auto-create CLASS ChatRoom

### Frontend (7 steps)
- [x] F1. Thêm `socket.io-client` + tạo `packages/shared-types/src/chat.types.ts`
- [x] F2. Tạo `apps/frontend/src/app/features/chat/chat.service.ts`
- [x] F3. Tạo `chat-widget.component.{ts,html,scss}` (3 files)
- [x] F4. Tạo `room-list.component.{ts,html,scss}` (3 files)
- [x] F5. Tạo `message-thread.component.{ts,html,scss}` (3 files)
- [x] F6. Cập nhật `main-layout.component.html` — thêm `<app-chat-widget>`
- [ ] F7. Cập nhật `app.config.ts` — provide ChatService

## Context quan trọng

### Backend patterns (từ codebase hiện tại)
- Plugin pattern: dùng `fp` (fastify-plugin) + `app.decorate()` — xem `redis.plugin.ts`
- `app.redis` đã có (ioredis) — socket.plugin dùng lại để tạo Redis adapter
- Service pattern: `constructor(private prisma: PrismaClient)` → tạo repo → gọi `writeAuditLog()`
- Error: throw `AppError.notFound()`, `AppError.forbidden()` từ `shared/errors/app-error.ts`

### Socket.io setup (B2)
```typescript
// socket.plugin.ts — attach vào fastify.server
import { Server } from 'socket.io';
import { createAdapter } from '@socket.io/redis-adapter';
// Dùng app.redis (đã decorate) để tạo pub/sub clients
// JWT auth qua socket.handshake.auth.token
// fastify.decorate('io', io)
```

### RBAC per room type (B4)
- CLASS: kiểm tra user có trong `ClassEnrollment` với classId của room
- TEACHER_PARENT: kiểm tra user là teacher/parent của class đó
- ONE_ON_ONE: kiểm tra user có trong `ChatRoomMember` của room đó

### ChatRoomMember constraint
- `@@unique([roomId, userId])` — upsert khi add member để tránh duplicate
- `lastReadAt` — cập nhật khi `mark_read` event

### Socket events (B5)
Client→Server: `join_rooms`, `send_message {roomId, content, mediaUrl?}`, `typing_start {roomId}`, `typing_stop {roomId}`, `mark_read {roomId}`, `edit_message {messageId, content}`, `delete_message {messageId}`

Server→Client: `new_message`, `user_typing`, `user_stopped_typing`, `message_edited`, `message_deleted`, `rooms_loaded`, `error`

### Frontend (F2 — ChatService signals)
```typescript
// Expose signals:
rooms = signal<ChatRoom[]>([])
activeRoomId = signal<string | null>(null)
messages = signal<Map<string, ChatMessage[]>>(new Map())
typingUsers = signal<Map<string, string[]>>(new Map())  // roomId → userName[]
totalUnread = computed(() => rooms().reduce((acc, r) => acc + r.unreadCount, 0))
```

### Frontend component tree
```
app-chat-widget          ← FAB + popup shell (chat-widget.component)
  ├── app-room-list      ← Hiện khi chưa chọn room (room-list.component)
  └── app-message-thread ← Hiện khi đã chọn room (message-thread.component)
```

### Không cần Prisma migration
Schema đã có đầy đủ: ChatRoom, ChatRoomMember, ChatMessage, ChatRoomType enum.

## Files đã tạo/sửa
- apps/backend/package.json
- apps/backend/src/plugins/socket.plugin.ts
- apps/backend/src/modules/chat/chat.repository.ts
- apps/backend/src/shared/utils/audit.ts
- apps/backend/src/modules/chat/chat.service.ts
- apps/backend/src/modules/chat/chat.gateway.ts
- apps/backend/src/modules/chat/chat.schema.ts
- apps/backend/src/modules/chat/chat.routes.ts
- apps/backend/src/modules/chat/chat.service.spec.ts
- apps/backend/src/main.ts
- apps/backend/src/modules/classes/classes.service.ts
- apps/frontend/package.json
- packages/shared-types/src/chat.types.ts
- packages/shared-types/src/index.ts
- apps/frontend/src/app/features/chat/chat.service.ts
- apps/frontend/src/app/features/chat/chat-widget/chat-widget.component.ts
- apps/frontend/src/app/features/chat/chat-widget/chat-widget.component.html
- apps/frontend/src/app/features/chat/chat-widget/chat-widget.component.scss
- apps/frontend/src/app/features/chat/chat-widget/room-list/room-list.component.ts
- apps/frontend/src/app/features/chat/chat-widget/room-list/room-list.component.html
- apps/frontend/src/app/features/chat/chat-widget/room-list/room-list.component.scss
- apps/frontend/src/app/features/chat/chat-widget/message-thread/message-thread.component.ts
- apps/frontend/src/app/features/chat/chat-widget/message-thread/message-thread.component.html
- apps/frontend/src/app/features/chat/chat-widget/message-thread/message-thread.component.scss
- apps/frontend/src/app/layout/main-layout.component.ts
- apps/frontend/src/app/layout/main-layout.component.html

## Sau task này
→ P2: Storage module (libs/storage/ — MinIO wrapper)
