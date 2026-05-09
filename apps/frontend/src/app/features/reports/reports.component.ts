import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  inject,
  signal,
} from '@angular/core';
import { Chart, registerables } from 'chart.js';
import { ReportsService, ReportSummary } from './reports.service';
import { ToastService } from '../../core/services/toast.service';

Chart.register(...registerables);

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.scss',
})
export class ReportsComponent implements AfterViewInit {
  private reportsService = inject(ReportsService);
  private toast = inject(ToastService);

  isExportingExcel = signal(false);
  isExportingPdf = signal(false);

  private userRolesChart: Chart | undefined;
  private contentChart: Chart | undefined;
  private loginActivityChart: Chart | undefined;

  ngAfterViewInit(): void {
    this.reportsService.getSummary().subscribe({
      next: (summary) => {
        this.createUserRolesChart(summary.userCounts);
        this.createContentChart(summary.contentCounts);
        this.createLoginActivityChart(summary.loginActivities);
      },
      error: () => this.toast.error('Không thể tải dữ liệu báo cáo'),
    });
  }

  exportExcel(): void {
    if (this.isExportingExcel()) return;
    this.isExportingExcel.set(true);

    this.reportsService.exportExcel().subscribe({
      next: (blob) => {
        this.triggerDownload(blob, `eduviet-report-${this.todayStr()}.xlsx`);
        this.toast.success('Đã xuất báo cáo Excel thành công');
        this.isExportingExcel.set(false);
      },
      error: () => {
        this.toast.error('Xuất Excel thất bại. Vui lòng thử lại');
        this.isExportingExcel.set(false);
      },
    });
  }

  exportPdf(): void {
    if (this.isExportingPdf()) return;
    this.isExportingPdf.set(true);

    this.reportsService.exportPdf().subscribe({
      next: (blob) => {
        this.triggerDownload(blob, `eduviet-report-${this.todayStr()}.pdf`);
        this.toast.success('Đã xuất báo cáo PDF thành công');
        this.isExportingPdf.set(false);
      },
      error: () => {
        this.toast.error('Xuất PDF thất bại. Vui lòng thử lại');
        this.isExportingPdf.set(false);
      },
    });
  }

  private triggerDownload(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = filename;
    document.body.appendChild(anchor);
    anchor.click();
    document.body.removeChild(anchor);
    URL.revokeObjectURL(url);
  }

  private todayStr(): string {
    return new Date().toISOString().slice(0, 10);
  }

  private createUserRolesChart(data: Record<string, number>): void {
    this.userRolesChart?.destroy();
    this.userRolesChart = new Chart('userRolesChart', {
      type: 'pie',
      data: {
        labels: Object.keys(data),
        datasets: [
          {
            label: 'Người dùng theo vai trò',
            data: Object.values(data),
            backgroundColor: [
              '#FF6384', '#36A2EB', '#FFCE56',
              '#4BC0C0', '#9966FF', '#FF9F40',
            ],
          },
        ],
      },
    });
  }

  private createContentChart(data: ReportSummary['contentCounts']): void {
    this.contentChart?.destroy();
    this.contentChart = new Chart('contentChart', {
      type: 'bar',
      data: {
        labels: ['Bài học', 'Lớp học', 'Bài viết Blog'],
        datasets: [
          {
            label: 'Tổng số',
            data: [data.lessons, data.classes, data.blogPosts],
            backgroundColor: ['#36A2EB', '#FFCE56', '#4BC0C0'],
          },
        ],
      },
      options: { scales: { y: { beginAtZero: true } } },
    });
  }

  private createLoginActivityChart(data: Record<string, number>): void {
    const sorted = Object.entries(data).sort((a, b) => a[0].localeCompare(b[0]));
    this.loginActivityChart?.destroy();
    this.loginActivityChart = new Chart('loginActivityChart', {
      type: 'line',
      data: {
        labels: sorted.map(([date]) => date),
        datasets: [
          {
            label: 'Lượt đăng nhập',
            data: sorted.map(([, count]) => count),
            fill: false,
            borderColor: '#FF6384',
            tension: 0.1,
          },
        ],
      },
    });
  }
}
