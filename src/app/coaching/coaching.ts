import { Component, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { AppointmentsService } from './appointments.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';


interface Psychologist {
  id: number;
  name: string;
  specialty: string;
  rating: number;
  reviews: number;
  price: number;
  image: string;
  experience: number;
  languages: string[];
  nextAvailable: string;
  specialties: string[];
  about: string;
}
interface Challenge {
  id: number;
  title: string;
  description: string;
  target: number;   // meta (ej: 5 días)
  progress: number; // progreso actual
  joined: boolean;  // si el usuario se unió
}
interface ForumTopic {
  id: number;
  title: string;
  category: string;
  author: string;
  replies: number;
  views: number;
  lastActivity: string;
}
type ApptStatus = Appointment['status'];
const CANCELLED: ApptStatus = 'cancelled';

interface Appointment {
  id: number;
  psychologist: string;
  date: string;
  time: string;
  type: string;
  status: 'upcoming' | 'past' | 'cancelled';
}


interface Resource {
  id: number;
  title: string;
  category: 'article' | 'video' | 'guide';
  url?: string;
}

interface Trigger {
  id: number;
  text: string;
  tags: string[];
  ts: number; 
}
interface Group {
  id: number;
  name: string;
  members: number;
  joined: boolean;
}

@Component({
  selector: 'app-coaching',
  imports: [TranslateModule, CommonModule, FormsModule],
  templateUrl: './coaching.html',
  styleUrl: './coaching.css',
})





export class Coaching {
  constructor(private apptsSvc: AppointmentsService) {}
  activeTab = signal<'psychologists' | 'community' | 'appointments'>('psychologists');
  selectedFilter = signal('all');
  searchQuery = signal('');


/////
// === US Favoritos===
private RES_SAVED_KEY = 'mindora_saved_resources';
savedResources = signal<number[]>([]);

private loadSavedResources() {
  const raw = localStorage.getItem(this.RES_SAVED_KEY);
  if (!raw) return;
  try { this.savedResources.set(JSON.parse(raw)); } catch {}
}

private persistSavedResources() {
  localStorage.setItem(this.RES_SAVED_KEY, JSON.stringify(this.savedResources()));
}

toggleResourceSaved(id: number) {
  const current = new Set(this.savedResources());
  if (current.has(id)) current.delete(id);
  else current.add(id);
  this.savedResources.set([...current]);
  this.persistSavedResources();
}

isResourceSaved(id: number) {
  return this.savedResources().includes(id);
}
// ======


////

// ===== US12 =====
private TRIGGERS_KEY = 'mindora_triggers';

triggerText = signal<string>('');
selectedTriggerTags = signal<string[]>([]);
triggers = signal<Trigger[]>([]);

triggerTagOptions = ['meetings', 'emails', 'deadlines', 'conflicts', 'overtime'];
// ==========
////

openReschedule(a: Appointment) {
  this.apptToEdit.set(a);
  this.rescheduleDate.set(a.date);
  this.rescheduleTime.set(a.time);
  this.rescheduleError.set('');
  this.showRescheduleModal.set(true);
}

closeReschedule() {
  this.showRescheduleModal.set(false);
  this.apptToEdit.set(null);
}

confirmReschedule() {
  const appt = this.apptToEdit();
  const d = this.rescheduleDate();
  const t = this.rescheduleTime();

  if (!appt || !d || !t) {
    this.rescheduleError.set('Selecciona fecha y hora.');
    return;
  }
  if (this.hasConflict(d, t, appt.id)) {
    this.rescheduleError.set('Ya tienes una cita en ese horario.');
    return;
  }

  const updated = this.appointments().map(a =>
    a.id === appt.id ? { ...a, date: d, time: t } : a
  );
  this.appointments.set(updated);
  this.apptsSvc.save(updated as any);
  this.closeReschedule();
}

openCancel(a: Appointment) {
  this.apptToEdit.set(a);
  this.showCancelModal.set(true);
}

closeCancel() {
  this.showCancelModal.set(false);
  this.apptToEdit.set(null);
}

confirmCancel() {
  const appt = this.apptToEdit();
  if (!appt) return;

  const updated: Appointment[] = this.appointments().map(a =>
    a.id === appt.id ? { ...a, status: CANCELLED } : a
  );

  this.appointments.set(updated);
  this.apptsSvc.save(updated as any);
  this.closeCancel();
}
/////////////
icsFor(a: Appointment): string {
  const pad = (n: number) => String(n).padStart(2, '0');
  const toICSDate = (d: Date) =>
    `${d.getUTCFullYear()}${pad(d.getUTCMonth()+1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}00Z`;

  // construimos fecha/hora local y asumimos 45 min de sesión
  const [hh, mm] = a.time.split(':').map(Number);
  const start = new Date(`${a.date}T${a.time}:00`);
  const end = new Date(start.getTime() + 45 * 60000);

  const ics =
`BEGIN:VCALENDAR
VERSION:2.0
PRODID:-//Mindora//Appointments//EN
BEGIN:VEVENT
UID:${a.id}@mindora
DTSTAMP:${toICSDate(new Date())}
DTSTART:${toICSDate(start)}
DTEND:${toICSDate(end)}
SUMMARY:Session with ${a.psychologist}
DESCRIPTION:Mindora coaching session (${a.type})
END:VEVENT
END:VCALENDAR`;

  return 'data:text/calendar;charset=utf-8,' + encodeURIComponent(ics);
}
/////////////////////
// ===== US08: Respiración guiada 4-4-4-4 =====
private BREATH_STATE_KEY = 'mindora_breath_state';
private BREATH_LOGS_KEY = 'mindora_breath_logs';
private BREATH_TOTAL = 120;         // 2 minutos
private BREATH_PHASE_LEN = 4;       // patrón 4-4-4-4 no se olviden plz
private breathTimer: any = null;

showBreathModal = signal(false);
breathPhase = signal<'inhale'|'hold1'|'exhale'|'hold2'>('inhale');
breathSecondsLeft = signal<number>(this.BREATH_PHASE_LEN);
breathTotalLeft = signal<number>(this.BREATH_TOTAL);
breathRunning = signal(false);
breathCompleted = signal(false);

openBreathing() {
  const raw = localStorage.getItem(this.BREATH_STATE_KEY);
  if (raw) {
    try {
      const s = JSON.parse(raw);
      this.breathPhase.set(s.phase ?? 'inhale');
      this.breathSecondsLeft.set(typeof s.phaseLeft === 'number' ? s.phaseLeft : this.BREATH_PHASE_LEN);
      this.breathTotalLeft.set(typeof s.totalLeft === 'number' ? s.totalLeft : this.BREATH_TOTAL);
      this.breathCompleted.set(false);
      this.breathRunning.set(false);
    } catch {
      this.resetBreathing();
    }
  } else {
    this.resetBreathing();
  }
  this.showBreathModal.set(true);
}

closeBreathing() {
  this.pauseBreathing(); 
  this.showBreathModal.set(false);
}

startBreathing() {
  if (this.breathCompleted()) return;
  if (this.breathRunning()) return;
  this.breathRunning.set(true);
  this.breathTimer = setInterval(() => this.tickBreathing(), 1000);
}

pauseBreathing() {
  this.breathRunning.set(false);
  if (this.breathTimer) {
    clearInterval(this.breathTimer);
    this.breathTimer = null;
  }
  this.saveBreathState();
}

resetBreathing() {
  this.pauseBreathing();
  this.breathPhase.set('inhale');
  this.breathSecondsLeft.set(this.BREATH_PHASE_LEN);
  this.breathTotalLeft.set(this.BREATH_TOTAL);
  this.breathCompleted.set(false);
  localStorage.removeItem(this.BREATH_STATE_KEY);
}

private tickBreathing() {
  if (this.breathTotalLeft() <= 0) {
    this.completeBreathing();
    return;
  }

  // descontar 1s
  this.breathSecondsLeft.set(this.breathSecondsLeft() - 1);
  this.breathTotalLeft.set(this.breathTotalLeft() - 1);

  if (this.breathSecondsLeft() <= 0) {
    this.advanceBreathPhase();
  }

  this.saveBreathState();

  if (this.breathTotalLeft() <= 0) {
    this.completeBreathing();
  }
}

private advanceBreathPhase() {
  const p = this.breathPhase();
  const next: Record<typeof p, typeof p> = {
    inhale: 'hold1',
    hold1:  'exhale',
    exhale: 'hold2',
    hold2:  'inhale'
  } as any;
  this.breathPhase.set(next[p]);
  this.breathSecondsLeft.set(this.BREATH_PHASE_LEN);
}

private saveBreathState() {
  const state = {
    phase: this.breathPhase(),
    phaseLeft: this.breathSecondsLeft(),
    totalLeft: this.breathTotalLeft()
  };
  localStorage.setItem(this.BREATH_STATE_KEY, JSON.stringify(state));
}

private completeBreathing() {
  this.pauseBreathing();
  this.breathCompleted.set(true);
  // registrar actividad
  const raw = localStorage.getItem(this.BREATH_LOGS_KEY);
  const logs: Array<{ts:number; durationSec:number; type:string}> = raw ? JSON.parse(raw) : [];
  logs.push({ ts: Date.now(), durationSec: this.BREATH_TOTAL, type: 'box-4-4-4-4' });
  localStorage.setItem(this.BREATH_LOGS_KEY, JSON.stringify(logs));
  // limpiar estado de sesión
  localStorage.removeItem(this.BREATH_STATE_KEY);
}

breathProgress() {
  return Math.round(((this.BREATH_TOTAL - this.breathTotalLeft()) / this.BREATH_TOTAL) * 100);
}

hasBreathSaved() {
  return !!localStorage.getItem(this.BREATH_STATE_KEY);
}
/////////////////
private CHALLENGE_KEY = 'mindora_challenges';

challenges = signal<Challenge[]>([
  { id: 1, title: 'Respira 4-4-4-4 (5 días)', description: 'Completa una sesión diaria de 2 minutos.', target: 5, progress: 0, joined: false },
  { id: 2, title: 'Micro-pausas (hoy)', description: 'Realiza 3 micro-pausas en tu jornada.', target: 3, progress: 0, joined: false }
]);

private saveChallenges() {
  localStorage.setItem(this.CHALLENGE_KEY, JSON.stringify(this.challenges()));
}

////////////////
// ===== US12=====
isTagSelected(tag: string) {
  return this.selectedTriggerTags().includes(tag);
}

toggleTriggerTag(tag: string) {
  const sel = this.selectedTriggerTags();
  this.selectedTriggerTags.set(
    sel.includes(tag) ? sel.filter(t => t !== tag) : [...sel, tag]
  );
}

addTrigger() {
  const text = this.triggerText().trim();
  if (!text) return;

  const t: Trigger = {
    id: Date.now(),
    text,
    tags: this.selectedTriggerTags(),
    ts: Date.now()
  };

  this.triggers.set([t, ...this.triggers()]);
  localStorage.setItem(this.TRIGGERS_KEY, JSON.stringify(this.triggers()));
  this.triggerText.set('');
  this.selectedTriggerTags.set([]);
}

removeTrigger(id: number) {
  this.triggers.set(this.triggers().filter(x => x.id !== id));
  localStorage.setItem(this.TRIGGERS_KEY, JSON.stringify(this.triggers()));
}

fmtDate(ts: number) {
  const d = new Date(ts);
  return d.toLocaleString();
}
// ==========
//////////////
private GROUPS_KEY = 'mindora_groups';

groups = signal<Group[]>([
  { id: 1, name: 'Ansiedad en el trabajo', members: 324, joined: false },
  { id: 2, name: 'Mindfulness para principiantes', members: 512, joined: false },
  { id: 3, name: 'Recuperación del burnout', members: 276, joined: false }
]);

private saveGroups() {
  localStorage.setItem(this.GROUPS_KEY, JSON.stringify(this.groups()));
}


// ===== US08 =====




  // lo que hacemos es desde la tarjeta del psicólogo abrir un modal simple (sin librerías), 
  // elegir fecha/hora, validar conflictos y guardar en localStorage
  showBookingModal = signal(false);
bookingDate = signal<string>('');

// ===== US09: Reprogramar / Cancelar cita =====
showCancelModal = signal(false);
showRescheduleModal = signal(false);
apptToEdit = signal<Appointment | null>(null);

rescheduleDate = signal<string>(''); // yyyy-mm-dd
rescheduleTime = signal<string>(''); // HH:mm
rescheduleError = signal<string>('');
// ===== fin US09 =====

// ===== US15 =====
showShareModal = signal(false);
shareEmail = signal<string>('');
sharePeriod = signal<'30d'|'all'>('30d');
shareError = signal<string>('');
shareLink = signal<string | null>(null);
shareCopied = signal(false);
private SHARED_KEY = 'mindora_shared_reports';
// ==========

bookingTime = signal<string>('');
bookingError = signal<string>('');
selectedPsychologist: Psychologist | null = null;
// ===== US06=====
showProfileModal = signal(false);
selectedProfile: Psychologist | null = null;

openProfile(p: Psychologist) {
  this.selectedProfile = p;
  this.showProfileModal.set(true);
}

closeProfile() {
  this.showProfileModal.set(false);
  this.selectedProfile = null;
}
// ===== fin US06 =====

//private APPTS_KEY = 'mindora_appointments';

ngOnInit() {
  const stored = this.apptsSvc.load();
  const chRaw = localStorage.getItem(this.CHALLENGE_KEY);
if (chRaw) {
  try { this.challenges.set(JSON.parse(chRaw)); } catch {}
}
const trigRaw = localStorage.getItem(this.TRIGGERS_KEY);
if (trigRaw) {
  try { this.triggers.set(JSON.parse(trigRaw)); } catch {}
}
const gRaw = localStorage.getItem(this.GROUPS_KEY);
if (gRaw) {
  try { this.groups.set(JSON.parse(gRaw)); } catch {}
}


this.loadSavedResources();


  if (stored.length) {
    // Si hay guardadas, reemplaza las de demo
    this.appointments.set(stored as unknown as Appointment[]);
  } else {
    // Si no hay, persiste las de ejemplo para que desde ya pasen por el servicio
    this.apptsSvc.save(this.appointments() as any);
  }
}

///////////

// ===== US15 =====
private buildReportCSV(period: '30d'|'all' = 'all'): string {
  const appts = this.appointments();
  const logsRaw = localStorage.getItem(this.BREATH_LOGS_KEY);
  const logs: Array<{ ts: number; durationSec: number; type: string }> = logsRaw ? JSON.parse(logsRaw) : [];

  const lines: string[] = [];
  lines.push('Section,Date,Time,Detail,Status/Duration');

  const now = Date.now();
  const cutoffTs = now - 30 * 24 * 60 * 60 * 1000; // 30 días
  const cutoffDate = new Date(cutoffTs).toISOString().slice(0,10);

  // Citas
  for (const a of appts) {
    if (period === '30d' && a.date < cutoffDate) continue;
    lines.push(`Appointment,${a.date},${a.time},"${a.psychologist}",${a.status}`);
  }

  // Respiración
  for (const l of logs) {
    if (period === '30d' && l.ts < cutoffTs) continue;
    const d = new Date(l.ts);
    const date = d.toISOString().slice(0, 10);
    const time = d.toTimeString().slice(0, 5);
    lines.push(`Breathing,${date},${time},"${l.type}",${l.durationSec}s`);
  }

  return lines.join('\n');
}

openShare() {
  this.shareEmail.set('');
  this.sharePeriod.set('30d');
  this.shareError.set('');
  this.shareLink.set(null);
  this.shareCopied.set(false);
  this.showShareModal.set(true);
}

closeShare() {
  this.showShareModal.set(false);
  this.shareLink.set(null);
  this.shareCopied.set(false);
}

confirmShare() {
  const email = this.shareEmail().trim();
  const period = this.sharePeriod();
  const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  if (!isEmail) {
    this.shareError.set('Ingresa un correo válido');
    return;
  }

  const csv = this.buildReportCSV(period);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  this.shareLink.set(url);
  this.shareError.set('');

  // Log de "envío"
  const raw = localStorage.getItem(this.SHARED_KEY);
  const arr: Array<{ts:number; email:string; period:string; filename:string}> = raw ? JSON.parse(raw) : [];
  arr.push({ ts: Date.now(), email, period, filename: 'mindora-progress.csv' });
  localStorage.setItem(this.SHARED_KEY, JSON.stringify(arr));
}

copyShareLink() {
  const link = this.shareLink();
  if (!link) return;
  navigator.clipboard?.writeText(link).then(() => {
    this.shareCopied.set(true);
    setTimeout(() => this.shareCopied.set(false), 1500);
  }).catch(() => {});
}
// ==========


downloadReport() {
  const appts = this.appointments();
  const logsRaw = localStorage.getItem(this.BREATH_LOGS_KEY);
  const logs: Array<{ ts: number; durationSec: number; type: string }> = logsRaw ? JSON.parse(logsRaw) : [];

  const lines: string[] = [];
  lines.push('Section,Date,Time,Detail,Status/Duration');

  
  // Citas
  for (const a of appts) {
    lines.push(`Appointment,${a.date},${a.time},"${a.psychologist}",${a.status}`);
  }

  // Respiración
  for (const l of logs) {
    const d = new Date(l.ts);
    const date = d.toISOString().slice(0, 10);
    const time = d.toTimeString().slice(0, 5);
    lines.push(`Breathing,${date},${time},"${l.type}",${l.durationSec}s`);
  }

  const csv = this.buildReportCSV('all');
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'mindora-progress.csv';
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

////////////
joinChallenge(id: number) {
  this.challenges.set(this.challenges().map(c => c.id === id ? { ...c, joined: true } : c));
  this.saveChallenges();
}

incrementChallenge(id: number) {
  this.challenges.set(
    this.challenges().map(c =>
      c.id === id ? { ...c, progress: Math.min(c.target, c.progress + 1) } : c
    )
  );
  this.saveChallenges();
}

resetChallenge(id: number) {
  this.challenges.set(
    this.challenges().map(c =>
      c.id === id ? { ...c, progress: 0, joined: false } : c
    )
  );
  this.saveChallenges();
}
////////////
joinGroup(id: number) {
  this.groups.set(
    this.groups().map(g => g.id === id ? { ...g, joined: true, members: g.members + 1 } : g)
  );
  this.saveGroups();
}

leaveGroup(id: number) {
  this.groups.set(
    this.groups().map(g => g.id === id ? { ...g, joined: false, members: Math.max(0, g.members - 1) } : g)
  );
  this.saveGroups();
}


openBooking(p: Psychologist) {
  this.selectedPsychologist = p;
  this.bookingDate.set('');
  this.bookingTime.set('');
  this.bookingError.set('');
  this.showBookingModal.set(true);
}


closeBooking() {
  this.showBookingModal.set(false);
  this.selectedPsychologist = null;
}

get minDate() {
  // yyyy-mm-dd
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

hasConflict(date: string, time: string, ignoreId?: number) {
  const when = `${date} ${time}`;
  return this.appointments().some(
    a => a.id !== (ignoreId ?? -1) &&
         `${a.date} ${a.time}` === when &&
         a.status !== 'cancelled'
  );
}

confirmBooking() {
  const date = this.bookingDate();
  const time = this.bookingTime();

  if (!this.selectedPsychologist || !date || !time) {
    this.bookingError.set('Selecciona fecha y hora.');
    return;
  }
  if (this.hasConflict(date, time)) {
    this.bookingError.set('Ya tienes una cita en ese horario.');
    return;
  }

  const newAppt: Appointment = {
    id: Date.now(),
    psychologist: this.selectedPsychologist.name,
    date,
    time,
    type: 'Videollamada',
    status: 'upcoming',
  };

  const list: Appointment[] = [...this.appointments(), newAppt];
  this.appointments.set(list);
  this.apptsSvc.save(list as any);   // <- persistimos con el servicio
  this.closeBooking();
}
///////////////////////




//queremos tener una lista simple de artículos/videos/guías en la pestaña Comunidad, con filtros
resources = signal<Resource[]>([
  { id: 1, title: 'Guía básica de respiración 4-4-4-4', category: 'guide', url: 'https://example.com/box-breathing' },
  { id: 2, title: 'Artículo: señales del burnout', category: 'article', url: 'https://example.com/burnout' },
  { id: 3, title: 'Video: postura y micro-pausas', category: 'video', url: 'https://example.com/posture' }
]);

selectedResourceFilter = signal<'all' | 'article' | 'video' | 'guide' | 'saved'>('all');

setResourceFilter(f: 'all' | 'article' | 'video' | 'guide' | 'saved') {
  this.selectedResourceFilter.set(f);
}

get filteredResources() {
  const f = this.selectedResourceFilter();
  let list = this.resources();

  if (f === 'saved') {
    list = list.filter(r => this.isResourceSaved(r.id));
  } else if (f !== 'all') {
    list = list.filter(r => r.category === f);
  }

  return list;
}
//////////////
  psychologists = signal<Psychologist[]>([
    {
      id: 1,
      name: 'Dra. María González',
      specialty: 'Estrés laboral',
      rating: 4.9,
      reviews: 127,
      price: 45,
      image: 'https://i.pravatar.cc/150?img=1',
      experience: 12,
      languages: ['Español', 'Inglés'],
      nextAvailable: 'Hoy, 3:00 PM',
      specialties: ['Estrés laboral', 'Ansiedad', 'Burnout'],
      about:
        'Especialista en manejo de estrés laboral con más de 12 años de experiencia ayudando a profesionales a encontrar equilibrio.',
    },
    {
      id: 2,
      name: 'Dr. Carlos Ruiz',
      specialty: 'Mindfulness',
      rating: 4.8,
      reviews: 98,
      price: 50,
      image: 'https://i.pravatar.cc/150?img=12',
      experience: 8,
      languages: ['Español'],
      nextAvailable: 'Mañana, 10:00 AM',
      specialties: ['Mindfulness', 'Meditación', 'Ansiedad'],
      about:
        'Practicante de mindfulness certificado, enfocado en técnicas de meditación y reducción de estrés.',
    },
    {
      id: 3,
      name: 'Dra. Ana Martínez',
      specialty: 'Burnout',
      rating: 5.0,
      reviews: 156,
      price: 55,
      image: 'https://i.pravatar.cc/150?img=5',
      experience: 15,
      languages: ['Español', 'Inglés', 'Francés'],
      nextAvailable: 'Hoy, 5:00 PM',
      specialties: ['Burnout', 'Estrés laboral', 'Resiliencia'],
      about:
        'Experta en prevención y recuperación de burnout, con enfoque en desarrollo de resiliencia.',
    },
  ]);

  forumTopics = signal<ForumTopic[]>([
    {
      id: 1,
      title: '¿Cómo manejan el estrés de las reuniones constantes?',
      category: 'workStress',
      author: 'Juan P.',
      replies: 23,
      views: 145,
      lastActivity: 'Hace 2 horas',
    },
    {
      id: 2,
      title: 'Mi rutina de respiración matutina que cambió todo',
      category: 'techniques',
      author: 'Laura M.',
      replies: 45,
      views: 312,
      lastActivity: 'Hace 5 horas',
    },
    {
      id: 3,
      title: 'Superé el burnout: mi historia',
      category: 'success',
      author: 'Roberto S.',
      replies: 67,
      views: 523,
      lastActivity: 'Hace 1 día',
    },
  ]);

  appointments = signal<Appointment[]>([
    {
      id: 1,
      psychologist: 'Dra. María González',
      date: '2025-10-10',
      time: '15:00',
      type: 'Videollamada',
      status: 'upcoming',
    },
    {
      id: 2,
      psychologist: 'Dr. Carlos Ruiz',
      date: '2025-09-28',
      time: '10:00',
      type: 'Videollamada',
      status: 'past',
    },
  ]);

  setActiveTab(tab: 'psychologists' | 'community' | 'appointments') {
    this.activeTab.set(tab);
  }

  setFilter(filter: string) {
    this.selectedFilter.set(filter);
  }

  get filteredPsychologists() {
    const filter = this.selectedFilter();
    const query = this.searchQuery().toLowerCase();

    return this.psychologists().filter((p) => {
      const matchesFilter =
        filter === 'all' ||
        p.specialties.some((s) => s.toLowerCase().includes(filter.toLowerCase()));
      const matchesSearch =
        query === '' ||
        p.name.toLowerCase().includes(query) ||
        p.specialty.toLowerCase().includes(query);

      return matchesFilter && matchesSearch;
    });
  }

  get upcomingAppointments() {
    return this.appointments().filter((a) => a.status === 'upcoming');
  }

  get pastAppointments() {
    return this.appointments().filter((a) => a.status === 'past');
  }
}
