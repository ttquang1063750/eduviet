# Task: Bugfix — Start-dev issues

## Trạng thái: COMPLETED
Hoàn thành: 2026-05-09

## Steps
- [x] 1. MinIO image tag cũ không tồn tại → cập nhật `docker-compose.yml` sang `RELEASE.2025-04-22T22-12-26Z`
- [x] 2. TypeScript build error `main.ts` → đổi `window as ...` sang `Object.assign(window, {...})`

## Files đã sửa
- docker-compose.yml
- apps/frontend/src/main.ts
