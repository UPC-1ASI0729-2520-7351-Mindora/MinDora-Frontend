import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../services/auth.service';
import {
  StressAssessmentModalComponent,
  AssessmentResult,
} from './modals/stress-assessment-modal/stress-assessment-modal.component';

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
  imports: [CommonModule, RouterLink, TranslateModule, StressAssessmentModalComponent],
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

  constructor(private authService: AuthService) {}

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

  onStressAssessmentCompleted(result: AssessmentResult) {
    console.log('Assessment completed:', result);
    // Update stress level with new result
    let status: 'low' | 'moderate' | 'high';
    if (result.score < 33) {
      status = 'low';
    } else if (result.score < 67) {
      status = 'moderate';
    } else {
      status = 'high';
    }

    const colors = {
      low: '#10b981',
      moderate: '#ffc107',
      high: '#ef4444',
    };

    this.stressLevel.set({
      value: result.score,
      status,
      color: colors[status],
      message: `home.stressLevel.${status}`,
    });

    // Close modal
    this.showStressAssessmentModal.set(false);
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
