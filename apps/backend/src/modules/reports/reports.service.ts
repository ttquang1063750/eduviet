import { PrismaClient } from '@prisma/client';
import { ReportsRepository } from './reports.repository.js';
import ExcelJS from 'exceljs';
import PDFDocument from 'pdfkit';

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
      const doc = new PDFDocument({ margin: 50 });

      doc.on('data', (chunk) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // --- Header ---
      doc.fontSize(20).text('BAO CAO HE THONG EDUVIET', { align: 'center' });
      doc.fontSize(10).text(`Ngay xuat: ${new Date().toLocaleString()}`, { align: 'center' });
      doc.moveDown();
      doc.moveTo(50, doc.y).lineTo(550, doc.y).stroke();
      doc.moveDown();

      // --- Section 1: User Counts ---
      doc.fontSize(16).text('1. Thong ke nguoi dung', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12);
      Object.entries(data.userCounts).forEach(([role, count]) => {
        doc.text(`${role}: ${count}`);
      });
      doc.moveDown();

      // --- Section 2: Content Counts ---
      doc.fontSize(16).text('2. Thong ke noi dung', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12);
      doc.text(`Bai hoc: ${data.contentCounts.lessons}`);
      doc.text(`Lop hoc: ${data.contentCounts.classes}`);
      doc.text(`Bai viet Blog: ${data.contentCounts.blogPosts}`);
      doc.moveDown();

      // --- Section 3: Activities ---
      doc.fontSize(16).text('3. Hoat dong dang nhap (7 ngay qua)', { underline: true });
      doc.moveDown(0.5);
      doc.fontSize(12);
      Object.entries(data.loginActivities)
        .sort((a, b) => a[0].localeCompare(b[0]))
        .forEach(([date, count]) => {
          doc.text(`${date}: ${count} luot`);
        });

      doc.end();
    });
  }
}
