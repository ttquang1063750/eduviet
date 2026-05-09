import { PrismaClient, Role, SubjectCode, Prisma } from '@prisma/client';
import * as bcrypt from 'bcryptjs';
import { createHmac } from 'crypto';

const prisma = new PrismaClient();

const HASH_SALT = process.env.PII_HASH_SALT || 'dev-pii-hash-salt-change-in-production-min-32-chars!!';
const ENCRYPTION_KEY = process.env.DB_ENCRYPTION_KEY || 'dev-encryption-key-change-in-production-min-32-chars!!';

function hashPII(value: string | null | undefined): string | null {
  if (!value) return null;
  const normalized = value.trim().toLowerCase();
  return createHmac('sha256', HASH_SALT).update(normalized).digest('hex');
}

async function main() {
  console.log('🌱 Seeding database with encrypted PII...');

  // Nation -> Province -> District -> School
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

  // Seed users - since we changed User model to use Bytes/pgcrypto, 
  // we use executeRaw for users to handle encryption
  const users = [
    { email: 'admin@eduviet.vn', fullName: 'Super Admin', role: Role.SUPER_ADMIN, password: 'Admin@123' },
    { email: 'school.admin@eduviet.vn', fullName: 'Nguyễn Văn An', role: Role.SCHOOL_ADMIN, password: 'Admin@123' },
    { email: 'creator@eduviet.vn', fullName: 'Trần Thị Bích', role: Role.CONTENT_CREATOR, password: 'Admin@123' },
    { email: 'reviewer@eduviet.vn', fullName: 'Lê Minh Cường', role: Role.CONTENT_REVIEWER, password: 'Admin@123' },
    { email: 'approver@eduviet.vn', fullName: 'Phạm Thị Dung', role: Role.CONTENT_APPROVER, password: 'Admin@123' },
    { email: 'teacher@eduviet.vn', fullName: 'Hoàng Văn Em', role: Role.SUBJECT_TEACHER, password: 'Admin@123' },
    { email: 'homeroom@eduviet.vn', fullName: 'Vũ Thị Phương', role: Role.HOMEROOM_TEACHER, password: 'Admin@123' },
    { email: 'student@eduviet.vn', fullName: 'Ngô Minh Tuấn', role: Role.STUDENT, password: 'Admin@123' },
    { email: 'parent@eduviet.vn', fullName: 'Ngô Văn Hùng', role: Role.PARENT, password: 'Admin@123' },
  ];

  for (const u of users) {
    const emailHash = hashPII(u.email);
    const existing = await prisma.user.findUnique({ where: { emailHash: emailHash! } });
    
    if (!existing) {
      await prisma.$executeRaw`
        INSERT INTO users (
          id, email, email_hash, password_hash, full_name, role, is_active, is_verified, school_id, created_at, updated_at
        ) VALUES (
          gen_random_uuid(),
          pgp_sym_encrypt(${u.email}, ${ENCRYPTION_KEY}),
          ${emailHash},
          ${hash(u.password)},
          ${u.fullName},
          ${u.role}::"Role",
          true,
          true,
          ${u.role !== Role.SUPER_ADMIN ? school.id : null},
          NOW(),
          NOW()
        )
      `;
    }
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
  const creatorHash = hashPII('creator@eduviet.vn')!;
  const creator = await prisma.user.findUnique({ where: { emailHash: creatorHash } });
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
        theory: '## Phương trình bậc hai một ẩn...',
        estimatedMinutes: 45,
        status: 'PUBLISHED',
        publishedAt: new Date(),
        creatorId: creator.id,
      },
    });
  }

  console.log('✅ Seed completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
