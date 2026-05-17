import type { ContentStatus, Difficulty, SubjectCode } from './common.types';
import type { LessonQuestion } from './question.types';

export interface Subject {
  id: string;
  code: SubjectCode;
  name: string;
  nameEn: string;
  color: string | null;
  iconUrl: string | null;
}

export interface Lesson {
  id: string;
  title: string;
  slug: string;
  subject: Subject;
  grade: number;
  topic: string;
  difficulty: Difficulty;
  theory: string;
  estimatedMinutes: number;
  status: ContentStatus;
  randomizeQuestions: boolean;
  timeLimitSec: number | null;
  maxAttempts: number;
  lessonQuestions: LessonQuestion[];
  reviewerId: string | null;
  publishedAt: string | null;
  createdAt: string;
}

export interface CreateLessonRequest {
  title: string;
  subjectId: string;
  grade: number;
  topic: string;
  difficulty: Difficulty;
  theory: string;
  estimatedMinutes?: number;
}

export interface LessonListItem {
  id: string;
  title: string;
  slug: string;
  subject: Pick<Subject, 'id' | 'code' | 'name' | 'color'>;
  grade: number;
  topic: string;
  difficulty: Difficulty;
  status: ContentStatus;
  estimatedMinutes: number;
  publishedAt: string | null;
}
export type UpdateLessonRequest = Partial<CreateLessonRequest>;
