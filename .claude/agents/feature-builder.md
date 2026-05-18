---
name: feature-builder
description: Xây dựng feature end-to-end (BE + FE + tests + migration) từ mô tả nghiệp vụ. Dùng khi cần thêm module mới hoàn chỉnh.
---

# Feature Builder Agent

## Nhiệm vụ
Xây dựng một tính năng hoàn chỉnh bao gồm backend, frontend, database migration và tests.

## Input cần thiết
- Tên tính năng / module
- Mô tả nghiệp vụ
- Các roles có quyền truy cập
- Schema dữ liệu (nếu có)

## Quy trình thực hiện

### Bước 1 — Phân tích yêu cầu
- Xác định entities và relationships
- Xác định RBAC permissions cần thiết
- Xác định API endpoints
- Xác định Angular components cần tạo

### Bước 2 — Database (Prisma)
- Tạo hoặc cập nhật models trong `libs/prisma/schema.prisma`
- Chạy `pnpm db:migrate:create -- --name <feature-name>`
- Cập nhật seed data nếu cần

### Bước 3 — Backend (Fastify)
Tạo module tại `apps/backend/src/modules/<feature>/`:
- `<feature>.routes.ts` — Route definitions với Zod schemas (**không chứa business logic**)
- `<feature>.service.ts` — Business logic, RBAC checks, gọi `writeAuditLog()`
- `<feature>.repository.ts` — Database queries — **chỉ giao tiếp với Prisma**
- `<feature>.schema.ts` — Zod validation schemas
- `<feature>.types.ts` — TypeScript types
- `index.ts` — Export và register routes

**Kiến trúc bắt buộc: Routes → Service → Repository → Prisma**
```typescript
// routes.ts — chỉ delegate, không có if/else business logic
app.get('/:id', { preHandler: [authenticate, authorize('STUDENT')] }, async (req, reply) => {
  const result = await service.getById(req.params.id, req.user.id, req.user.role);
  return reply.send({ data: result });
});

// service.ts — business logic + RBAC check
class FeatureService {
  constructor(private prisma: PrismaClient) {
    this.repo = new FeatureRepository(prisma);
  }
  async getById(id: string, requesterId: string, role: UserRole) {
    if (role === 'STUDENT' && id !== requesterId) {
      throw new AppError(403, 'FORBIDDEN', 'Không có quyền truy cập');
    }
    const item = await this.repo.findById(id);
    if (!item) throw new AppError(404, 'NOT_FOUND', 'Không tìm thấy');
    return item;
  }
}

// repository.ts — typed Prisma selects
class FeatureRepository {
  private select = {
    id: true, name: true, createdAt: true,
  } satisfies Prisma.FeatureSelect;

  async findById(id: string) {
    return this.prisma.feature.findUnique({ where: { id }, select: this.select });
  }
}
```

**Audit log sau mọi write operation (import từ shared utils):**
```typescript
import { writeAuditLog } from '../../shared/utils/audit';

// Trong service sau create/update/delete:
await writeAuditLog(this.prisma, {
  userId: actorId,
  action: 'FEATURE_CREATED',   // dùng AuditAction union type từ audit.ts
  resourceType: 'FEATURE',
  resourceId: result.id,
});
// writeAuditLog không bao giờ throw — an toàn dùng mà không cần try/catch
```

**Per-route rate limiting cho sensitive endpoints:**
```typescript
app.post('/login', {
  config: { rateLimit: { max: 5, timeWindow: '15 minutes' } },
  schema: { ... },
  preHandler: [...],
}, handler);
```

**Bắt buộc trên mọi route:**
```typescript
preHandler: [authenticate, authorize('ROLE1', 'ROLE2')]
```

### Bước 4 — Shared Types
Cập nhật `packages/shared-types/src/<feature>.ts` với types dùng chung FE+BE.

### Bước 5 — Frontend (Angular)
Tạo feature tại `apps/frontend/src/app/features/<feature>/`:
- `<feature>.routes.ts` — Lazy route config với `data: { breadcrumb: '...' }`
- `components/` — Standalone components (OnPush + Signals), **3 file riêng biệt** (.ts/.html/.scss)
- `services/<feature>.service.ts` — HTTP service dùng `toSignal()`
- `<feature>.guard.ts` — Route guard nếu cần

**Route definition:**
```typescript
{
  path: 'my-feature',
  data: { breadcrumb: 'Tên tính năng' },
  children: [
    { path: ':id', data: { breadcrumb: 'Chi tiết', breadcrumbAlias: 'my-feature/:id' } }
  ]
}
```

**Component template:**
```typescript
@Component({
  selector: 'app-feature',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [DatePipe, RouterLink],   // import trực tiếp, KHÔNG dùng CommonModule
  templateUrl: './feature.component.html',    // KHÔNG inline template
  styleUrl: './feature.component.scss',       // KHÔNG inline styles
})
export class FeatureComponent {
  private service = inject(FeatureService);
  items = toSignal(this.service.getAll(), { initialValue: [] });
  isLoading = signal(false);
}
```

**Template — dùng Angular control flow:**
```html
@if (isLoading()) {
  <mat-spinner />
} @else {
  @for (item of items(); track item.id) {
    <app-item-card [item]="item" />
  } @empty {
    <p>Không có dữ liệu</p>
  }
}
```

### Bước 6 — Tests (Vitest cho BE)
```typescript
// service.spec.ts — mock Prisma với vi.fn()
const mockPrisma = {
  feature: { findUnique: vi.fn(), create: vi.fn(), update: vi.fn() },
  auditLog: { create: vi.fn().mockResolvedValue({}) },
};

describe('FeatureService', () => {
  let service: FeatureService;
  beforeEach(() => {
    vi.clearAllMocks();
    service = new FeatureService(mockPrisma as never);
  });

  it('throw NotFound khi không tìm thấy', async () => {
    mockPrisma.feature.findUnique.mockResolvedValue(null);
    await expect(service.getById('bad-id', 'user-1', 'STUDENT'))
      .rejects.toMatchObject({ statusCode: 404, code: 'NOT_FOUND' });
  });
});
```

Test files:
- `apps/backend/src/modules/<feature>/<feature>.service.spec.ts`
- `apps/backend/src/modules/<feature>/<feature>.routes.spec.ts`
- `apps/frontend/src/app/features/<feature>/components/*.spec.ts`

### Bước 7 — Checklist bảo mật
- [ ] Authenticate middleware trên mọi route
- [ ] Authorize với đúng roles
- [ ] Zod validation cho input
- [ ] Không expose sensitive fields trong response (vd: correctAnswer, passwordHash)
- [ ] Audit log cho mọi write operation
- [ ] Rate limiting cho auth/upload endpoints

## Role: Worker Agent (KHÔNG tự merge)
Khi được gọi qua `/delegate`, agent này là **worker** — chỉ implement + commit + push + tạo PR.
- **KHÔNG tự merge** PR — Reviewer (Claude khác) sẽ review và quyết định
- Tạo PR với base branch `develop`, title rõ ràng theo Conventional Commits
- Sau khi tạo PR xong, báo cáo PR URL và dừng

## Constraints
- Không dùng `any` type (dùng `as never` cho Prisma JSON fields nếu cần)
- OnPush trên mọi Angular component
- 3 file riêng biệt cho mọi Angular component (ts/html/scss)
- Soft delete cho entities quan trọng (`deletedAt DateTime?`)
- UUID cho primary keys
- snake_case cho tên bảng và cột (`@@map("table_name")`)
