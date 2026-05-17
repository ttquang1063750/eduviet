import { User } from './user.types';
import { Lesson } from './lesson.types';
import { Question } from './question.types';

export type AttemptMode = 'PRACTICE' | 'TEST' | 'MOCK_EXAM';
export type AttemptStatus = 'IN_PROGRESS' | 'SUBMITTED' | 'GRADED';

export interface Attempt {
  id: string;
  studentId: string;
  student?: User;
  lessonId: string;
  lesson?: Lesson;
  mode: AttemptMode;
  status: AttemptStatus;
  startedAt: string;
  submittedAt: string | null;
  timeLimitSec: number | null;
  totalScore: number | null;
  maxScore: number | null;
  answers?: AttemptAnswer[];
  createdAt: string;
  updatedAt: string;
}

export interface AttemptAnswer {
  id: string;
  attemptId: string;
  questionId: string;
  question?: Question;
  answer: any; // Json
  isCorrect: boolean | null;
  score: number | null;
  feedback: string | null;
  gradedById: string | null;
  gradedBy?: User;
  gradedAt: string | null;
  createdAt: string;
}

export interface StartAttemptRequest {
  lessonId: string;
  mode: AttemptMode;
}

export interface SubmitAttemptRequest {
  answers: {
    questionId: string;
    answer: any; // Json
  }[];
}

export interface GradeAnswerRequest {
  score: number;
  feedback?: string;
}

export interface AttemptResult extends Attempt {
  answers: AttemptAnswer[];
}
export interface AttemptSummary {
  id: string;
  lessonTitle: string;
  lessonSlug: string;
  mode: AttemptMode;
  status: AttemptStatus;
  score: number | null;
  maxScore: number | null;
  submittedAt: string | null;
}
