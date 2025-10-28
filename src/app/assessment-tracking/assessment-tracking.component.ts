import { Component, signal, computed, OnInit, AfterViewInit, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';
import { Router } from '@angular/router';
import {
  AssessmentHistoryService,
  AssessmentResult,
  ReminderSettings,
} from '../services/assessment-history.service';
import { StressAssessmentModalComponent } from '../home/modals/stress-assessment-modal/stress-assessment-modal.component';
import { Chart, registerables } from 'chart.js';

// Register Chart.js components
Chart.register(...registerables);

@Component({
  selector: 'app-assessment-tracking',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule, StressAssessmentModalComponent],
  templateUrl: './assessment-tracking.component.html',
  styleUrl: './assessment-tracking.component.css',
})
export class AssessmentTrackingComponent implements OnInit, AfterViewInit {
  // Chart instances
  private trendChart: Chart | null = null;
  private categoryChart: Chart | null = null;
  // Modal state
  showStressAssessmentModal = signal(false);

  // Date range filter
  dateRangeFilter = signal<'week' | 'month' | 'quarter' | 'all'>('all');

  // Selected assessment for detail view
  selectedAssessment = signal<AssessmentResult | null>(null);

  // Reminder settings modal
  showReminderSettings = signal(false);

  // Computed properties
  assessments = computed(() => {
    const filter = this.dateRangeFilter();
    const now = new Date();
    let startDate = new Date(0); // Beginning of time

    switch (filter) {
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      case 'quarter':
        startDate = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000);
        break;
    }

    return this.historyService
      .getAssessmentsByDateRange(startDate, now)
      .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
  });

  latestAssessment = computed(() => this.historyService.getLatestAssessment());

  trend = computed(() => this.historyService.getTrend());

  daysSinceLastAssessment = computed(() => this.historyService.getDaysSinceLastAssessment());

  categoryAverages = computed(() => this.historyService.getCategoryAverages());

  reminderSettings = computed(() => this.historyService.getReminderSettings());

  // Chart data
  trendChartData = computed(() => this.prepareTrendChartData());
  categoryChartData = computed(() => this.prepareCategoryChartData());

  // Recommendations
  recommendations = computed(() => this.generateRecommendations());

  constructor(private historyService: AssessmentHistoryService, private router: Router) {
    // Effect to update charts when data changes
    effect(() => {
      const trendData = this.trendChartData();
      const categoryData = this.categoryChartData();

      // Trigger chart updates after view is initialized
      setTimeout(() => {
        if (trendData) this.updateTrendChart();
        if (categoryData) this.updateCategoryChart();
      }, 100);
    });
  }

  ngOnInit(): void {
    // Component initialization
  }

  ngAfterViewInit(): void {
    // Initialize charts after view is ready
    setTimeout(() => {
      this.initializeCharts();
    }, 500);
  }

  // Open assessment modal
  startNewAssessment(): void {
    this.showStressAssessmentModal.set(true);
  }

  // Handle assessment completion
  onAssessmentCompleted(result: any): void {
    // Calculate category scores from answers
    const categoryScores = this.calculateCategoryScores(result);

    const assessmentResult: AssessmentResult = {
      id: '',
      score: result.score,
      level: result.level,
      recommendations: result.recommendations,
      timestamp: result.timestamp,
      categoryScores,
      answers: new Map(),
    };

    this.historyService.addAssessment(assessmentResult);
    this.showStressAssessmentModal.set(false);
  }

  onAssessmentClose(): void {
    this.showStressAssessmentModal.set(false);
  }

  // Calculate category scores from assessment answers
  private calculateCategoryScores(result: any): {
    work: number;
    sleep: number;
    physical: number;
    emotional: number;
  } {
    // Mock calculation - in real implementation, this would analyze the answers
    // For now, derive from overall score with some variation
    const baseScore = result.score;
    return {
      work: Math.min(100, Math.max(0, baseScore + Math.random() * 20 - 10)),
      sleep: Math.min(100, Math.max(0, baseScore + Math.random() * 20 - 10)),
      physical: Math.min(100, Math.max(0, baseScore + Math.random() * 20 - 10)),
      emotional: Math.min(100, Math.max(0, baseScore + Math.random() * 20 - 10)),
    };
  }

  // View assessment details
  viewAssessmentDetails(assessment: AssessmentResult): void {
    this.selectedAssessment.set(assessment);
  }

  closeAssessmentDetails(): void {
    this.selectedAssessment.set(null);
  }

  // Delete assessment
  deleteAssessment(id: string, event: Event): void {
    event.stopPropagation();
    if (confirm('¿Estás seguro de que deseas eliminar esta evaluación?')) {
      this.historyService.deleteAssessment(id);
    }
  }

  // Change date range filter
  setDateRangeFilter(filter: 'week' | 'month' | 'quarter' | 'all'): void {
    this.dateRangeFilter.set(filter);
  }

  // Prepare trend chart data
  private prepareTrendChartData(): any {
    const assessments = this.assessments();
    if (assessments.length === 0) return null;

    const sortedAssessments = [...assessments].sort(
      (a, b) => new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );

    return {
      labels: sortedAssessments.map((a) =>
        new Date(a.timestamp).toLocaleDateString('es-ES', {
          month: 'short',
          day: 'numeric',
        })
      ),
      datasets: [
        {
          label: 'Nivel de Estrés',
          data: sortedAssessments.map((a) => a.score),
          borderColor: '#6366f1',
          backgroundColor: 'rgba(99, 102, 241, 0.1)',
          tension: 0.4,
          fill: true,
        },
      ],
    };
  }

  // Prepare category chart data
  private prepareCategoryChartData(): any {
    const latest = this.latestAssessment();
    if (!latest) return null;

    return {
      labels: ['Trabajo', 'Sueño', 'Físico', 'Emocional'],
      datasets: [
        {
          label: 'Puntuación por Categoría',
          data: [
            latest.categoryScores.work,
            latest.categoryScores.sleep,
            latest.categoryScores.physical,
            latest.categoryScores.emotional,
          ],
          backgroundColor: [
            'rgba(99, 102, 241, 0.8)',
            'rgba(139, 92, 246, 0.8)',
            'rgba(236, 72, 153, 0.8)',
            'rgba(245, 158, 11, 0.8)',
          ],
          borderColor: [
            'rgb(99, 102, 241)',
            'rgb(139, 92, 246)',
            'rgb(236, 72, 153)',
            'rgb(245, 158, 11)',
          ],
          borderWidth: 2,
        },
      ],
    };
  }

  // Generate personalized recommendations
  private generateRecommendations(): string[] {
    const latest = this.latestAssessment();
    const trend = this.trend();
    const recommendations: string[] = [];

    if (!latest) {
      recommendations.push('tracking.recommendations.noData');
      return recommendations;
    }

    // Based on trend
    if (trend === 'improving') {
      recommendations.push('tracking.recommendations.improving');
    } else if (trend === 'declining') {
      recommendations.push('tracking.recommendations.declining');
    } else if (trend === 'stable') {
      recommendations.push('tracking.recommendations.stable');
    }

    // Based on current level
    if (latest.level === 'high') {
      recommendations.push('tracking.recommendations.highStress');
    } else if (latest.level === 'moderate') {
      recommendations.push('tracking.recommendations.moderateStress');
    } else {
      recommendations.push('tracking.recommendations.lowStress');
    }

    // Based on category scores
    const categories = latest.categoryScores;
    const highestCategory = Object.entries(categories).reduce((a, b) => (a[1] > b[1] ? a : b));

    if (highestCategory[1] > 60) {
      recommendations.push(`tracking.recommendations.category.${highestCategory[0]}`);
    }

    return recommendations;
  }

  // Get level badge class
  getLevelBadgeClass(level: string): string {
    const classes: Record<string, string> = {
      low: 'badge bg-success',
      moderate: 'badge bg-warning',
      high: 'badge bg-danger',
    };
    return classes[level] || 'badge bg-secondary';
  }

  // Get trend icon
  getTrendIcon(): string {
    const trend = this.trend();
    const icons: Record<string, string> = {
      improving: 'fa-solid fa-arrow-trend-down text-success',
      stable: 'fa-solid fa-minus text-warning',
      declining: 'fa-solid fa-arrow-trend-up text-danger',
      insufficient_data: 'fa-solid fa-question text-muted',
    };
    return icons[trend] || 'fa-solid fa-question';
  }

  // Toggle reminder settings
  toggleReminderSettings(): void {
    this.showReminderSettings.update((show) => !show);
  }

  // Update reminder settings
  updateReminderSettings(settings: Partial<ReminderSettings>): void {
    this.historyService.updateReminderSettings(settings);
  }

  // Format date
  formatDate(date: Date): string {
    return new Date(date).toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  // Initialize charts
  private initializeCharts(): void {
    this.updateTrendChart();
    this.updateCategoryChart();
  }

  // Update trend chart
  private updateTrendChart(): void {
    const canvas = document.getElementById('trendChart') as HTMLCanvasElement;
    if (!canvas) return;

    const data = this.trendChartData();
    if (!data) return;

    // Destroy existing chart
    if (this.trendChart) {
      this.trendChart.destroy();
    }

    // Create new chart
    this.trendChart = new Chart(canvas, {
      type: 'line',
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            titleFont: {
              size: 14,
              weight: 'bold',
            },
            bodyFont: {
              size: 13,
            },
            callbacks: {
              label: (context) => {
                return `Nivel de Estrés: ${context.parsed.y}`;
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              callback: (value) => `${value}`,
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.05)',
            },
          },
          x: {
            grid: {
              display: false,
            },
          },
        },
      },
    });
  }

  // Update category chart
  private updateCategoryChart(): void {
    const canvas = document.getElementById('categoryChart') as HTMLCanvasElement;
    if (!canvas) return;

    const data = this.categoryChartData();
    if (!data) return;

    // Destroy existing chart
    if (this.categoryChart) {
      this.categoryChart.destroy();
    }

    // Create new chart
    this.categoryChart = new Chart(canvas, {
      type: 'bar',
      data: data,
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: {
            display: false,
          },
          tooltip: {
            backgroundColor: 'rgba(0, 0, 0, 0.8)',
            padding: 12,
            titleFont: {
              size: 14,
              weight: 'bold',
            },
            bodyFont: {
              size: 13,
            },
            callbacks: {
              label: (context) => {
                return `Puntuación: ${context.parsed.y}`;
              },
            },
          },
        },
        scales: {
          y: {
            beginAtZero: true,
            max: 100,
            ticks: {
              callback: (value) => `${value}`,
            },
            grid: {
              color: 'rgba(0, 0, 0, 0.05)',
            },
          },
          x: {
            grid: {
              display: false,
            },
          },
        },
      },
    });
  }
}
