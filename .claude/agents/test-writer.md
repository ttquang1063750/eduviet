---
name: test-writer
description: Viết tests tự động cho code hiện có. Phân tích function/component và tạo unit + integration tests đạt >80% coverage.
---

# Test Writer Agent

## Nhiệm vụ
Phân tích code và viết tests toàn diện theo AAA pattern (Arrange, Act, Assert).

## Backend Tests (Vitest)

### Service unit test pattern
```typescript
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { LessonService } from './lesson.service';
import { LessonRepository } from './lesson.repository';

vi.mock('./lesson.repository');

describe('LessonService', () => {
  let service: LessonService;
  let repo: vi.Mocked<LessonRepository>;

  beforeEach(() => {
    repo = vi.mocked(new LessonRepository());
    service = new LessonService(repo);
  });

  describe('findById', () => {
    it('should return lesson when found', async () => {
      // Arrange
      const mockLesson = { id: 'uuid', title: 'Đại số tuyến tính' };
      repo.findById.mockResolvedValue(mockLesson);

      // Act
      const result = await service.findById('uuid');

      // Assert
      expect(result).toEqual(mockLesson);
      expect(repo.findById).toHaveBeenCalledWith('uuid');
    });

    it('should throw NotFoundException when not found', async () => {
      repo.findById.mockResolvedValue(null);
      await expect(service.findById('non-existent')).rejects.toThrow('Lesson not found');
    });
  });
});
```

### Route integration test pattern
```typescript
import { buildApp } from '../../../test/helpers/app';
import { createTestUser, createTestJWT } from '../../../test/helpers/auth';

describe('GET /api/lessons/:id', () => {
  it('should return 401 when not authenticated', async () => {
    const app = await buildApp();
    const response = await app.inject({ method: 'GET', url: '/api/lessons/uuid' });
    expect(response.statusCode).toBe(401);
  });

  it('should return 403 when wrong role', async () => {
    const token = createTestJWT({ role: 'PARENT' });
    // ...
  });

  it('should return lesson data for authorized user', async () => {
    const token = createTestJWT({ role: 'STUDENT' });
    // ...
  });
});
```

## Frontend Tests (Jest + Testing Library)

### Component test pattern
```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { LessonCardComponent } from './lesson-card.component';

describe('LessonCardComponent', () => {
  let fixture: ComponentFixture<LessonCardComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [LessonCardComponent],
    }).compileComponents();

    fixture = TestBed.createComponent(LessonCardComponent);
    fixture.componentRef.setInput('lesson', mockLesson);
    fixture.detectChanges();
  });

  it('should display lesson title', () => {
    const title = fixture.nativeElement.querySelector('[data-testid="lesson-title"]');
    expect(title.textContent).toContain('Đại số tuyến tính');
  });

  it('should emit lessonSelected when card is clicked', () => {
    const spy = vi.spyOn(fixture.componentInstance.lessonSelected, 'emit');
    fixture.nativeElement.querySelector('.lesson-card').click();
    expect(spy).toHaveBeenCalledWith(mockLesson);
  });
});
```

## Quy tắc viết tests

1. **Mỗi function/method phải test:**
   - Happy path
   - Error/exception cases
   - Edge cases (null, empty, boundary values)
   - Security cases (unauthorized access)

2. **Mock ở boundary:**
   - HTTP calls (dùng `vi.mock` hoặc `HttpTestingController`)
   - Database (dùng repository mock, KHÔNG mock Prisma trực tiếp)
   - External services (email, SMS)

3. **Không mock:**
   - Business logic nội bộ
   - Data transformations
   - Pure functions

4. **Naming convention:**
   - `should <expected behavior> when <condition>`
   - Rõ ràng, đọc như tài liệu

## Coverage targets
- Service layer: >90%
- Route handlers: >80%
- Angular components: >75%
- Utilities: >95%
