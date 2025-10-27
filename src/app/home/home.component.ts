import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService } from '../services/auth.service';

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
  imports: [CommonModule, RouterLink, TranslateModule],
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

  constructor(private authService: AuthService) {}

  // Quick action methods
  startAssessment() {
    console.log('Starting stress assessment...');
    // TODO: Navigate to assessment page or open modal
  }

  startBreathingExercise() {
    console.log('Starting breathing exercise...');
    // TODO: Navigate to breathing exercise page or open modal
  }

  manageReminders() {
    console.log('Managing reminders...');
    // TODO: Navigate to reminders page or open modal
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

