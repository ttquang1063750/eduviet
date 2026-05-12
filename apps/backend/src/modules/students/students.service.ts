import { PrismaClient } from '@prisma/client';
import type { StudentDashboard, StudentClass, StudentLesson } from '@eduviet/shared-types';

export class StudentsService {
  constructor(private readonly prisma: PrismaClient) {}

  async getMyDashboard(userId: string): Promise<StudentDashboard> {
    // 1. Lấy danh sách lớp học của user (qua ClassEnrollment)
    const enrollments = await this.prisma.classEnrollment.findMany({
      where: { userId },
      include: {
        class: {
          include: {
            school: { select: { id: true, name: true } },
            homeroomTeacher: { select: { id: true, fullName: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    if (enrollments.length === 0) {
      return {
        classes: [],
        progress: { totalLessons: 0, completedLessons: 0, totalClasses: 0 },
      };
    }

    // 2. Lấy các grade từ lớp học để query bài học phù hợp
    const grades = [...new Set(enrollments.map((e) => e.class.grade))];

    // 3. Lấy bài học PUBLISHED theo grade (tối đa 5 bài mỗi grade)
    const lessonsByGrade = await this.prisma.lesson.findMany({
      where: {
        grade: { in: grades },
        status: 'PUBLISHED',
        deletedAt: null,
      },
      include: {
        subject: { select: { id: true, code: true, name: true, color: true } },
        _count: { select: { lessonQuestions: true } },
      },
      orderBy: { publishedAt: 'desc' },
      take: 50, // giới hạn tổng, sẽ phân bổ theo grade bên dưới
    });

    // 4. Map lesson theo grade
    const lessonMapByGrade = new Map<number, StudentLesson[]>();
    for (const lesson of lessonsByGrade) {
      const mapped: StudentLesson = {
        id: lesson.id,
        title: lesson.title,
        slug: lesson.slug,
        subject: {
          id: lesson.subject.id,
          code: lesson.subject.code,
          name: lesson.subject.name,
          color: lesson.subject.color,
        },
        grade: lesson.grade,
        topic: lesson.topic,
        difficulty: lesson.difficulty,
        estimatedMinutes: lesson.estimatedMinutes,
        totalQuestions: lesson._count.lessonQuestions,
      };

      const existing = lessonMapByGrade.get(lesson.grade) ?? [];
      if (existing.length < 5) {
        // tối đa 5 bài mỗi grade
        existing.push(mapped);
        lessonMapByGrade.set(lesson.grade, existing);
      }
    }

    // 5. Build StudentClass list
    const classes: StudentClass[] = enrollments.map((enrollment) => {
      const cls = enrollment.class;
      return {
        id: cls.id,
        name: cls.name,
        grade: cls.grade,
        academicYear: cls.academicYear,
        school: {
          id: cls.school.id,
          name: cls.school.name,
        },
        homeroomTeacher: cls.homeroomTeacher
          ? { id: cls.homeroomTeacher.id, fullName: cls.homeroomTeacher.fullName }
          : null,
        lessons: lessonMapByGrade.get(cls.grade) ?? [],
      };
    });

    // 6. Tính progress — tổng bài PUBLISHED theo các grade đang học
    const totalLessons = await this.prisma.lesson.count({
      where: {
        grade: { in: grades },
        status: 'PUBLISHED',
        deletedAt: null,
      },
    });

    return {
      classes,
      progress: {
        totalLessons,
        completedLessons: 0, // TODO: implement khi có StudentLessonProgress model
        totalClasses: enrollments.length,
      },
    };
  }
}
