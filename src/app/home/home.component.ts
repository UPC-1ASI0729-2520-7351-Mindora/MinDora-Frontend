import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../services/auth.service';
import {
  StressAssessmentModalComponent,
  AssessmentResult,
} from './modals/stress-assessment-modal/stress-assessment-modal.component';
import {
  CreateAppointmentModalComponent,
  AppointmentData,
} from './modals/create-appointment-modal/create-appointment-modal.component';
import { AssessmentHistoryService } from '../services/assessment-history.service';

interface StressLevel {
  value: number; // 0-100
  status: 'low' | 'moderate' | 'high';
  color: string;
  message: string;
}

interface QuickAction {
  id: string;
  icon: string;
  title: string;
  description: string;
  route?: string;
  action?: () => void;
}

interface NavigationCard {
  id: string;
  icon: string;
  title: string;
  description: string;
  route: string;
  color: string;
}

@Component({
  selector: 'app-home',
  imports: [
    CommonModule,
    RouterLink,
    TranslateModule,
    StressAssessmentModalComponent,
    CreateAppointmentModalComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent {
  // Current user
  currentUser = computed(() => this.authService.getCurrentUser());

  // Stress level data (mock data - can be replaced with API call)
  stressLevel = signal<StressLevel>({
    value: 45,
    status: 'moderate',
    color: '#ffc107',
    message: 'home.stressLevel.moderate',
  });

  // Quick actions
  quickActions = signal<QuickAction[]>([
    {
      id: 'assessment',
      icon: 'fa-clipboard-list',
      title: 'home.quickActions.assessment.title',
      description: 'home.quickActions.assessment.description',
      action: () => this.startAssessment(),
    },
    {
      id: 'breathing',
      icon: 'fa-wind',
      title: 'home.quickActions.breathing.title',
      description: 'home.quickActions.breathing.description',
      action: () => this.startBreathingExercise(),
    },
    {
      id: 'reminders',
      icon: 'fa-bell',
      title: 'home.quickActions.reminders.title',
      description: 'home.quickActions.reminders.description',
      action: () => this.manageReminders(),
    },
  ]);

  // Navigation cards
  navigationCards = signal<NavigationCard[]>([
    {
      id: 'routines',
      icon: 'fa-calendar-days',
      title: 'home.navigation.routines.title',
      description: 'home.navigation.routines.description',
      route: '/routines',
      color: '#0d6efd',
    },
    {
      id: 'community',
      icon: 'fa-users',
      title: 'home.navigation.community.title',
      description: 'home.navigation.community.description',
      route: '/coaching',
      color: '#198754',
    },
    {
      id: 'reports',
      icon: 'fa-chart-line',
      title: 'home.navigation.reports.title',
      description: 'home.navigation.reports.description',
      route: '/reports',
      color: '#6f42c1',
    },
  ]);

  // Recent activity (mock data)
  recentActivity = signal([
    {
      id: 1,
      type: 'appointment',
      message: 'home.activity.appointmentCompleted',
      time: '2 hours ago',
      icon: 'fa-calendar-check',
    },
    {
      id: 2,
      type: 'exercise',
      message: 'home.activity.breathingCompleted',
      time: '1 day ago',
      icon: 'fa-wind',
    },
  ]);

  // Computed properties
  stressLevelPercentage = computed(() => this.stressLevel().value);
  stressLevelClass = computed(() => {
    const status = this.stressLevel().status;
    return {
      'stress-low': status === 'low',
      'stress-moderate': status === 'moderate',
      'stress-high': status === 'high',
    };
  });

  // Modal states
  showStressAssessmentModal = signal(false);
  showBreathingModal = signal(false);
  showRemindersModal = signal(false);
  showBookSessionModal = signal(false);

  constructor(
    private authService: AuthService,
    private assessmentHistoryService: AssessmentHistoryService
  ) {
    // Load latest assessment from history
    const latestAssessment = this.assessmentHistoryService.getLatestAssessment();
    if (latestAssessment) {
      this.updateStressLevelFromAssessment(latestAssessment);
    }
  }

  // Quick action methods
  startAssessment() {
    this.showStressAssessmentModal.set(true);
  }

  startBreathingExercise() {
    this.showBreathingModal.set(true);
    console.log('Starting breathing exercise...');
    // TODO: Implement breathing exercise modal
  }

  manageReminders() {
    this.showRemindersModal.set(true);
    console.log('Managing reminders...');
    // TODO: Implement reminders modal
  }

  bookSession() {
    this.showBookSessionModal.set(true);
  }

  // Modal event handlers
  onStressAssessmentClose() {
    this.showStressAssessmentModal.set(false);
  }

  onAppointmentModalClose() {
    this.showBookSessionModal.set(false);
  }

  onAppointmentCreated(appointmentData: AppointmentData) {
    console.log('Appointment created:', appointmentData);
    // TODO: Refresh appointments list or show notification
  }

  onStressAssessmentCompleted(result: AssessmentResult) {
    console.log('Assessment completed:', result);

    // Calculate category scores from answers (mock for now)
    const categoryScores = {
      work: Math.min(100, Math.max(0, result.score + Math.random() * 20 - 10)),
      sleep: Math.min(100, Math.max(0, result.score + Math.random() * 20 - 10)),
      physical: Math.min(100, Math.max(0, result.score + Math.random() * 20 - 10)),
      emotional: Math.min(100, Math.max(0, result.score + Math.random() * 20 - 10)),
    };

    // Save to assessment history
    const assessmentResult = {
      id: '',
      score: result.score,
      level: result.level,
      recommendations: result.recommendations,
      timestamp: result.timestamp,
      categoryScores,
      answers: new Map(),
    };

    this.assessmentHistoryService.addAssessment(assessmentResult);

    // Update stress level display
    this.updateStressLevelFromAssessment(assessmentResult);

    // Close modal
    this.showStressAssessmentModal.set(false);
  }

  private updateStressLevelFromAssessment(assessment: any) {
    const colors: { [key: string]: string } = {
      low: '#10b981',
      moderate: '#ffc107',
      high: '#ef4444',
    };

    // Ensure level is one of the valid types
    const level = assessment.level as 'low' | 'moderate' | 'high';
    const color = colors[level] || '#6c757d'; // Default gray if level not found

    this.stressLevel.set({
      value: assessment.score,
      status: level,
      color: color,
      message: `home.stressLevel.${level}`,
    });
  }

  // Helper method to get stress level color
  getStressLevelColor(): string {
    return this.stressLevel().color;
  }

  // Helper method to get greeting based on time of day
  getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'home.greeting.morning';
    if (hour < 18) return 'home.greeting.afternoon';
    return 'home.greeting.evening';
  }
}
