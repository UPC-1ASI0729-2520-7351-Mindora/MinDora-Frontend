import { Component, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
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

interface ForumTopic {
  id: number;
  title: string;
  category: string;
  author: string;
  replies: number;
  views: number;
  lastActivity: string;
}

interface Appointment {
  id: number;
  psychologist: string;
  date: string;
  time: string;
  type: string;
  status: 'upcoming' | 'past' | 'cancelled';
}

@Component({
  selector: 'app-coaching',
  imports: [TranslateModule, CommonModule, FormsModule],
  templateUrl: './coaching.html',
  styleUrl: './coaching.css',
})
export class Coaching {
  activeTab = signal<'psychologists' | 'community' | 'appointments'>('psychologists');
  selectedFilter = signal('all');
  searchQuery = signal('');

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
