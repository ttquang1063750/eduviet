# Active Task: CI/CD — P7

## Mục tiêu
Thiết lập CI/CD pipelines cho project sử dụng GitHub Actions.

## Trạng thái: IN PROGRESS
Bắt đầu: 2026-05-07
Step hiện tại: CI1

## Steps
- [ ] 1. [CI] Tạo workflow file `.github/workflows/ci.yml`
- [ ] 2. [CI] Cấu hình các job: lint, test, build cho cả frontend và backend
- [ ] 3. [CD] Tạo workflow file `.github/workflows/deploy.yml`
- [ ] 4. [CD] Cấu hình job build và push Docker images lên registry (VD: Docker Hub, GHCR)
- [ ] 5. [CD] Cấu hình job deploy lên server (VD: dùng `ssh-action` để chạy `docker compose up` trên server)

## Context quan trọng
- CI trigger on: `push` to `main` và `pull_request` to `main`.
- CD trigger on: `push` to `main` (sau khi CI thành công).
- Cần setup secrets trong GitHub repo (DOCKER_USERNAME, DOCKER_PASSWORD, SSH_HOST, SSH_USER, SSH_KEY).
- Sử dụng `pnpm` và caching để tăng tốc độ CI.
- Chú ý vấn đề `@rollup/rollup-linux-arm64-gnu` khi chạy test trên runner Linux ARM64. Có thể cần chỉ định runner `ubuntu-latest` (x86).

## Files đã tạo/sửa
- (chưa có)

## Bước tiếp theo sau task này
→ Hoàn thành project!
