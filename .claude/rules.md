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
    user: { id: string; email: string; roles: UserRole[]; }; // MẢNG, không phải đơn
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
  - Dùng `ConfirmService.confirm()` (trả về `Promise<boolean>`) cho các hộp thoại xác nhận.

### ❌ Deprecated — TUYỆT ĐỐI KHÔNG DÙNG (Angular 19+)

#### App/Environment initializers
```typescript
// ❌ SAI — deprecated từ Angular v19
{ provide: APP_INITIALIZER, useFactory: ..., deps: [...], multi: true }
{ provide: ENVIRONMENT_INITIALIZER, useValue: () => inject(Svc), multi: true }

// ✅ ĐÚNG
provideAppInitializer(() => {
  const svc = inject(MyService);
  return svc.init(); // có thể trả về Promise hoặc Observable
})
provideEnvironmentInitializer(() => {
  inject(MyService); // eager-init, không await
})
```

#### RxJS import path
```typescript
// ❌ SAI — legacy path từ RxJS 6, sẽ bị xóa trong RxJS 8
import { map, switchMap } from 'rxjs/operators';

// ✅ ĐÚNG — import trực tiếp từ 'rxjs' (RxJS 7+)
import { map, switchMap } from 'rxjs';
```

#### Input/Output decorators
```typescript
// ❌ SAI — legacy decorator style
@Input() title: string = '';
@Output() saved = new EventEmitter<void>();

// ✅ ĐÚNG — signal-based API (Angular 17+)
title = input<string>('');
saved = output<void>();
```

#### ViewChild/ViewChildren decorators
```typescript
// ❌ SAI — legacy decorator style
@ViewChild('canvas') canvasRef!: ElementRef;
@ViewChildren(MyComp) items!: QueryList<MyComp>;

// ✅ ĐÚNG — signal-based API (Angular 17+)
canvasRef = viewChild.required<ElementRef>('canvas');
// dùng: this.canvasRef().nativeElement
```

#### Template $any()
```typescript
// ❌ SAI — bypass type system, vi phạm no-any
@for (item of $any(list); track item.id)

// ✅ ĐÚNG — non-null assertion khi @if đã guard, hoặc ?? []
@for (item of list!; track item.id)
@for (item of list ?? []; track item.id)
```

#### Các NgModule đã thay bằng providers
```typescript
// ❌ SAI
imports: [CommonModule, BrowserModule, HttpClientModule, BrowserAnimationsModule]

// ✅ ĐÚNG — dùng providers trong app.config.ts
provideHttpClient(withFetch(), withInterceptors([...]))
provideAnimationsAsync()
// CommonModule không cần trong standalone components (dùng built-in @if/@for)
```

### UI/UX Standards (Angular Material 3)
- **TẤT CẢ** các thành phần UI (input, button, select, checkbox, radio...) PHẢI dùng **Angular Material Design 3**.
- **Theme**: Sử dụng Material 3 với **High Density** (`density: -3`).
- **Màu**: Dùng CSS custom properties từ theme — `var(--mat-sys-primary)`, `var(--mat-sys-on-primary)`, v.v. KHÔNG hardcode màu hex khi có token tương đương.
- **Quy định Component**:
  - Form Fields: Dùng `mat-form-field` với `appearance="outline"`.
  - Buttons: `mat-flat-button` cho hành động chính, `mat-stroked-button` cho hành động phụ, `mat-icon-button` cho thao tác nhanh.
  - Phân trang & Bảng: Dùng `mat-table` và `mat-paginator`.
  - Tooltip: `matTooltip` — KHÔNG dùng attribute `title=` trên Material components.
  - Icons: `<mat-icon>` — KHÔNG dùng emoji làm icon trong UI.
- **KHÔNG** tự viết CSS cho các input/button cơ bản trừ khi cần tinh chỉnh layout đặc thù.

### i18n bắt buộc cho mọi UI mới
- **TẤT CẢ** text hiển thị cho user — text node, attribute (placeholder, aria-label, title, alt, matTooltip), và string trong TS (toast, confirm, error message) — PHẢI có marker i18n:
  ```html
  <!-- ✅ ĐÚNG — text node -->
  <h2 i18n="@@login.title">Chào mừng trở lại</h2>

  <!-- ✅ ĐÚNG — attribute -->
  <input i18n-placeholder="@@login.email_placeholder" placeholder="example@eduviet.vn" />

  <!-- ✅ ĐÚNG — TS dynamic message -->
  this.toast.error($localize`:@@common.error:Đã có lỗi xảy ra`);
  ```
- **ID convention**: `@@<feature>.<context>.<key>` (vd `@@admin.users.delete_confirm`). Strings tái sử dụng → `@@common.<key>` (vd `@@common.save`, `@@common.cancel`, `@@common.delete`).
- **KHÔNG bỏ qua** binding `{{ }}`, comment, ký tự đặc biệt — chỉ text có chữ cái cần i18n.
- **Workflow**: sau khi tạo/sửa template → gọi `/i18n-check <file>` để verify. Nếu `@angular/localize` đã install → BẮT BUỘC pass trước khi commit.

## Prisma / Database
- UUID primary key: `@id @default(uuid())`.
- Timestamps: `createdAt`, `updatedAt`, `deletedAt` (soft delete).
- Tên bảng: `@@map("snake_case_plural")`.
- Index cho mọi FK và field thường filter.
- **KHÔNG dùng** `rejectOnNotFound` (removed Prisma v4), `$use()` middleware (deprecated), `findOne()` (removed Prisma v3).

## TypeScript chung
- Không dùng `any`.
- Không dùng `as unknown as X` trừ khi thực sự cần thiết (comment lý do).
- Không dùng `as any` để workaround type lỗi — fix type đúng cách (thêm field vào interface, dùng type guard, v.v.).
- Shared types đặt trong `packages/shared-types/src/`.
- Unused args phải prefix `_` (vd: `_event`, `_q`) để ESLint không báo lỗi.


#### Animation providers — không cần, không dùng
```typescript
// ❌ SAI — deprecated từ v20.2, project không dùng animations
provideAnimations()
provideAnimationsAsync()

// ✅ ĐÚNG — không cần provider nào, Angular Material dùng CSS transitions
// Không import gì từ @angular/platform-browser/animations
```
