import type { ContentStatus, Difficulty, ExerciseType, SubjectCode } from './common.types';

export interface Subject {
  id: string;
  code: SubjectCode;
  name: string;
  nameEn: string;
  color: string | null;
  iconUrl: string | null;
}

export interface Exercise {
  id: string;
  type: ExerciseType;
  question: string;
  options: string[] | null;
  correctAnswer: string | string[];
  explanation: string;
  hints: string[];
  points: number;
  orderIndex: number;
  /** URL ảnh nền cho bài tập vẽ hình (type = DRAWING). Học sinh vẽ đè lên ảnh này. */
  backgroundImageUrl?: string | null;
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
  exercises: Exercise[];
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
