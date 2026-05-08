# EduViet — Rules (PHẢI tuân thủ mọi lúc)

> File này là luật bất biến. Mọi code sinh ra đều phải tuân thủ.

## Backend

### Pattern bắt buộc
```
Route handler → Service → Repository → Prisma
```
- Route: chỉ validate Zod + gọi service. Không có business logic.
- Service: RBAC checks, business rules, gọi `writeAuditLog()` sau mỗi mutation.
- Repository: chỉ giao tiếp Prisma, typed selects dùng `satisfies Prisma.XxxSelect`.

### JWT
```typescript
// ĐÚNG — augment @fastify/jwt
declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: AccessTokenPayload | RefreshTokenPayload;
    user: { id: string; email: string; role: UserRole; };
  }
}
```

### Error handling
- Throw `AppError` từ `shared/errors/app-error.ts`, không throw Error thường.
- Không expose stack trace cho client.

### Rate limiting — auth endpoints
```typescript
config: { rateLimit: { max: 5, timeWindow: '15 minutes' } }
```

### Security
- Mọi route PHẢI có `preHandler: [authenticate]`.
- Route cần phân quyền PHẢI có `preHandler: [authenticate, authorize('ROLE1', 'ROLE2')]`.
- Audit log cho mọi CRUD mutation nhạy cảm.

## Frontend (Angular 21 Zoneless)

### Component
```typescript
@Component({
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './foo.component.html',   // KHÔNG inline template
  styleUrl: './foo.component.scss',       // KHÔNG inline styles
})
export class FooComponent {
  private svc = inject(FooService);      // inject(), không constructor
}
```

### Quy tắc cứng
- 3 file riêng: `.ts` + `.html` + `.scss` — KHÔNG inline.
- `OnPush` trên MỌI component.
- `inject()` thay constructor injection.
- Signals cho state: `signal()`, `computed()`, `input()`, `output()`.
- Control flow: `@if`, `@for` — KHÔNG `*ngIf`, `*ngFor`.
- Không dùng `any` type.
- Không import `CommonModule`.
- `provideZonelessChangeDetection()` đã có trong app.config.ts — không thêm zone.js.
- **KHÔNG dùng** `alert()`, `confirm()`, `prompt()` của trình duyệt.
  - Dùng `ToastService` (`success`, `error`, `info`, `warning`) cho thông báo.
  - Dùng `ConfirmService.confirm()` (trả về `Promise<boolean>`) cho các hộp thoại xác nhận.

## Prisma / Database
- UUID primary key: `@id @default(uuid())`.
- Timestamps: `createdAt`, `updatedAt`, `deletedAt` (soft delete).
- Tên bảng: `@@map("snake_case_plural")`.
- Index cho mọi FK và field thường filter.

## TypeScript chung
- Không dùng `any`.
- Không dùng `as unknown as X` trừ khi thực sự cần thiết (comment lý do).
- Shared types đặt trong `packages/shared-types/src/`.
