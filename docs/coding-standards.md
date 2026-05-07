# EduViet — Coding Standards

## Angular Frontend

### Component template

```typescript
@Component({
  selector: 'app-lesson-card',
  standalone: true,
  imports: [RouterLink],                               // import cụ thể, không dùng CommonModule
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './lesson-card.component.html',         // KHÔNG dùng template: `...` inline
  styleUrl: './lesson-card.component.scss',            // KHÔNG dùng styles: [...] inline
})
export class LessonCardComponent {
  private lessonService = inject(LessonService);       // inject() thay vì constructor

  lesson = input.required<Lesson>();
  isLoading = signal(false);
  lessonTitle = computed(() => this.lesson().title);
}
```

### Quy tắc bắt buộc

- **Tách 3 file**: `*.component.ts` + `*.component.html` + `*.component.scss` — KHÔNG inline template/styles
- **SCSS** — không dùng CSS thuần trong component
- `OnPush` trên mọi component
- `inject()` thay vì constructor injection
- Signals cho local state, `toSignal()` khi convert Observable
- Control flow syntax (`@if`, `@for`, `@switch`) — không dùng `*ngIf`, `*ngFor`
- `@defer` cho lazy loading content
- Không dùng `any` type
- Không import `CommonModule` — import trực tiếp pipe cần dùng (vd: `DatePipe`)
- File tối đa 300 dòng, tách nhỏ nếu vượt quá
- **Breadcrumb**: `this.breadcrumbService.setLabel('alias', 'Tên mới')` để cập nhật tên động
- **Layout**: Sử dụng `MainLayoutComponent` cho các route yêu cầu xác thực

### Angular 21 Zoneless — bắt buộc

```typescript
// app.config.ts
export const appConfig: ApplicationConfig = {
  providers: [
    provideZonelessChangeDetection(),           // KHÔNG dùng provideZoneChangeDetection
    provideBrowserGlobalErrorListeners(),
    // ...
  ]
};
```

---

## Backend (Fastify + TypeScript)

### Route handler pattern

```typescript
export const lessonRoutes: FastifyPluginAsyncZod = async (app) => {
  app.get(
    '/lessons/:id',
    {
      schema: {
        params: z.object({ id: z.string().uuid() }),
        response: { 200: LessonSchema },
      },
      preHandler: [authenticate, authorize('STUDENT', 'TEACHER')],
    },
    async (request, reply) => {
      const lesson = await lessonService.findById(request.params.id);
      return reply.send(lesson);
    }
  );
};
```

### JWT type augmentation

```typescript
// ĐÚNG — augment @fastify/jwt, KHÔNG augment fastify
declare module '@fastify/jwt' {
  interface FastifyJWT {
    payload: AccessTokenPayload | RefreshTokenPayload;
    user: { id: string; email: string; role: UserRole; };
  }
}
```

### Audit log (không throw)

```typescript
import { writeAuditLog } from '../../shared/utils/audit';

// Trong service, sau mutation:
await writeAuditLog(this.prisma, {
  userId: actorId,
  action: 'LESSON_CREATED',
  resourceType: 'LESSON',
  resourceId: lesson.id,
});
```

### Per-route rate limiting

```typescript
app.post('/login', {
  config: { rateLimit: { max: 5, timeWindow: '15 minutes' } },
  // ...
}, handler);
```

### Quy tắc bắt buộc

- Zod schema cho mọi request/response
- Không dùng `any` type
- Error handling tập trung tại error handler của Fastify — throw `AppError`
- Service layer tách biệt với route handler
- Repository pattern cho database access

---

## Database (Prisma)

### Model conventions

```prisma
model ExampleModel {
  id        String    @id @default(uuid())
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")
  deletedAt DateTime? @map("deleted_at")  // soft delete

  @@map("example_models")  // tên bảng snake_case
}
```

### Quy tắc

- Migrations phải có tên mô tả rõ ràng
- Không bao giờ xóa column trực tiếp — dùng deprecation + migration từng bước
- Index cho mọi foreign key và field thường query
- Soft delete (`deletedAt`) cho dữ liệu quan trọng
- UUID cho primary key (không dùng auto-increment integer)
- Typed selects: `satisfies Prisma.XxxSelect`

---

## Testing

- Coverage tối thiểu: **80%** (unit), **60%** (integration)
- Test file đặt cạnh source file (`*.spec.ts`)
- E2E test cho happy path của mọi tính năng chính
- Mock ở boundary (HTTP calls, DB), không mock internal logic
- Pattern AAA: Arrange → Act → Assert

---

## Git Conventions

```
feat(lessons): add interactive drawing canvas
fix(auth): resolve JWT refresh race condition
test(chat): add unit tests for message service
docs(rbac): update role permission matrix
chore(deps): update angular to 21.x
```
