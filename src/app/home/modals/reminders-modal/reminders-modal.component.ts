import { Component, signal, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

interface Reminder {
  id: number;
  type: 'assessment' | 'breathing' | 'break' | 'water' | 'posture' | 'custom';
  title: string;
  time: string;
  days: string[]; // ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun']
  enabled: boolean;
  sound: boolean;
  notification: boolean;
}

@Component({
  selector: 'app-reminders-modal',
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './reminders-modal.component.html',
  styleUrl: './reminders-modal.component.css',
})
export class RemindersModalComponent {
  @Output() close = new EventEmitter<void>();

  reminders = signal<Reminder[]>(this.loadReminders());
  showAddForm = signal(false);
  
  // New reminder form
  newReminderType = signal<Reminder['type']>('assessment');
  newReminderTime = signal('09:00');
  newReminderDays = signal<string[]>(['mon', 'tue', 'wed', 'thu', 'fri']);
  newReminderSound = signal(true);
  newReminderNotification = signal(true);
  newReminderCustomTitle = signal('');

  // Preset reminder types
  reminderTypes = [
    { id: 'assessment' as const, icon: 'fa-clipboard-list', titleKey: 'reminders.types.assessment', color: '#0d6efd' },
    { id: 'breathing' as const, icon: 'fa-wind', titleKey: 'reminders.types.breathing', color: '#6f42c1' },
    { id: 'break' as const, icon: 'fa-mug-hot', titleKey: 'reminders.types.break', color: '#198754' },
    { id: 'water' as const, icon: 'fa-glass-water', titleKey: 'reminders.types.water', color: '#0dcaf0' },
    { id: 'posture' as const, icon: 'fa-person-walking', titleKey: 'reminders.types.posture', color: '#fd7e14' },
    { id: 'custom' as const, icon: 'fa-bell', titleKey: 'reminders.types.custom', color: '#6c757d' },
  ];

  weekDays = [
    { id: 'mon', label: 'reminders.days.mon' },
    { id: 'tue', label: 'reminders.days.tue' },
    { id: 'wed', label: 'reminders.days.wed' },
    { id: 'thu', label: 'reminders.days.thu' },
    { id: 'fri', label: 'reminders.days.fri' },
    { id: 'sat', label: 'reminders.days.sat' },
    { id: 'sun', label: 'reminders.days.sun' },
  ];

  private loadReminders(): Reminder[] {
    const saved = localStorage.getItem('wellnessReminders');
    if (saved) {
      return JSON.parse(saved);
    }
    
    // Default reminders
    return [
      {
        id: 1,
        type: 'assessment',
        title: 'reminders.types.assessment',
        time: '09:00',
        days: ['mon', 'wed', 'fri'],
        enabled: true,
        sound: true,
        notification: true,
      },
      {
        id: 2,
        type: 'water',
        title: 'reminders.types.water',
        time: '10:00',
        days: ['mon', 'tue', 'wed', 'thu', 'fri'],
        enabled: true,
        sound: false,
        notification: true,
      },
    ];
  }

  private saveReminders() {
    localStorage.setItem('wellnessReminders', JSON.stringify(this.reminders()));
  }

  toggleReminder(reminder: Reminder) {
    const reminders = this.reminders();
    const index = reminders.findIndex(r => r.id === reminder.id);
    if (index !== -1) {
      reminders[index].enabled = !reminders[index].enabled;
      this.reminders.set([...reminders]);
      this.saveReminders();
    }
  }

  deleteReminder(reminder: Reminder) {
    const reminders = this.reminders().filter(r => r.id !== reminder.id);
    this.reminders.set(reminders);
    this.saveReminders();
  }

  toggleDay(day: string) {
    const days = this.newReminderDays();
    if (days.includes(day)) {
      this.newReminderDays.set(days.filter(d => d !== day));
    } else {
      this.newReminderDays.set([...days, day]);
    }
  }

  isDaySelected(day: string): boolean {
    return this.newReminderDays().includes(day);
  }

  openAddForm() {
    this.showAddForm.set(true);
  }

  cancelAdd() {
    this.showAddForm.set(false);
    this.resetForm();
  }

  addReminder() {
    if (this.newReminderDays().length === 0) {
      alert('Selecciona al menos un día');
      return;
    }

    if (this.newReminderType() === 'custom' && !this.newReminderCustomTitle().trim()) {
      alert('Escribe un título para el recordatorio personalizado');
      return;
    }

    const newReminder: Reminder = {
      id: Date.now(),
      type: this.newReminderType(),
      title: this.newReminderType() === 'custom' 
        ? this.newReminderCustomTitle() 
        : `reminders.types.${this.newReminderType()}`,
      time: this.newReminderTime(),
      days: this.newReminderDays(),
      enabled: true,
      sound: this.newReminderSound(),
      notification: this.newReminderNotification(),
    };

    this.reminders.set([...this.reminders(), newReminder]);
    this.saveReminders();
    this.cancelAdd();
  }

  private resetForm() {
    this.newReminderType.set('assessment');
    this.newReminderTime.set('09:00');
    this.newReminderDays.set(['mon', 'tue', 'wed', 'thu', 'fri']);
    this.newReminderSound.set(true);
    this.newReminderNotification.set(true);
    this.newReminderCustomTitle.set('');
  }

  getReminderIcon(type: string): string {
    return this.reminderTypes.find(t => t.id === type)?.icon || 'fa-bell';
  }

  getReminderColor(type: string): string {
    return this.reminderTypes.find(t => t.id === type)?.color || '#6c757d';
  }

  closeModal() {
    this.close.emit();
  }
}
