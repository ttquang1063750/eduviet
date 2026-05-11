import type { QuestionType, Difficulty } from './common.types';

export interface QuestionOption {
  id: string;
  text: string;
}

export interface Question {
  id: string;
  subjectId: string;
  type: QuestionType;
  content: string;
  /** Chỉ có với SINGLE_CHOICE / MULTIPLE_CHOICE */
  options: QuestionOption[] | null;
  /**
   * Kiểu thực tế tuỳ `type`:
   * - SINGLE_CHOICE:   string (option id)
   * - MULTIPLE_CHOICE: string[] (option ids)
   * - FILL_IN_BLANK:   string[] (1 answer per blank)
   * - SHORT_ANSWER / ESSAY / DRAWING: string
   */
  correctAnswer: string | string[];
  explanation: string | null;
  hints: string[];
  points: number;
  difficulty: Difficulty | null;
  tags: string[];
  creatorId: string;
  createdAt: string;
  updatedAt: string;
}

export interface LessonQuestion {
  id: string;
  lessonId: string;
  questionId: string;
  question: Question;
  orderIndex: number;
  createdAt: string;
}

export interface CreateQuestionRequest {
  subjectId: string;
  type: QuestionType;
  content: string;
  options?: QuestionOption[];
  correctAnswer: string | string[];
  explanation?: string;
  hints?: string[];
  points?: number;
  difficulty?: Difficulty;
  tags?: string[];
}

export type UpdateQuestionRequest = Partial<
  Omit<CreateQuestionRequest, 'subjectId' | 'type'>
>;

export interface GenerateQuestionsRequest {
  keyword: string;
  subjectId: string;
  /** Số câu muốn tạo, 1–10 */
  count: number;
  type?: QuestionType;
}

export interface QuestionFilter {
  subjectId?: string;
  type?: QuestionType;
  difficulty?: Difficulty;
  search?: string;
  page?: number;
  perPage?: number;
}
