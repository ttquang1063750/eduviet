---
description: Khởi động toàn bộ môi trường dev — Docker services + FE :4200 + BE :3000. Kiểm tra dependencies, migrate DB, seed (lần đầu), mở browser tự động.
---

## Hành động

Chạy lệnh sau trong terminal tại thư mục gốc dự án:

```bash
bash dev-start.sh
```

Script tự động thực hiện:
1. Kiểm tra & cài pnpm nếu chưa có
2. `pnpm install` — cài toàn bộ dependencies
3. Kiểm tra Docker (tự mở Docker Desktop nếu chưa chạy)
4. Copy `.env.example` → `.env` nếu chưa có file `.env`
5. `docker compose up -d` — khởi postgres, redis, minio, mailhog, pgadmin
6. Đợi PostgreSQL sẵn sàng
7. `pnpm db:migrate` — chạy pending migrations
8. `pnpm db:seed` — seed dữ liệu mẫu (chỉ lần đầu, có flag `.seeded`)
9. Mở browser tự động sau 15 giây
10. `pnpm dev` — start FE :4200 + BE :3000 song song

## URLs sau khi start

| Service   | URL                        |
|-----------|----------------------------|
| Frontend  | http://localhost:4200      |
| API       | http://localhost:3000      |
| pgAdmin   | http://localhost:5050      |
| MinIO     | http://localhost:9001      |
| MailHog   | http://localhost:8025      |

## Credentials

**pgAdmin:** `admin@eduviet.vn` / `PgAdmin@123`

**Test accounts** (password: `Admin@123`):
- `admin@eduviet.vn` → SUPER_ADMIN
- `teacher@eduviet.vn` → SUBJECT_TEACHER
- `student@eduviet.vn` → STUDENT

## Lệnh hữu ích khác

```bash
# Dừng Docker services
pnpm docker:down

# Reset DB hoàn toàn (xóa data!)
pnpm db:reset && rm .seeded

# Chỉ start FE hoặc BE
pnpm dev:fe
pnpm dev:be

# Mở Prisma Studio
pnpm db:studio
```

## Lưu ý

- Chỉ có **`dev-start.sh`** — `start-dev.sh` đã bị xóa (outdated)
- Dùng `Ctrl+C` để dừng FE+BE. Docker services vẫn chạy ngầm sau khi dừng
- Nếu lần đầu chạy bị lỗi seed: xóa file `.seeded` rồi chạy lại `pnpm db:seed`
