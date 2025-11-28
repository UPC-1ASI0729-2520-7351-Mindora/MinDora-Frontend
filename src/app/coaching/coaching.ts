import { Component, signal, computed, OnInit } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { AppointmentsService, StoredAppointment } from './appointments.service';
import { Appointment as BackendAppointment } from '../services/appointments-http.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CreateAppointmentModalComponent, AppointmentData } from '../home/modals/create-appointment-modal/create-appointment-modal.component';
import { VideoCallModalComponent } from '../shared/video-call-modal/video-call-modal.component';


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

interface ForumPost {
  id: number;
  author: string;
  content: string;
  timestamp: string;
  likes: number;
}

interface Event {
  id: number;
  title: string;
  date: string;
  time: string;
  description: string;
  registered: boolean;
  capacity: number;
  enrolled: number;
}

interface ChatMessage {
  id: number;
  author: string;
  message: string;
  timestamp: string;
  isOwnMessage: boolean;
}
type ApptStatus = Appointment['status'];
const CANCELLED: ApptStatus = 'cancelled';

interface Appointment {
  id: number | string;  // Puede ser número o UUID string
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

interface WellnessTip {
  id: number;
  icon: string;
  title: string;
  content: string;
  category: string;
}

@Component({
  selector: 'app-coaching',
  imports: [TranslateModule, CommonModule, FormsModule, CreateAppointmentModalComponent, VideoCallModalComponent],
  templateUrl: './coaching.html',
  styleUrl: './coaching.css',
})





export class Coaching implements OnInit {
  constructor(private apptsSvc: AppointmentsService) {}
  activeTab = signal<'psychologists' | 'community' | 'appointments'>('psychologists');
  selectedFilter = signal('all');
  searchQuery = signal('');

  // Wellness Tips
  private wellnessTips = signal<WellnessTip[]>([
    {
      id: 1,
      icon: 'fa-spa',
      title: 'coaching.community.tips.list.mindfulness.title',
      content: 'coaching.community.tips.list.mindfulness.content',
      category: 'coaching.community.tips.categories.mindfulness'
    },
    {
      id: 2,
      icon: 'fa-person-walking',
      title: 'coaching.community.tips.list.movement.title',
      content: 'coaching.community.tips.list.movement.content',
      category: 'coaching.community.tips.categories.physical'
    },
    {
      id: 3,
      icon: 'fa-moon',
      title: 'coaching.community.tips.list.sleep.title',
      content: 'coaching.community.tips.list.sleep.content',
      category: 'coaching.community.tips.categories.sleep'
    },
    {
      id: 4,
      icon: 'fa-utensils',
      title: 'coaching.community.tips.list.nutrition.title',
      content: 'coaching.community.tips.list.nutrition.content',
      category: 'coaching.community.tips.categories.nutrition'
    },
    {
      id: 5,
      icon: 'fa-users',
      title: 'coaching.community.tips.list.social.title',
      content: 'coaching.community.tips.list.social.content',
      category: 'coaching.community.tips.categories.social'
    },
    {
      id: 6,
      icon: 'fa-water',
      title: 'coaching.community.tips.list.hydration.title',
      content: 'coaching.community.tips.list.hydration.content',
      category: 'coaching.community.tips.categories.physical'
    }
  ]);
  
