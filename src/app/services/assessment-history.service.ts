import { Injectable, signal } from '@angular/core';

export interface AssessmentResult {
  id: string;
  score: number; // 0-100
  level: 'low' | 'moderate' | 'high';
  recommendations: string[];
  timestamp: Date;
  categoryScores: {
    work: number; // 0-100
    sleep: number; // 0-100
    physical: number; // 0-100
    emotional: number; // 0-100
  };
  answers: Map<string, number>;
}

export interface ReminderSettings {
  enabled: boolean;
  frequency: 'weekly' | 'biweekly' | 'monthly' | 'custom';
  customDays?: number;
  lastReminder?: Date;
  nextReminder?: Date;
}

@Injectable({
  providedIn: 'root',
})
export class AssessmentHistoryService {
  // Assessment history stored in signal
  private assessmentHistory = signal<AssessmentResult[]>([]);

  // Reminder settings
  private reminderSettings = signal<ReminderSettings>({
    enabled: false,
    frequency: 'weekly',
  });

  constructor() {
    this.loadFromLocalStorage();
    this.generateMockData(); // For initial testing
  }

  // Get all assessments
  getAssessments() {
    return this.assessmentHistory.asReadonly();
  }

  // Get assessments filtered by date range
  getAssessmentsByDateRange(startDate: Date, endDate: Date): AssessmentResult[] {
    return this.assessmentHistory().filter((assessment) => {
      const assessmentDate = new Date(assessment.timestamp);
      return assessmentDate >= startDate && assessmentDate <= endDate;
    });
  }

  // Get latest assessment
  getLatestAssessment(): AssessmentResult | null {
    const assessments = this.assessmentHistory();
    if (assessments.length === 0) return null;
    return assessments[assessments.length - 1];
  }

  // Add new assessment
  addAssessment(assessment: AssessmentResult): void {
    const newAssessment = {
      ...assessment,
      id: this.generateId(),
      timestamp: new Date(),
    };
    this.assessmentHistory.update((history) => [...history, newAssessment]);
    this.saveToLocalStorage();
  }

  // Delete assessment
  deleteAssessment(id: string): void {
    this.assessmentHistory.update((history) =>
      history.filter((assessment) => assessment.id !== id)
    );
    this.saveToLocalStorage();
  }

  // Get assessment by ID
  getAssessmentById(id: string): AssessmentResult | null {
    return this.assessmentHistory().find((a) => a.id === id) || null;
  }

  // Calculate trend (improving, stable, declining)
  getTrend(): 'improving' | 'stable' | 'declining' | 'insufficient_data' {
    const assessments = this.assessmentHistory();
    if (assessments.length < 2) return 'insufficient_data';

    const recent = assessments.slice(-3); // Last 3 assessments
    const scores = recent.map((a) => a.score);

    // Calculate average change
    let totalChange = 0;
    for (let i = 1; i < scores.length; i++) {
      totalChange += scores[i] - scores[i - 1];
    }
    const avgChange = totalChange / (scores.length - 1);

    if (avgChange < -5) return 'improving'; // Score decreasing = improving
    if (avgChange > 5) return 'declining'; // Score increasing = declining
    return 'stable';
  }

