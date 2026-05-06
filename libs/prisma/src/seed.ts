import { PrismaClient, Role, SubjectCode } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding database...');

  // Nation → Province → District → School
  const nation = await prisma.nation.upsert({
    where: { code: 'VN' },
    update: {},
    create: { name: 'Việt Nam', code: 'VN' },
  });

  const province = await prisma.province.upsert({
    where: { code: 'HCM' },
    update: {},
    create: { name: 'TP. Hồ Chí Minh', code: 'HCM', nationId: nation.id },
  });

  const district = await prisma.district.upsert({
    where: { code: 'Q1' },
    update: {},
    create: { name: 'Quận 1', code: 'Q1', provinceId: province.id },
  });

  const school = await prisma.school.upsert({
    where: { code: 'THPT-LE-QUY-DON' },
    update: {},
    create: {
      name: 'THPT Lê Quý Đôn',
      code: 'THPT-LE-QUY-DON',
      address: '110 Điện Biên Phủ, Quận 1, TP. HCM',
      phone: '028.38290',
      email: 'lequydon@edu.vn',
      districtId: district.id,
    },
  });

  const hash = (pw: string) => bcrypt.hashSync(pw, 12);

  // Seed users
  const users = [
    {
      email: 'admin@eduviet.vn',
      fullName: 'Super Admin',
      role: Role.SUPER_ADMIN,
      password: 'Admin@123',
    },
    {
      email: 'school.admin@eduviet.vn',
      fullName: 'Nguyễn Văn An',
      role: Role.SCHOOL_ADMIN,
      password: 'Admin@123',
    },
    {
      email: 'creator@eduviet.vn',
      fullName: 'Trần Thị Bích',
      role: Role.CONTENT_CREATOR,
      password: 'Admin@123',
    },
    {
      email: 'reviewer@eduviet.vn',
      fullName: 'Lê Minh Cường',
      role: Role.CONTENT_REVIEWER,
      password: 'Admin@123',
    },
    {
      email: 'approver@eduviet.vn',
      fullName: 'Phạm Thị Dung',
      role: Role.CONTENT_APPROVER,
      password: 'Admin@123',
    },
    {
      email: 'teacher@eduviet.vn',
      fullName: 'Hoàng Văn Em',
      role: Role.SUBJECT_TEACHER,
      password: 'Admin@123',
    },
    {
      email: 'homeroom@eduviet.vn',
      fullName: 'Vũ Thị Phương',
      role: Role.HOMEROOM_TEACHER,
      password: 'Admin@123',
    },
    {
      email: 'student@eduviet.vn',
      fullName: 'Ngô Minh Tuấn',
      role: Role.STUDENT,
      password: 'Admin@123',
    },
    {
      email: 'parent@eduviet.vn',
      fullName: 'Ngô Văn Hùng',
      role: Role.PARENT,
      password: 'Admin@123',
    },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        fullName: u.fullName,
        role: u.role,
        passwordHash: hash(u.password),
        isVerified: true,
        schoolId: u.role !== Role.SUPER_ADMIN ? school.id : null,
      },
    });
  }

  // Subjects
  const subjects = [
    { code: SubjectCode.MATH, name: 'Toán học', nameEn: 'Mathematics', color: '#4A90E2' },
    { code: SubjectCode.PHYSICS, name: 'Vật lý', nameEn: 'Physics', color: '#E24A4A' },
    { code: SubjectCode.CHEMISTRY, name: 'Hóa học', nameEn: 'Chemistry', color: '#50C878' },
    { code: SubjectCode.LITERATURE, name: 'Ngữ văn', nameEn: 'Literature', color: '#FF7F50' },
    { code: SubjectCode.ENGLISH, name: 'Tiếng Anh', nameEn: 'English', color: '#9B59B6' },
  ];

  for (const s of subjects) {
    await prisma.subject.upsert({
      where: { code: s.code },
      update: {},
      create: s,
    });
  }

  // Sample lesson
  const creator = await prisma.user.findUnique({ where: { email: 'creator@eduviet.vn' } });
  const mathSubject = await prisma.subject.findUnique({ where: { code: SubjectCode.MATH } });

  if (creator && mathSubject) {
    await prisma.lesson.upsert({
      where: { slug: 'phuong-trinh-bac-hai-mot-an' },
      update: {},
      create: {
        title: 'Phương trình bậc hai một ẩn',
        slug: 'phuong-trinh-bac-hai-mot-an',
        subjectId: mathSubject.id,
        grade: 10,
        topic: 'Phương trình và bất phương trình',
        difficulty: 'MEDIUM',
        theory: `## Phương trình bậc hai một ẩn\n\nPhương trình bậc hai một ẩn có dạng:\n\n$$ax^2 + bx + c = 0 \\quad (a \\neq 0)$$\n\n### Công thức nghiệm\n\nĐặt $\\Delta = b^2 - 4ac$:\n\n- Nếu $\\Delta < 0$: phương trình **vô nghiệm**\n- Nếu $\\Delta = 0$: phương trình có **nghiệm kép** $x = -\\dfrac{b}{2a}$\n- Nếu $\\Delta > 0$: phương trình có **hai nghiệm phân biệt** $x_{1,2} = \\dfrac{-b \\pm \\sqrt{\\Delta}}{2a}$`,
        estimatedMinutes: 45,
        status: 'PUBLISHED',
        publishedAt: new Date(),
        creatorId: creator.id,
        exercises: {
          create: [
            {
              type: 'MULTIPLE_CHOICE',
              question: 'Giải phương trình $x^2 - 5x + 6 = 0$. Tổng hai nghiệm bằng?',
              options: JSON.stringify(['3', '5', '6', '-5']),
              correctAnswer: JSON.stringify('5'),
              explanation:
                'Theo định lý Viète: $x_1 + x_2 = -\\dfrac{b}{a} = -\\dfrac{-5}{1} = 5$',
              hints: JSON.stringify(['Dùng định lý Viète', 'Tổng nghiệm = -b/a']),
              points: 10,
              orderIndex: 0,
            },
            {
              type: 'FILL_IN_BLANK',
              question:
                'Phương trình $x^2 - 4 = 0$ có hai nghiệm là $x_1 = $ ___ và $x_2 = $ ___',
              options: null,
              correctAnswer: JSON.stringify(['2', '-2']),
              explanation:
                '$x^2 = 4 \\Rightarrow x = \\pm 2$, vậy $x_1 = 2$ và $x_2 = -2$',
              hints: JSON.stringify(['Đặt $x^2 = 4$', 'Khai căn cả hai vế']),
              points: 10,
              orderIndex: 1,
            },
          ],
        },
      },
    });
  }

  console.log('✅ Seed completed!');
  console.log('\n📋 Test accounts (password: Admin@123):');
  console.log('  admin@eduviet.vn        → SUPER_ADMIN');
  console.log('  school.admin@eduviet.vn → SCHOOL_ADMIN');
  console.log('  creator@eduviet.vn      → CONTENT_CREATOR');
  console.log('  reviewer@eduviet.vn     → CONTENT_REVIEWER');
  console.log('  approver@eduviet.vn     → CONTENT_APPROVER');
  console.log('  teacher@eduviet.vn      → SUBJECT_TEACHER');
  console.log('  student@eduviet.vn      → STUDENT');
  console.log('  parent@eduviet.vn       → PARENT');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
