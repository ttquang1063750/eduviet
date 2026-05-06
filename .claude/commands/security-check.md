---
description: Chạy security audit toàn diện cho code changes hiện tại
argument-hint: "[file hoặc module cụ thể, hoặc để trống để check toàn bộ changes]"
---

Chạy security audit toàn diện theo quy trình trong `.claude/agents/security-auditor.md`.

Phạm vi: $ARGUMENTS (nếu trống thì check toàn bộ staged changes và recent commits)

**Checklist bắt buộc theo CLAUDE.md:**
1. Authentication middleware trên mọi route
2. Authorization với đúng RBAC roles
3. Input validation (Zod schemas)
4. Data exposure trong responses
5. Rate limiting trên auth endpoints
6. Secrets và sensitive data trong code/logs
7. CORS và CSRF configuration
8. File upload security

Output theo format trong security-auditor.md: CRITICAL → HIGH → MEDIUM → Recommendations → Passed.
