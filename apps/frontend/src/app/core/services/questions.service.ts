import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import type {
  Question,
  LessonQuestion,
  CreateQuestionRequest,
  UpdateQuestionRequest,
  GenerateQuestionsRequest,
  QuestionFilter,
  PaginatedResponse,
  ApiResponse,
} from '@eduviet/shared-types';

@Injectable({ providedIn: 'root' })
export class QuestionsService {
  private http = inject(HttpClient);
  private readonly API = '/api/questions';
  private readonly LESSONS_API = '/api/lessons';

  /** Ngân hàng câu hỏi — có filter và phân trang */
  getBank(filter: QuestionFilter = {}) {
    let params = new HttpParams();
    Object.entries(filter).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        params = params.set(key, String(value));
      }
    });
    return this.http.get<PaginatedResponse<Question>>(this.API, { params });
  }

  /** Chi tiết một câu hỏi */
  getById(id: string) {
    return this.http.get<ApiResponse<Question>>(`${this.API}/${id}`);
  }

  /** Tạo câu hỏi mới */
  create(data: CreateQuestionRequest) {
    return this.http.post<ApiResponse<Question>>(this.API, data);
  }

  /** Cập nhật câu hỏi */
  update(id: string, data: UpdateQuestionRequest) {
    return this.http.patch<ApiResponse<Question>>(`${this.API}/${id}`, data);
  }

  /** Xóa câu hỏi (soft delete) */
  delete(id: string) {
    return this.http.delete<ApiResponse<{ message: string }>>(`${this.API}/${id}`);
  }

  /**
   * AI tạo câu hỏi — trả về draft array, KHÔNG lưu DB.
   * Client tự chọn câu rồi gọi create() hoặc addToLesson() để lưu.
   */
  generate(data: GenerateQuestionsRequest) {
    return this.http.post<ApiResponse<Question[]>>(`${this.API}/generate`, data);
  }

  // ─── Lesson-Question relations ─────────────────────────────────────────────

  /** Danh sách câu hỏi gắn với bài học */
  getLessonQuestions(lessonId: string) {
    return this.http.get<ApiResponse<LessonQuestion[]>>(`${this.LESSONS_API}/${lessonId}/questions`);
  }

  /** Gắn câu hỏi vào bài học */
  addToLesson(lessonId: string, questionId: string) {
    return this.http.post<ApiResponse<LessonQuestion>>(
      `${this.LESSONS_API}/${lessonId}/questions`,
      { questionId },
    );
  }

  /** Gỡ câu hỏi khỏi bài học */
  removeFromLesson(lessonId: string, questionId: string) {
    return this.http.delete<ApiResponse<{ message: string }>>(
      `${this.LESSONS_API}/${lessonId}/questions/${questionId}`,
    );
  }

  /** Sắp xếp lại thứ tự câu hỏi trong bài học */
  reorder(lessonId: string, orderedIds: string[]) {
    return this.http.patch<ApiResponse<{ message: string }>>(
      `${this.LESSONS_API}/${lessonId}/questions/reorder`,
      { orderedIds },
    );
  }

  /** Bật/tắt randomize câu hỏi cho bài học */
  setRandomize(lessonId: string, randomize: boolean) {
    return this.http.patch<ApiResponse<{ id: string; randomizeQuestions: boolean }>>(
      `${this.LESSONS_API}/${lessonId}/randomize`,
      { randomize },
    );
  }
}