  currentTipIndex = signal(0);
  currentTip = signal(this.wellnessTips()[0]);


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

// ===== Video Call Methods =====
joinVideoCall(appointment: Appointment) {
  const storedAppt: StoredAppointment = {
    id: appointment.id as any,  // Convertir a any para compatibilidad con StoredAppointment
    psychologist: appointment.psychologist,
    date: appointment.date,
    time: appointment.time,
    type: appointment.type,
    status: appointment.status as ApptStatus,
  };
  this.selectedAppointmentForCall.set(storedAppt);
  this.showVideoCallModal.set(true);
}

closeVideoCall() {
  this.showVideoCallModal.set(false);
  this.selectedAppointmentForCall.set(null);
}
// ===== fin Video Call =====

// ===== Event Methods =====
registerForEvent(eventId: number) {
  this.events.update(events => 
    events.map(e => e.id === eventId 
      ? { ...e, registered: true, enrolled: e.enrolled + 1 } 
      : e
    )
  );
}

unregisterFromEvent(eventId: number) {
  this.events.update(events => 
    events.map(e => e.id === eventId 
      ? { ...e, registered: false, enrolled: Math.max(0, e.enrolled - 1) } 
      : e
    )
  );
}

// ===== Forum Methods =====
openForumTopic(topic: ForumTopic) {
  this.selectedForumTopic.set(topic);
  // Simular posts del tema
  const mockPosts: ForumPost[] = [
    {
      id: 1,
      author: topic.author,
      content: 'Contenido inicial del tema... Me gustaría saber su opinión sobre este tema importante.',
      timestamp: 'Hace 2 días',
      likes: 12
    },
    {
      id: 2,
      author: 'Usuario123',
      content: 'Excelente tema, yo también paso por lo mismo. Lo que me ha ayudado es...',
      timestamp: 'Hace 1 día',
      likes: 8
    },
    {
      id: 3,
      author: 'MindfulPerson',
      content: 'Gracias por compartir. En mi experiencia, establecer límites claros es fundamental.',
      timestamp: 'Hace 12 horas',
      likes: 15
    }
  ];
  this.forumPosts.set(mockPosts);
  this.showForumTopicModal.set(true);
}

closeForumTopic() {
  this.showForumTopicModal.set(false);
  this.selectedForumTopic.set(null);
  this.newForumReply.set('');
}

openCreateTopic() {
  this.showCreateTopicModal.set(true);
}

closeCreateTopic() {
  this.showCreateTopicModal.set(false);
  this.newTopicTitle.set('');
  this.newTopicCategory.set('general');
  this.newTopicContent.set('');
}

createForumTopic() {
  if (!this.newTopicTitle().trim() || !this.newTopicContent().trim()) return;
  
  const newTopic: ForumTopic = {
    id: this.forumTopics().length + 1,
    title: this.newTopicTitle(),
    category: this.newTopicCategory(),
    author: 'Tú',
    replies: 0,
    views: 0,
    lastActivity: 'Ahora'
  };
  
  this.forumTopics.update(topics => [newTopic, ...topics]);
  this.closeCreateTopic();
}

deleteForumTopic(topicId: number) {
  if (!confirm('¿Estás seguro de que quieres eliminar este tema?')) return;
  
  this.forumTopics.update(topics => topics.filter(t => t.id !== topicId));
  this.closeForumTopic();
}

postForumReply() {
  if (!this.newForumReply().trim()) return;
  
  const newPost: ForumPost = {
    id: this.forumPosts().length + 1,
    author: 'Tú',
    content: this.newForumReply(),
    timestamp: 'Ahora',
    likes: 0
  };
  
  this.forumPosts.update(posts => [...posts, newPost]);
  this.newForumReply.set('');
  
  // Incrementar replies en el tema
  const topic = this.selectedForumTopic();
  if (topic) {
    this.forumTopics.update(topics => 
      topics.map(t => t.id === topic.id 
        ? { ...t, replies: t.replies + 1, lastActivity: 'Ahora' } 
        : t
      )
    );
  }
}

deleteForumPost(postId: number) {
  if (!confirm('¿Estás seguro de que quieres eliminar esta respuesta?')) return;
  
  this.forumPosts.update(posts => posts.filter(p => p.id !== postId));
  
  // Decrementar replies en el tema
  const topic = this.selectedForumTopic();
  if (topic) {
    this.forumTopics.update(topics => 
      topics.map(t => t.id === topic.id 
        ? { ...t, replies: Math.max(0, t.replies - 1) } 
        : t
      )
    );
  }
}

// ===== Chat Methods =====
openChat() {
  this.showChatModal.set(true);
}

closeChat() {
  this.showChatModal.set(false);
}

sendChatMessage() {
  if (!this.newChatMessage().trim()) return;
  
  const newMessage: ChatMessage = {
    id: this.chatMessages().length + 1,
    author: 'Tú',
    message: this.newChatMessage(),
    timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
    isOwnMessage: true
  };
  
  this.chatMessages.update(messages => [...messages, newMessage]);
  this.newChatMessage.set('');
  
  // Simular respuesta automática después de 2-5 segundos
  setTimeout(() => {
    const responses = [
      '¡Gracias por compartir!',
      'Estoy de acuerdo contigo.',
      'Muy buen punto.',
      '¿Alguien más ha probado esto?',
      'Interesante perspectiva.'
    ];
    const randomResponse = responses[Math.floor(Math.random() * responses.length)];
    const botMessage: ChatMessage = {
      id: this.chatMessages().length + 1,
      author: 'Usuario' + Math.floor(Math.random() * 100),
      message: randomResponse,
      timestamp: new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' }),
      isOwnMessage: false
    };
    this.chatMessages.update(messages => [...messages, botMessage]);
  }, 2000 + Math.random() * 3000);
}
// ===== fin Chat Methods =====

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

