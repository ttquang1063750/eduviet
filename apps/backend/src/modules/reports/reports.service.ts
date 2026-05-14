import { PrismaClient } from '@prisma/client';
import { ReportsRepository } from './reports.repository.js';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';
import path from 'path';

// CJS context: __dirname is injected automatically by Node — no import.meta needed
const FONTS_DIR = path.join(__dirname, '../../assets/fonts');
const FONT_REGULAR = path.join(FONTS_DIR, 'LiberationSans-Regular.ttf');
const FONT_BOLD    = path.join(FONTS_DIR, 'LiberationSans-Bold.ttf');

export class ReportsService {
  private readonly repo: ReportsRepository;

  constructor(private readonly prisma: PrismaClient) {
    this.repo = new ReportsRepository(prisma);
  }

  async getSummary() {
    const [userCounts, contentCounts, loginActivities] = await Promise.all([
      this.repo.countUsersByRole(),
      this.repo.countContent(),
      this.repo.getLoginActivities(),
    ]);

    return {
      userCounts,
      contentCounts,
      loginActivities,
    };
  }

  async exportSummaryExcel() {
    const data = await this.getSummary();
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'EduViet System';
    workbook.lastModifiedBy = 'EduViet System';
    workbook.created = new Date();

    // --- SHEET 1: TỔNG QUAN ---
    const summarySheet = workbook.addWorksheet('Tổng quan hệ thống');
    summarySheet.columns = [
      { header: 'Hạng mục', key: 'category', width: 30 },
      { header: 'Số lượng', key: 'count', width: 15 },
    ];

    // Add User Counts
    summarySheet.addRow({ category: 'NGƯỜI DÙNG', count: '' });
    summarySheet.lastRow!.font = { bold: true };
    
    Object.entries(data.userCounts).forEach(([role, count]) => {
      summarySheet.addRow({ category: `  - ${role}`, count });
    });

    summarySheet.addRow({}); // Empty row

    // Add Content Counts
    summarySheet.addRow({ category: 'NỘI DUNG', count: '' });
    summarySheet.lastRow!.font = { bold: true };
    summarySheet.addRow({ category: '  - Bài học', count: data.contentCounts.lessons });
    summarySheet.addRow({ category: '  - Lớp học', count: data.contentCounts.classes });
    summarySheet.addRow({ category: '  - Bài viết Blog', count: data.contentCounts.blogPosts });

    // Formatting
    summarySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    summarySheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4A90E2' },
    };

    // --- SHEET 2: HOẠT ĐỘNG ĐĂNG NHẬP ---
    const activitySheet = workbook.addWorksheet('Hoạt động đăng nhập');
    activitySheet.columns = [
      { header: 'Ngày', key: 'date', width: 20 },
      { header: 'Số lượt đăng nhập', key: 'count', width: 25 },
    ];

    Object.entries(data.loginActivities)
      .sort((a, b) => a[0].localeCompare(b[0]))
      .forEach(([date, count]) => {
        activitySheet.addRow({ date, count });
      });

    activitySheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
    activitySheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF50C878' },
    };

    return await workbook.xlsx.writeBuffer();
  }

  async exportSummaryPdf(): Promise<Buffer> {
    const data = await this.getSummary();

    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      const doc = new PDFDocument({ margin: 50, size: 'A4' });

      // Đăng ký font hỗ trợ tiếng Việt
      doc.registerFont('Regular', FONT_REGULAR);
      doc.registerFont('Bold', FONT_BOLD);

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      const pageWidth = doc.page.width - 100; // trừ margin 2 bên
      const now = new Date().toLocaleString('vi-VN', { timeZone: 'Asia/Ho_Chi_Minh' });

      // ── Header ────────────────────────────────────────────────────────────────
      doc.font('Bold').fontSize(22).fillColor('#1d4ed8')
        .text('BÁO CÁO HỆ THỐNG EDUVIET', { align: 'center' });

      doc.font('Regular').fontSize(10).fillColor('#6b7280')
        .text(`Ngày xuất: ${now}`, { align: 'center' });

      doc.moveDown(0.5);
      doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y)
        .strokeColor('#e5e7eb').lineWidth(1).stroke();
      doc.moveDown();

      // ── Section 1: Thống kê người dùng ───────────────────────────────────────
      doc.font('Bold').fontSize(14).fillColor('#111827')
        .text('1. Thống kê người dùng', { underline: false });
      doc.moveDown(0.4);

      const userRoleLabels: Record<string, string> = {
        SUPER_ADMIN: 'Quản trị viên toàn quốc',
        PROVINCE_ADMIN: 'Quản trị cấp tỉnh',
        DISTRICT_ADMIN: 'Quản trị cấp huyện',
        SCHOOL_ADMIN: 'Quản trị trường',
        CONTENT_CREATOR: 'Biên soạn nội dung',
        CONTENT_REVIEWER: 'Kiểm duyệt nội dung',
        CONTENT_APPROVER: 'Phê duyệt nội dung',
        HOMEROOM_TEACHER: 'Giáo viên chủ nhiệm',
        SUBJECT_TEACHER: 'Giáo viên bộ môn',
        STUDENT: 'Học sinh',
        PARENT: 'Phụ huynh',
      };

      doc.font('Regular').fontSize(11).fillColor('#374151');
      Object.entries(data.userCounts).forEach(([role, count]) => {
        const label = userRoleLabels[role] ?? role;
        doc.text(`  • ${label}: `, { continued: true })
           .font('Bold').text(String(count));
        doc.font('Regular');
      });
      doc.moveDown();

      // ── Section 2: Thống kê nội dung ─────────────────────────────────────────
      doc.font('Bold').fontSize(14).fillColor('#111827')
        .text('2. Thống kê nội dung');
      doc.moveDown(0.4);

      doc.font('Regular').fontSize(11).fillColor('#374151');
      const contentRows: [string, number][] = [
        ['Bài học', data.contentCounts.lessons],
        ['Lớp học', data.contentCounts.classes],
        ['Bài viết Blog', data.contentCounts.blogPosts],
      ];
      contentRows.forEach(([label, count]) => {
        doc.text(`  • ${label}: `, { continued: true })
           .font('Bold').text(String(count));
        doc.font('Regular');
      });
      doc.moveDown();

      // ── Section 3: Hoạt động đăng nhập ───────────────────────────────────────
      doc.font('Bold').fontSize(14).fillColor('#111827')
        .text('3. Hoạt động đăng nhập (7 ngày qua)');
      doc.moveDown(0.4);

      const activities = Object.entries(data.loginActivities)
        .sort((a, b) => a[0].localeCompare(b[0]));

      if (activities.length === 0) {
        doc.font('Regular').fontSize(11).fillColor('#9ca3af')
          .text('  Không có dữ liệu.');
      } else {
        doc.font('Regular').fontSize(11).fillColor('#374151');
        activities.forEach(([date, count]) => {
          doc.text(`  • ${date}: `, { continued: true })
             .font('Bold').text(`${count} lượt`);
          doc.font('Regular');
        });
      }

      // ── Footer ────────────────────────────────────────────────────────────────
      doc.moveDown(2);
      doc.moveTo(50, doc.y).lineTo(doc.page.width - 50, doc.y)
        .strokeColor('#e5e7eb').lineWidth(1).stroke();
      doc.moveDown(0.5);
      doc.font('Regular').fontSize(9).fillColor('#9ca3af')
        .text('EduViet — Nền tảng ôn tập học thuật trực tuyến', { align: 'center' });

      doc.end();
    });
  }
}
