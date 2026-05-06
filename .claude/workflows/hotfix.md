---
name: hotfix
description: Workflow xử lý hotfix khẩn cấp trên production. Merge vào cả main và develop.
---

# Hotfix Workflow

## Khi nào dùng
- Bug nghiêm trọng trên production
- Security vulnerability
- Data corruption risk

## Bước 1 — Tạo hotfix branch
```bash
# Từ main (production code)
git checkout main && git pull
git checkout -b hotfix/<issue-description>

# Ví dụ:
git checkout -b hotfix/fix-jwt-refresh-race-condition
```

## Bước 2 — Fix nhanh và tối giản
- Chỉ fix đúng vấn đề, không refactor thêm
- Không thêm feature mới trong hotfix

## Bước 3 — Security check (bắt buộc nếu liên quan auth/data)
Chạy agent `security-auditor` nếu fix liên quan đến:
- Authentication / Authorization
- Data handling / PII
- Input validation
- Cryptography

## Bước 4 — Tests
```bash
# Test cho bug đã fix
pnpm test:be
pnpm test:fe
```

Yêu cầu:
- Phải có regression test cho bug vừa fix
- CI pipeline phải pass

## Bước 5 — Commit
```bash
git add <specific-files>
git commit -m "fix(<module>): <mô tả bug và cách fix>"
```

## Bước 6 — PR và merge
```bash
# Merge vào main
git checkout main
git merge --no-ff hotfix/<issue>
git tag -a v<version> -m "Hotfix: <description>"
git push origin main --tags

# Merge vào develop để sync
git checkout develop
git merge --no-ff hotfix/<issue>
git push origin develop

# Cleanup
git branch -d hotfix/<issue>
```

## Bước 7 — Post-hotfix
- [ ] Notify team về hotfix
- [ ] Update incident log
- [ ] Monitor logs và metrics 30 phút sau deploy
- [ ] Tạo ticket để fix root cause đúng cách (nếu hotfix là workaround)