  // Eliminar del backend usando DELETE
  this.apptsSvc.httpService.deleteAppointment(appt.id).subscribe({
    next: () => {
      console.log('✅ Cita eliminada del backend');
      
      // Recargar todas las citas desde el backend
      this.loadAppointments();
      this.closeCancel();
    },
    error: (error: any) => {
      console.error('❌ Error al eliminar cita:', error);
      alert('Error al cancelar la cita. Por favor intenta nuevamente.');
    }
  });
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




  // Modal completo de crear cita (igual que en Home)
  showCreateAppointmentModal = signal(false);
  selectedPsychologistForBooking: Psychologist | null = null;

  // Mantener el modal simple para compatibilidad (ahora oculto)
  showBookingModal = signal(false);
  bookingDate = signal<string>('');
  bookingTime = signal<string>('');
  bookingError = signal<string>('');
  selectedPsychologist: Psychologist | null = null;

  // ===== US09: Reprogramar / Cancelar cita =====
  showCancelModal = signal(false);
  showRescheduleModal = signal(false);
  apptToEdit = signal<Appointment | null>(null);

  rescheduleDate = signal<string>(''); // yyyy-mm-dd
  rescheduleTime = signal<string>(''); // HH:mm
  rescheduleError = signal<string>('');
  // ===== fin US09 =====

  // ===== Video Call Modal =====
  showVideoCallModal = signal(false);
  selectedAppointmentForCall = signal<StoredAppointment | null>(null);
  
  // Events
  events = signal<Event[]>([
    {
      id: 1,
      title: 'Taller: Manejo de Estrés Laboral',
      date: '2025-12-15',
      time: '18:00',
      description: 'Aprende técnicas efectivas para manejar el estrés en el trabajo y mejorar tu bienestar.',
      registered: false,
      capacity: 30,
      enrolled: 18
    },
    {
      id: 2,
      title: 'Sesión de Mindfulness Grupal',
      date: '2025-12-18',
      time: '19:00',
      description: 'Practica mindfulness en grupo y conecta con otros en el camino del bienestar.',
      registered: false,
      capacity: 25,
      enrolled: 12
    },
    {
      id: 3,
      title: 'Webinar: Prevención del Burnout',
      date: '2025-12-20',
      time: '17:00',
      description: 'Identifica las señales tempranas del burnout y aprende a prevenirlo.',
      registered: false,
      capacity: 50,
      enrolled: 35
    }
  ]);
  
  // Forum
  showForumTopicModal = signal(false);
  showCreateTopicModal = signal(false);
  selectedForumTopic = signal<ForumTopic | null>(null);
  forumPosts = signal<ForumPost[]>([]);
  newTopicTitle = signal('');
  newTopicCategory = signal('general');
  newTopicContent = signal('');
  newForumReply = signal('');
  
  // Chat
  showChatModal = signal(false);
  chatMessages = signal<ChatMessage[]>([
    { id: 1, author: 'Laura M.', message: '¡Hola a todos! ¿Cómo están hoy?', timestamp: '10:30 AM', isOwnMessage: false },
    { id: 2, author: 'Juan P.', message: 'Muy bien, gracias. Acabo de hacer mi ejercicio de respiración matutino.', timestamp: '10:32 AM', isOwnMessage: false },
    { id: 3, author: 'Ana S.', message: 'Yo también, me siento mucho más calmada ahora.', timestamp: '10:35 AM', isOwnMessage: false }
  ]);
  newChatMessage = signal('');
  chatUsersOnline = signal(24);
  // ===== fin Video Call =====

