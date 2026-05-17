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

export type AssignmentScope = 'SCHOOL' | 'CLASS' | 'USER';

export interface LessonAssignment {
  id: string;
  lessonId: string;
  schoolId?: string | null;
  classId?: string | null;
  userId?: string | null;
  assignedById: string;
  note?: string | null;
  dueDate?: string | null;
  createdAt: string;
  updatedAt: string;
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
  lessonAssignments?: LessonAssignment[];
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
