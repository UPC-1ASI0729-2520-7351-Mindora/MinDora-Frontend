import { Component, signal, computed, OnInit } from '@angular/core';
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
import { BreathingExercisesModalComponent } from './modals/breathing-exercises-modal/breathing-exercises-modal.component';
import { RemindersModalComponent } from './modals/reminders-modal/reminders-modal.component';
import { WellnessTipModalComponent } from './modals/wellness-tip-modal/wellness-tip-modal.component';
import { VideoCallModalComponent } from '../shared/video-call-modal/video-call-modal.component';
import { AssessmentHistoryService } from '../services/assessment-history.service';
import { AppointmentsService, StoredAppointment } from '../coaching/appointments.service';
import { Appointment as BackendAppointment } from '../services/appointments-http.service';

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
    BreathingExercisesModalComponent,
    RemindersModalComponent,
    WellnessTipModalComponent,
    VideoCallModalComponent,
  ],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css',
})
export class HomeComponent implements OnInit {
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

  // Upcoming appointments from backend
  private allAppointments = signal<StoredAppointment[]>([]);
  
  upcomingAppointments = computed(() => {
    const now = new Date();
    return this.allAppointments()
      .filter(apt => {
        if (apt.status !== 'upcoming') return false;
        const aptDate = new Date(`${apt.date}T${apt.time}`);
        return aptDate >= now;
      })
      .sort((a, b) => {
        const dateA = new Date(`${a.date}T${a.time}`);
        const dateB = new Date(`${b.date}T${b.time}`);
        return dateA.getTime() - dateB.getTime();
      })
      .slice(0, 3); // Show only next 3
  });

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
  showWellnessTipModal = signal(false);
  showVideoCallModal = signal(false);
  selectedAppointmentForCall = signal<StoredAppointment | null>(null);

  constructor(
    private authService: AuthService,
    private assessmentHistoryService: AssessmentHistoryService,
    public appointmentsService: AppointmentsService
  ) {
    // Load latest assessment from history
    const latestAssessment = this.assessmentHistoryService.getLatestAssessment();
    if (latestAssessment) {
      this.updateStressLevelFromAssessment(latestAssessment);
    }
  }

  ngOnInit() {
    this.loadAppointmentsFromBackend();
  }

  // Cargar citas desde el backend
  loadAppointmentsFromBackend() {
    this.appointmentsService.httpService.getAllAppointments().subscribe({
      next: (backendAppointments: BackendAppointment[]) => {
        // Mapear al formato local
        const mapped = backendAppointments.map(appt => {
          // Normalizar el ID
          const appointmentId = typeof appt.id === 'object' && appt.id && 'value' in appt.id 
            ? (appt.id as any).value 
            : appt.id || 0;
          
          // Mapear status
          let mappedStatus: 'upcoming' | 'past' | 'cancelled' = 'upcoming';
          const backendStatus = appt.status?.toUpperCase();
          
          if (backendStatus === 'SCHEDULED' || backendStatus === 'CONFIRMED' || backendStatus === 'UPCOMING') {
            mappedStatus = 'upcoming';
          } else if (backendStatus === 'CANCELLED') {
            mappedStatus = 'cancelled';
          } else if (backendStatus === 'COMPLETED' || backendStatus === 'PAST') {
            mappedStatus = 'past';
          }
          
          // Mapear tipo
          const typeMap: {[key: string]: string} = {
            'video': 'Videollamada',
            'phone': 'Teléfono',
            'in-person': 'Presencial'
          };
          
          return {
            id: appointmentId,
            psychologist: appt.psychologistName,
            date: appt.date,
            time: appt.time,
            type: typeMap[appt.type] || appt.type,
            status: mappedStatus
          };
        });
        
        this.allAppointments.set(mapped as StoredAppointment[]);
        console.log('✅ [Home] Citas cargadas:', mapped.length);
      },
      error: (error: any) => {
        console.error('❌ [Home] Error al cargar citas:', error);
        this.allAppointments.set([]);
      }
    });
  }

  // Quick action methods
  startAssessment() {
    this.showStressAssessmentModal.set(true);
  }

  startBreathingExercise() {
    this.showBreathingModal.set(true);
  }

  onBreathingModalClose() {
    this.showBreathingModal.set(false);
  }

  manageReminders() {
    this.showRemindersModal.set(true);
  }

  onRemindersModalClose() {
    this.showRemindersModal.set(false);
  }

  tryWellnessTip() {
    this.showWellnessTipModal.set(true);
  }

  onWellnessTipModalClose() {
    this.showWellnessTipModal.set(false);
  }

  joinVideoCall(appointment: StoredAppointment) {
    this.selectedAppointmentForCall.set(appointment);
    this.showVideoCallModal.set(true);
  }

  onVideoCallClose() {
    this.showVideoCallModal.set(false);
    this.selectedAppointmentForCall.set(null);
  }

  formatAppointmentDate(date: string): string {
    const d = new Date(date);
    const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
    return `${months[d.getMonth()]} ${d.getDate()}, ${d.getFullYear()}`;
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
    
    // Crear la cita en el formato correcto
    const newAppointment = {
      id: Date.now(),
      psychologist: appointmentData.psychologistName,
      date: appointmentData.date,
      time: appointmentData.time,
      type: appointmentData.type === 'video' ? 'Videollamada' : 
            appointmentData.type === 'phone' ? 'Teléfono' : 'Presencial',
      status: 'upcoming' as const,
    };

    // Cargar citas existentes y agregar la nueva
    const currentAppointments = this.appointmentsService.load();
    const updatedAppointments = [...currentAppointments, newAppointment];
    
    // Guardar usando el servicio compartido
    this.appointmentsService.save(updatedAppointments);
    
    console.log('Cita guardada en el servicio compartido');
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