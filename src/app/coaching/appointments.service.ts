import { Injectable } from '@angular/core';

export type ApptStatus = 'upcoming' | 'past' | 'cancelled';

export interface StoredAppointment {
  id: number;
  psychologist: string;
  date: string; // yyyy-mm-dd
  time: string; // HH:mm
  type: string;
  status: ApptStatus;
}

@Injectable({ providedIn: 'root' })
export class AppointmentsService {
  private KEY = 'mindora_appointments';

  load(): StoredAppointment[] {
    const raw = localStorage.getItem(this.KEY);
    if (!raw) return [];
    try { return JSON.parse(raw) as StoredAppointment[]; } catch { return []; }
  }

  save(list: StoredAppointment[]) {
    localStorage.setItem(this.KEY, JSON.stringify(list));
  }

  cancel(id: number) {
    const list = this.load().map(a => a.id === id ? { ...a, status: 'cancelled' as const } : a);
    this.save(list);
    return list;
  }

  reschedule(id: number, date: string, time: string) {
    const list = this.load().map(a => a.id === id ? { ...a, date, time, status: 'upcoming' as const } : a);
    this.save(list);
    return list;
  }
}