# EduViet — API Conventions

## Response Format

### Success (single object)
```json
{
  "data": { "id": "...", "title": "..." }
}
```

### Success (list)
```json
{
  "data": [...],
  "meta": {
    "total": 100,
    "page": 1,
    "perPage": 20,
    "totalPages": 5
  }
}
```

### Error
```json
{
  "error": {
    "code": "UNAUTHORIZED",
    "message": "Bạn không có quyền truy cập tài nguyên này",
    "details": []
  }
}
```

## Error Codes hay dùng

| Code | HTTP | Mô tả |
|------|------|-------|
| `UNAUTHORIZED` | 401 | Chưa đăng nhập |
| `FORBIDDEN` | 403 | Không có quyền |
| `NOT_FOUND` | 404 | Không tìm thấy |
| `VALIDATION_ERROR` | 400 | Input không hợp lệ |
| `CONFLICT` | 409 | Trùng lặp (vd: email đã tồn tại) |
| `INTERNAL_ERROR` | 500 | Lỗi server |

## Prisma Schema Conventions

```prisma
model ExampleModel {
  id        String    @id @default(uuid())     // UUID, không dùng int
  createdAt DateTime  @default(now()) @map("created_at")
  updatedAt DateTime  @updatedAt @map("updated_at")
  deletedAt DateTime? @map("deleted_at")       // soft delete

  @@map("example_models")                      // tên bảng snake_case
}
```

**Quy tắc:**
- Primary key: UUID (`@default(uuid())`)
- Timestamps: `created_at`, `updated_at`, `deleted_at` (camelCase trong code, snake_case trong DB)
- Tên bảng: `@@map("snake_case_plural")`
- Tên cột: `@map("snake_case")`
- Soft delete: `deletedAt DateTime?` cho dữ liệu quan trọng
- Index: bắt buộc cho mọi foreign key và field thường filter/sort

## Cursor-based Pagination (list endpoints)

```
GET /api/lessons?cursor=<lastId>&limit=20
```

Response thêm `meta.nextCursor` nếu còn dữ liệu.

## File Upload

```
POST /api/chat/rooms/:id/upload    # upload trong chat
POST /api/storage/upload           # upload chung (chưa implement)

Content-Type: multipart/form-data
```

Response: `{ "data": { "url": "https://minio.../bucket/path/file.png" } }`