  // Get days since last assessment
  getDaysSinceLastAssessment(): number | null {
    const latest = this.getLatestAssessment();
    if (!latest) return null;

    const now = new Date();
    const lastAssessment = new Date(latest.timestamp);
    const diffTime = Math.abs(now.getTime() - lastAssessment.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  }

  // Get category averages over time
  getCategoryAverages(): {
    work: number;
    sleep: number;
    physical: number;
    emotional: number;
  } {
    const assessments = this.assessmentHistory();
    if (assessments.length === 0) {
      return { work: 0, sleep: 0, physical: 0, emotional: 0 };
    }

    const totals = { work: 0, sleep: 0, physical: 0, emotional: 0 };
    assessments.forEach((assessment) => {
      totals.work += assessment.categoryScores.work;
      totals.sleep += assessment.categoryScores.sleep;
      totals.physical += assessment.categoryScores.physical;
      totals.emotional += assessment.categoryScores.emotional;
    });

    const count = assessments.length;
    return {
      work: Math.round(totals.work / count),
      sleep: Math.round(totals.sleep / count),
      physical: Math.round(totals.physical / count),
      emotional: Math.round(totals.emotional / count),
    };
  }

  // Reminder settings methods
  getReminderSettings() {
    return this.reminderSettings.asReadonly();
  }

  updateReminderSettings(settings: Partial<ReminderSettings>): void {
    this.reminderSettings.update((current) => ({
      ...current,
      ...settings,
    }));
    this.saveToLocalStorage();
  }

  // Calculate next reminder date
  calculateNextReminder(): Date | null {
    const settings = this.reminderSettings();
    if (!settings.enabled) return null;

    const now = new Date();
    let daysToAdd = 7; // Default weekly

    switch (settings.frequency) {
      case 'weekly':
        daysToAdd = 7;
        break;
      case 'biweekly':
        daysToAdd = 14;
        break;
      case 'monthly':
        daysToAdd = 30;
        break;
      case 'custom':
        daysToAdd = settings.customDays || 7;
        break;
    }

    const nextDate = new Date(now);
    nextDate.setDate(nextDate.getDate() + daysToAdd);
    return nextDate;
  }

  // Local storage methods
  private saveToLocalStorage(): void {
    try {
      const data = {
        assessments: this.assessmentHistory().map((a) => ({
          ...a,
          answers: Array.from(a.answers.entries()),
        })),
        reminderSettings: this.reminderSettings(),
      };
      localStorage.setItem('neurozen_assessments', JSON.stringify(data));
    } catch (error) {
      console.error('Error saving to localStorage:', error);
    }
  }

  private loadFromLocalStorage(): void {
    try {
      const data = localStorage.getItem('neurozen_assessments');
      if (data) {
        const parsed = JSON.parse(data);
        if (parsed.assessments) {
          const assessments = parsed.assessments.map((a: any) => ({
            ...a,
            timestamp: new Date(a.timestamp),
            answers: new Map(a.answers),
          }));
          this.assessmentHistory.set(assessments);
        }
        if (parsed.reminderSettings) {
          this.reminderSettings.set(parsed.reminderSettings);
        }
      }
    } catch (error) {
      console.error('Error loading from localStorage:', error);
    }
  }

  private generateId(): string {
    return `assessment_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Generate mock data for testing
  private generateMockData(): void {
    // Only generate if no data exists
    if (this.assessmentHistory().length > 0) return;

    const mockAssessments: AssessmentResult[] = [
      {
        id: this.generateId(),
        score: 65,
        level: 'moderate',
        timestamp: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
        categoryScores: { work: 70, sleep: 60, physical: 65, emotional: 65 },
        recommendations: [
          'modals.stressAssessment.recommendations.moderate_1',
          'modals.stressAssessment.recommendations.moderate_2',
        ],
        answers: new Map(),
      },
      {
        id: this.generateId(),
        score: 58,
        level: 'moderate',
        timestamp: new Date(Date.now() - 23 * 24 * 60 * 60 * 1000), // 23 days ago
        categoryScores: { work: 65, sleep: 55, physical: 60, emotional: 55 },
        recommendations: [
          'modals.stressAssessment.recommendations.moderate_1',
          'modals.stressAssessment.recommendations.moderate_3',
        ],
        answers: new Map(),
      },
      {
        id: this.generateId(),
        score: 52,
        level: 'moderate',
        timestamp: new Date(Date.now() - 16 * 24 * 60 * 60 * 1000), // 16 days ago
        categoryScores: { work: 60, sleep: 50, physical: 55, emotional: 50 },
        recommendations: [
          'modals.stressAssessment.recommendations.moderate_2',
          'modals.stressAssessment.recommendations.moderate_4',
        ],
        answers: new Map(),
      },
      {
        id: this.generateId(),
        score: 45,
        level: 'moderate',
        timestamp: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000), // 9 days ago
        categoryScores: { work: 50, sleep: 45, physical: 48, emotional: 42 },
        recommendations: [
          'modals.stressAssessment.recommendations.moderate_1',
          'modals.stressAssessment.recommendations.moderate_4',
        ],
        answers: new Map(),
      },
      {
        id: this.generateId(),
        score: 38,
        level: 'moderate',
        timestamp: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
        categoryScores: { work: 42, sleep: 38, physical: 40, emotional: 35 },
        recommendations: [
          'modals.stressAssessment.recommendations.low_1',
          'modals.stressAssessment.recommendations.low_2',
        ],
        answers: new Map(),
      },
    ];

    this.assessmentHistory.set(mockAssessments);
    this.saveToLocalStorage();
  }

  // Clear all data (for testing)
  clearAllData(): void {
    this.assessmentHistory.set([]);
    this.reminderSettings.set({
      enabled: false,
      frequency: 'weekly',
    });
    localStorage.removeItem('neurozen_assessments');
  }
}

