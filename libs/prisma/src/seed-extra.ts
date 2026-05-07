import { PrismaClient, Role, SubjectCode } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Adding more sample content for testing...');

  const creator = await prisma.user.findUnique({ where: { email: 'creator@eduviet.vn' } });
  const physicsSubject = await prisma.subject.findUnique({ where: { code: SubjectCode.PHYSICS } });

  if (creator && physicsSubject) {
    await prisma.lesson.upsert({
      where: { slug: 'lap-trinh-giai-bai-toan-vat-ly' },
      update: {},
      create: {
        title: 'Lập trình giải bài toán Vật lý',
        slug: 'lap-trinh-giai-bai-toan-vat-ly',
        subjectId: physicsSubject.id,
        grade: 11,
        topic: 'Tin học ứng dụng',
        difficulty: 'HARD',
        theory: `## Sử dụng Python để tính vận tốc\n\nTrong Vật lý, chúng ta có công thức tính vận tốc trung bình:\n\n$$v = \\frac{\\Delta s}{\\Delta t}$$\n\nDưới đây là một đoạn mã Python đơn giản để tính toán điều này:\n\n\`\`\`python\ndef tinh_van_toc(quang_duong, thoi_gian):\n    if thoi_gian <= 0:\n        return "Thời gian phải lớn hơn 0"\n    v = quang_duong / thoi_gian\n    return f"Vận tốc là: {v} m/s"\n\n# Ví dụ sử dụng\ns = 100 # mét\nt = 20  # giây\nprint(tinh_van_toc(s, t))\n\`\`\`\n\n### Bảng thông số\n\n| Thông số | Đơn vị | Mô tả |\n| :--- | :--- | :--- |\n| $s$ | m | Quãng đường |\n| $t$ | s | Thời gian |\n| $v$ | m/s | Vận tốc |`,
        estimatedMinutes: 60,
        status: 'PUBLISHED',
        publishedAt: new Date(),
        creatorId: creator.id,
        exercises: {
          create: [
            {
              type: 'MULTIPLE_CHOICE',
              question: 'Đoạn mã Python trên dùng từ khóa nào để định nghĩa hàm?',
              options: JSON.stringify(['function', 'def', 'func', 'define']),
              correctAnswer: JSON.stringify('def'),
              explanation: 'Trong Python, từ khóa \`def\` được dùng để định nghĩa một hàm.',
              hints: JSON.stringify(['Nhìn vào dòng đầu tiên của đoạn mã']),
              points: 10,
              orderIndex: 0,
            },
          ],
        },
      },
    });
  }

  console.log('✅ Additional sample content added!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