  // ===== US15 =====
  showShareModal = signal(false);
  shareEmail = signal<string>('');
  sharePeriod = signal<'30d'|'all'>('30d');
  shareError = signal<string>('');
  shareLink = signal<string | null>(null);
  shareCopied = signal(false);
  private SHARED_KEY = 'mindora_shared_reports';
  // ==========

openBooking(p: Psychologist) {
  // Abrir el modal completo de crear cita
  this.selectedPsychologistForBooking = p;
  this.showCreateAppointmentModal.set(true);
}

// Método para cerrar el modal completo
onAppointmentModalClose() {
  this.showCreateAppointmentModal.set(false);
  this.selectedPsychologistForBooking = null;
}

// Mapear tipo de cita del backend al local
mapTypeToLocal(backendType: string): string {
  const typeMap: {[key: string]: string} = {
    'video': 'Videollamada',
    'phone': 'Teléfono',
    'in-person': 'Presencial'
  };
  return typeMap[backendType] || backendType;
}

// Mapear tipo de cita del local al backend
mapTypeToBackend(localType: string): 'video' | 'phone' | 'in-person' {
  const typeMap: {[key: string]: 'video' | 'phone' | 'in-person'} = {
    'Videollamada': 'video',
    'video': 'video',
    'Teléfono': 'phone',
    'phone': 'phone',
    'Presencial': 'in-person',
    'in-person': 'in-person'
  };
  return typeMap[localType] || 'video';
}

// Método cuando se crea una cita desde el modal
onAppointmentCreated(appointmentData: AppointmentData) {
  console.log('Cita creada desde coaching:', appointmentData);
  
  // Crear el appointment para enviar al backend
  const backendAppointment = {
    psychologistId: appointmentData.psychologistId,
    psychologistName: appointmentData.psychologistName,
    employeeId: 1, // TODO: Obtener del usuario autenticado
    date: appointmentData.date,
    time: appointmentData.time,
    type: appointmentData.type,
    reason: appointmentData.reason,
    notes: appointmentData.notes || '',
    status: 'upcoming' as const
  };
  
  // Guardar en el backend
  this.apptsSvc.httpService.createAppointment(backendAppointment).subscribe({
    next: (created: BackendAppointment) => {
      console.log('✅ Cita creada con ID:', created.id);
      
      // Recargar todas las citas
      this.loadAppointments();
      
      // Cambiar a la pestaña de citas
      this.setActiveTab('appointments');
    },
    error: (error: any) => {
      console.error('❌ Error al guardar cita:', error);
      alert('Error al guardar la cita. Por favor intenta nuevamente.');
    }
  });
  
  // Cerrar modal
  this.showCreateAppointmentModal.set(false);
  this.selectedPsychologistForBooking = null;
}

// ===== US06: Ver perfil del psicólogo =====
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

ngOnInit() {
  console.log('🚀 ngOnInit - Iniciando carga de citas...');
  this.loadAppointments();
}

// Método para cargar citas desde el backend
loadAppointments() {
  console.log('🔍 [loadAppointments] Iniciando carga...');
  
  this.apptsSvc.httpService.getAllAppointments().subscribe({
    next: (backendAppointments: BackendAppointment[]) => {
      console.log('📥 [loadAppointments] Respuesta del backend:');
      console.log('   - Total de citas:', backendAppointments.length);
      console.log('   - Datos crudos:', JSON.stringify(backendAppointments, null, 2));
      
      // Mapear al formato local con validación
      const mapped = backendAppointments.map((appt, index) => {
        // Normalizar el ID (puede venir como objeto o número)
        const appointmentId = typeof appt.id === 'object' && appt.id && 'value' in appt.id 
          ? (appt.id as any).value 
          : appt.id || 0;
        
        // Mapear status: SCHEDULED/CONFIRMED -> upcoming, CANCELLED/COMPLETED -> past/cancelled
        let mappedStatus: 'upcoming' | 'past' | 'cancelled' = 'upcoming';
        const backendStatus = appt.status?.toUpperCase();
        
        if (backendStatus === 'SCHEDULED' || backendStatus === 'CONFIRMED' || backendStatus === 'UPCOMING') {
          mappedStatus = 'upcoming';
        } else if (backendStatus === 'CANCELLED') {
          mappedStatus = 'cancelled';
        } else if (backendStatus === 'COMPLETED' || backendStatus === 'PAST') {
          mappedStatus = 'past';
        }
        
        const localAppt = {
          id: appointmentId,
          psychologist: appt.psychologistName,
          date: appt.date,
          time: appt.time,
          type: this.mapTypeToLocal(appt.type),
          status: mappedStatus
        };
        console.log(`   - Cita ${index + 1}:`, localAppt);
        return localAppt;
      });
      
      console.log('✅ [loadAppointments] Actualizando signal con', mapped.length, 'citas');
      this.appointments.set(mapped);
      
      // Verificación inmediata
      console.log('📊 [loadAppointments] Signal actualizado:');
      console.log('   - appointments().length:', this.appointments().length);
      console.log('   - appointments() contenido:', this.appointments());
      console.log('   - upcomingAppointments:', this.upcomingAppointments);
      console.log('   - upcomingAppointments.length:', this.upcomingAppointments.length);
      
      // Forzar actualización del DOM
      setTimeout(() => {
        console.log('⏰ [loadAppointments] Verificación después de 100ms:');
        console.log('   - appointments().length:', this.appointments().length);
        console.log('   - upcomingAppointments.length:', this.upcomingAppointments.length);
      }, 100);
    },
    error: (error: any) => {
      console.error('⚠️ Error al cargar citas desde backend:', error);
      this.appointments.set([]);
    }
  });
  
  // Cargar otros datos desde localStorage
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
}

// ===== US15: Compartir reporte =====
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

downloadReport() {
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
// ==========

// Challenges
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

// Groups
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

// Métodos del modal simple antiguo (mantener por compatibilidad)

closeBooking() {
  this.showBookingModal.set(false);
  this.selectedPsychologist = null;
}

get minDate() {
  // yyyy-mm-dd
  const d = new Date();
  return d.toISOString().slice(0, 10);
}

hasConflict(date: string, time: string, ignoreId?: number | string) {
  const when = `${date} ${time}`;
  return this.appointments().some(
    a => a.id !== ignoreId &&
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
    {
      id: 4,
      name: 'Dr. Luis Fernández',
      specialty: 'Relaciones',
      rating: 4.7,
      reviews: 89,
      price: 48,
      image: 'https://i.pravatar.cc/150?img=13',
      experience: 10,
      languages: ['Español', 'Inglés'],
      nextAvailable: 'Mañana, 2:00 PM',
      specialties: ['Relaciones', 'Comunicación', 'Conflictos interpersonales'],
      about:
        'Especialista en terapia de relaciones y comunicación efectiva, ayudando a mejorar vínculos personales y profesionales.',
    },
    {
      id: 5,
      name: 'Dra. Sofía López',
      specialty: 'Equilibrio vida-trabajo',
      rating: 4.9,
      reviews: 134,
      price: 52,
      image: 'https://i.pravatar.cc/150?img=9',
      experience: 11,
      languages: ['Español', 'Inglés'],
      nextAvailable: 'Hoy, 4:30 PM',
      specialties: ['Equilibrio vida-trabajo', 'Gestión del tiempo', 'Bienestar integral'],
      about:
        'Experta en equilibrio entre vida personal y profesional, enfocada en estrategias de gestión del tiempo y bienestar.',
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

  // Appointments se cargarán desde el backend en ngOnInit
  appointments = signal<Appointment[]>([]);

  setActiveTab(tab: 'psychologists' | 'community' | 'appointments') {
    this.activeTab.set(tab);
  }

  setFilter(filter: string) {
    this.selectedFilter.set(filter);
  }

  get filteredPsychologists() {
    const filter = this.selectedFilter();
    const query = this.searchQuery().toLowerCase();

    // Mapeo de filtros a términos de búsqueda en especialidades
    const filterMap: Record<string, string[]> = {
      'all': [],
      'workStress': ['estrés laboral', 'burnout', 'estrés'],
      'anxiety': ['ansiedad']
    };

    return this.psychologists().filter((p) => {
      let matchesFilter = false;
      
      if (filter === 'all') {
        matchesFilter = true;
      } else {
        const searchTerms = filterMap[filter] || [];
        matchesFilter = p.specialties.some((s) => 
          searchTerms.some(term => s.toLowerCase().includes(term))
        );
      }

      const matchesSearch =
        query === '' ||
        p.name.toLowerCase().includes(query) ||
        p.specialty.toLowerCase().includes(query) ||
        p.specialties.some(s => s.toLowerCase().includes(query));

      return matchesFilter && matchesSearch;
    });
  }

  get upcomingAppointments() {
    const upcoming = this.appointments().filter((a) => a.status === 'upcoming');
    console.log('🔄 [getter upcomingAppointments]:', upcoming.length, 'citas');
    return upcoming;
  }

  get pastAppointments() {
    const past = this.appointments().filter((a) => a.status === 'past');
    console.log('📅 [getter pastAppointments]:', past.length, 'citas');
    return past;
  }

  getPsychologistImage(name: string): string {
    const psychologist = this.psychologists().find(p => p.name === name);
    return psychologist?.image || 'https://i.pravatar.cc/150?img=0';
  }

  getPsychologistInfo(name: string) {
    return this.psychologists().find(p => p.name === name);
  }

  // Wellness Tips Methods
  refreshTip() {
    const tips = this.wellnessTips();
    let newIndex = (this.currentTipIndex() + 1) % tips.length;
    this.currentTipIndex.set(newIndex);
    this.currentTip.set(tips[newIndex]);
  }

  joinedGroupsCount(): number {
    return this.groups().filter(g => g.joined).length;
  }
}
