import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReportsService } from './reports.service';
import { Chart, registerables } from 'chart.js';

Chart.register(...registerables);

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="container">
      <h1>Reports</h1>
      <div class="charts">
        <div class="chart-container">
          <h2>Users by Role</h2>
          <canvas id="userRolesChart"></canvas>
        </div>
        <div class="chart-container">
          <h2>Content Overview</h2>
          <canvas id="contentChart"></canvas>
        </div>
        <div class="chart-container">
          <h2>Login Activity (Last 7 Days)</h2>
          <canvas id="loginActivityChart"></canvas>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .container { padding: 2rem; }
    .charts { display: grid; grid-template-columns: repeat(auto-fit, minmax(400px, 1fr)); gap: 2rem; }
    .chart-container { background: #fff; padding: 1.5rem; border-radius: 8px; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
  `]
})
export class ReportsComponent {
  private reportsService = inject(ReportsService);
  
  userRolesChart: Chart | undefined;
  contentChart: Chart | undefined;
  loginActivityChart: Chart | undefined;

  ngOnInit() {
    this.reportsService.getSummary().subscribe(summary => {
      this.createUserRolesChart(summary.userCounts);
      this.createContentChart(summary.contentCounts);
      this.createLoginActivityChart(summary.loginActivities);
    });
  }

  createUserRolesChart(data: any) {
    this.userRolesChart = new Chart('userRolesChart', {
      type: 'pie',
      data: {
        labels: Object.keys(data),
        datasets: [{
          label: 'User Roles',
          data: Object.values(data),
          backgroundColor: ['#FF6384', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40'],
        }]
      }
    });
  }

  createContentChart(data: any) {
    this.contentChart = new Chart('contentChart', {
      type: 'bar',
      data: {
        labels: ['Lessons', 'Classes', 'Blog Posts'],
        datasets: [{
          label: 'Total Count',
          data: [data.lessons, data.classes, data.blogPosts],
          backgroundColor: ['#36A2EB', '#FFCE56', '#4BC0C0'],
        }]
      },
      options: {
        scales: {
          y: {
            beginAtZero: true
          }
        }
      }
    });
  }

  createLoginActivityChart(data: any) {
    this.loginActivityChart = new Chart('loginActivityChart', {
      type: 'line',
      data: {
        labels: Object.keys(data),
        datasets: [{
          label: 'Logins',
          data: Object.values(data),
          fill: false,
          borderColor: '#FF6384',
          tension: 0.1
        }]
      }
    });
  }
}
