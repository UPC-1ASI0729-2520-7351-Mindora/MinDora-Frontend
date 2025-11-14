import { Component, signal, computed, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

export interface AppointmentData {
  psychologistId: number;
  psychologistName: string;
  date: string;
  time: string;
  type: 'video' | 'in-person' | 'phone';
  reason: string;
  notes?: string;
}

export interface Psychologist {
  id: number;
  name: string;
  specialty: string;
  rating: number;
  nextAvailable: string;
}

@Component({
  selector: 'app-create-appointment-modal',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './create-appointment-modal.component.html',
  styleUrl: './create-appointment-modal.component.css',
})
export class CreateAppointmentModalComponent implements OnInit {
  @Output() close = new EventEmitter<void>();
  @Output() created = new EventEmitter<AppointmentData>();

  appointmentForm!: FormGroup;
  isSubmitting = signal(false);
  submitSuccess = signal(false);
  submitError = signal<string | null>(null);

  // Available psychologists (mock data - will be replaced with API call)
  psychologists = signal<Psychologist[]>([
    {
      id: 1,
      name: 'Dra. María González',
      specialty: 'Anxiety & Stress',
      rating: 4.9,
      nextAvailable: '2025-10-15',
    },
    {
      id: 2,
      name: 'Dr. Carlos Ruiz',
      specialty: 'Depression & Mood',
      rating: 4.8,
      nextAvailable: '2025-10-12',
    },
    {
      id: 3,
      name: 'Dra. Ana Martínez',
      specialty: 'Trauma & PTSD',
      rating: 4.9,
      nextAvailable: '2025-10-14',
    },
    {
      id: 4,
      name: 'Dr. Luis Fernández',
      specialty: 'Relationships',
      rating: 4.7,
      nextAvailable: '2025-10-16',
    },
    {
      id: 5,
      name: 'Dra. Sofia López',
      specialty: 'Work-Life Balance',
      rating: 4.8,
      nextAvailable: '2025-10-13',
    },
  ]);

  // Appointment types
  appointmentTypes = [
    { value: 'video', label: 'Video Call', icon: 'fa-video' },
    { value: 'in-person', label: 'In-Person', icon: 'fa-user' },
    { value: 'phone', label: 'Phone Call', icon: 'fa-phone' },
  ];

  // Common reasons for appointment
  commonReasons = [
    'Initial Consultation',
    'Follow-up Session',
    'Anxiety Management',
    'Stress Management',
    'Depression Support',
    'Relationship Issues',
    'Work-related Stress',
    'Other',
  ];

  constructor(private fb: FormBuilder) {}

  ngOnInit(): void {
    this.initializeForm();
  }

  private initializeForm(): void {
    const today = new Date().toISOString().split('T')[0];
    
    this.appointmentForm = this.fb.group({
      psychologistId: ['', Validators.required],
      date: ['', [Validators.required, this.futureDateValidator]],
      time: ['', Validators.required],
      type: ['video', Validators.required],
      reason: ['', Validators.required],
      notes: ['', Validators.maxLength(500)],
    });
  }

  // Custom validator for future dates
  private futureDateValidator(control: any) {
    if (!control.value) return null;
    
    const selectedDate = new Date(control.value);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    if (selectedDate < today) {
      return { pastDate: true };
    }
    
    return null;
  }

  // Get minimum date (today)
  getMinDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  // Get selected psychologist
  getSelectedPsychologist = computed(() => {
    const id = this.appointmentForm?.get('psychologistId')?.value;
    if (!id) return null;
    return this.psychologists().find(p => p.id === parseInt(id)) || null;
  });

  // Check if form field has error
  hasError(fieldName: string): boolean {
    const field = this.appointmentForm.get(fieldName);
    return !!(field?.invalid && field?.touched);
  }

  // Get error message for field
  getErrorMessage(fieldName: string): string {
    const field = this.appointmentForm.get(fieldName);
    if (!field?.errors || !field?.touched) return '';

    if (field.errors['required']) return 'This field is required';
    if (field.errors['pastDate']) return 'Please select a future date';
    if (field.errors['maxlength']) return `Maximum ${field.errors['maxlength'].requiredLength} characters`;
    
    return 'Invalid value';
  }

  // Select appointment type
  selectType(type: string): void {
    this.appointmentForm.patchValue({ type });
  }

  // Select reason
  selectReason(reason: string): void {
    this.appointmentForm.patchValue({ reason });
  }

  // Submit form
  async submitAppointment(): Promise<void> {
    if (this.appointmentForm.invalid) {
      this.markFormGroupTouched(this.appointmentForm);
      return;
    }

    this.isSubmitting.set(true);
    this.submitError.set(null);

    try {
      // Simulate API call
      await this.delay(1500);

      const formValue = this.appointmentForm.value;
      const selectedPsychologist = this.psychologists().find(
        p => p.id === parseInt(formValue.psychologistId)
      );

      const appointmentData: AppointmentData = {
        psychologistId: parseInt(formValue.psychologistId),
        psychologistName: selectedPsychologist?.name || '',
        date: formValue.date,
        time: formValue.time,
        type: formValue.type,
        reason: formValue.reason,
        notes: formValue.notes,
      };

      // Save to localStorage (temporary solution)
      this.saveAppointmentToLocalStorage(appointmentData);

      this.submitSuccess.set(true);
      
      // Emit created event
      this.created.emit(appointmentData);

      // Close modal after 2 seconds
      setTimeout(() => {
        this.closeModal();
      }, 2000);

    } catch (error) {
      this.submitError.set('Failed to create appointment. Please try again.');
      this.isSubmitting.set(false);
    }
  }

  private saveAppointmentToLocalStorage(appointment: AppointmentData): void {
    const appointments = this.getAppointmentsFromLocalStorage();
    const newAppointment = {
      id: Date.now(),
      ...appointment,
      status: 'upcoming',
      createdAt: new Date().toISOString(),
    };
    appointments.push(newAppointment);
    localStorage.setItem('neurozen_appointments', JSON.stringify(appointments));
  }

  private getAppointmentsFromLocalStorage(): any[] {
    const data = localStorage.getItem('neurozen_appointments');
    return data ? JSON.parse(data) : [];
  }

  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  // Close modal
  closeModal(): void {
    this.close.emit();
  }

  // Prevent backdrop click from closing during submission
  onBackdropClick(): void {
    if (!this.isSubmitting()) {
      this.closeModal();
    }
  }
}

