import { PrismaClient, Role, SubjectCode } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Updating lesson content with explicit Markdown/KaTeX...');

  const mathSubject = await prisma.subject.findUnique({ where: { code: SubjectCode.MATH } });

  if (mathSubject) {
    await prisma.lesson.update({
      where: { slug: 'phuong-trinh-bac-hai-mot-an' },
      data: {
        theory: `## 📐 Phương trình bậc hai một ẩn\n\nPhương trình bậc hai một ẩn có dạng tổng quát:\n\n$$\nax^2 + bx + c = 0 \\quad (a \\neq 0)\n$$\n\n### 📝 Công thức nghiệm\n\nTính biệt thức $\\Delta$ (Delta):\n\n$$\\Delta = b^2 - 4ac$$\n\n- Nếu $\\Delta < 0$: Phương trình **vô nghiệm**.\n- Nếu $\\Delta = 0$: Phương trình có **nghiệm kép**:\n  $$x = -\\frac{b}{2a}$$\n- Nếu $\\Delta > 0$: Phương trình có **hai nghiệm phân biệt**:\n  $$x_{1,2} = \\frac{-b \\pm \\sqrt{\\Delta}}{2a}$$\n\n> **Chú ý:** Nếu $a + b + c = 0$ thì phương trình luôn có một nghiệm $x_1 = 1$.`,
      },
    });
  }

  console.log('✅ Lesson content updated!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
