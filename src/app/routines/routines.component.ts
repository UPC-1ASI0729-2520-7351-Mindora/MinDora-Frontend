import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule, TranslateService } from '@ngx-translate/core';
import { FormsModule } from '@angular/forms';

interface Routine {
  id: number;
  titleKey: string;
  descriptionKey: string;
  duration: string;
  difficulty: 'easy' | 'medium' | 'hard';
  category: 'morning' | 'work' | 'evening' | 'anytime';
  icon: string;
  stepsKey: string;
  benefitsKey: string;
  completed?: boolean;
}

interface DailyProgress {
  date: string;
  completedRoutines: number[];
  totalMinutes: number;
}

@Component({
  selector: 'app-routines',
  standalone: true,
  imports: [CommonModule, TranslateModule, FormsModule],
  templateUrl: './routines.component.html',
  styleUrl: './routines.component.css',
})
export class RoutinesComponent {
  private PROGRESS_KEY = 'mindora_routines_progress';
  private translateService = inject(TranslateService);
  
  selectedCategory = signal<string>('all');
  selectedRoutine = signal<Routine | null>(null);
  showRoutineDetail = signal(false);
  showCongratulations = signal(false);
  dailyProgress = signal<DailyProgress>(this.loadTodayProgress());

  routines = signal<Routine[]>([
    {
      id: 1,
      titleKey: 'routines.list.breathing.title',
      descriptionKey: 'routines.list.breathing.description',
      duration: '5 min',
      difficulty: 'easy',
      category: 'morning',
      icon: 'fa-sun',
      stepsKey: 'routines.list.breathing.steps',
      benefitsKey: 'routines.list.breathing.benefits'
    },
    {
      id: 2,
      titleKey: 'routines.list.stretching.title',
      descriptionKey: 'routines.list.stretching.description',
      duration: '10 min',
      difficulty: 'easy',
      category: 'work',
      icon: 'fa-briefcase',
      stepsKey: 'routines.list.stretching.steps',
      benefitsKey: 'routines.list.stretching.benefits'
    },
    {
      id: 3,
      titleKey: 'routines.list.meditation.title',
      descriptionKey: 'routines.list.meditation.description',
      duration: '15 min',
      difficulty: 'medium',
      category: 'anytime',
      icon: 'fa-spa',
      stepsKey: 'routines.list.meditation.steps',
      benefitsKey: 'routines.list.meditation.benefits'
    },
    {
      id: 4,
      titleKey: 'routines.list.walking.title',
      descriptionKey: 'routines.list.walking.description',
      duration: '20 min',
      difficulty: 'easy',
      category: 'anytime',
      icon: 'fa-walking',
      stepsKey: 'routines.list.walking.steps',
      benefitsKey: 'routines.list.walking.benefits'
    },
    {
      id: 5,
      titleKey: 'routines.list.visualRest.title',
      descriptionKey: 'routines.list.visualRest.description',
      duration: '3 min',
      difficulty: 'easy',
      category: 'work',
      icon: 'fa-eye',
      stepsKey: 'routines.list.visualRest.steps',
      benefitsKey: 'routines.list.visualRest.benefits'
    },
    {
      id: 6,
      titleKey: 'routines.list.gratitude.title',
      descriptionKey: 'routines.list.gratitude.description',
      duration: '5 min',
      difficulty: 'easy',
      category: 'evening',
      icon: 'fa-moon',
      stepsKey: 'routines.list.gratitude.steps',
      benefitsKey: 'routines.list.gratitude.benefits'
    },
    {
      id: 7,
      titleKey: 'routines.list.muscleRelaxation.title',
      descriptionKey: 'routines.list.muscleRelaxation.description',
      duration: '12 min',
      difficulty: 'medium',
      category: 'evening',
      icon: 'fa-bed',
      stepsKey: 'routines.list.muscleRelaxation.steps',
      benefitsKey: 'routines.list.muscleRelaxation.benefits'
    },
    {
      id: 8,
      titleKey: 'routines.list.mindfulCoffee.title',
      descriptionKey: 'routines.list.mindfulCoffee.description',
      duration: '5 min',
      difficulty: 'easy',
      category: 'work',
      icon: 'fa-coffee',
      stepsKey: 'routines.list.mindfulCoffee.steps',
      benefitsKey: 'routines.list.mindfulCoffee.benefits'
    }
  ]);

  ngOnInit() {
    this.loadTodayProgress();
  }

  get filteredRoutines() {
    const category = this.selectedCategory();
    if (category === 'all') {
      return this.routines();
    }
    return this.routines().filter(r => r.category === category);
  }

  setCategory(category: string) {
    this.selectedCategory.set(category);
  }

  openRoutineDetail(routine: Routine) {
    this.selectedRoutine.set(routine);
    this.showRoutineDetail.set(true);
  }

  closeRoutineDetail() {
    this.showRoutineDetail.set(false);
    this.selectedRoutine.set(null);
  }

  markAsCompleted(routineId: number) {
    const progress = this.dailyProgress();
    if (!progress.completedRoutines.includes(routineId)) {
      progress.completedRoutines.push(routineId);
      
      const routine = this.routines().find(r => r.id === routineId);
      if (routine) {
        const minutes = parseInt(routine.duration);
        progress.totalMinutes += minutes;
      }
      
      this.dailyProgress.set({...progress});
      this.saveProgress(progress);
      
      // Check if all routines are completed
      if (progress.completedRoutines.length === this.routines().length) {
        setTimeout(() => {
          this.showCongratulations.set(true);
        }, 500);
      }
    }
    
    this.closeRoutineDetail();
  }

  cancelCompletion(routineId: number) {
    const progress = this.dailyProgress();
    const index = progress.completedRoutines.indexOf(routineId);
    
    if (index > -1) {
      progress.completedRoutines.splice(index, 1);
      
      const routine = this.routines().find(r => r.id === routineId);
      if (routine) {
        const minutes = parseInt(routine.duration);
        progress.totalMinutes -= minutes;
      }
      
      this.dailyProgress.set({...progress});
      this.saveProgress(progress);
    }
  }

  isCompleted(routineId: number): boolean {
    return this.dailyProgress().completedRoutines.includes(routineId);
  }

  getDifficultyColor(difficulty: string): string {
    const colors: Record<string, string> = {
      easy: '#10b981',
      medium: '#f59e0b',
      hard: '#ef4444'
    };
    return colors[difficulty] || '#6b7280';
  }

  getCategoryLabel(category: string): string {
    const labels: Record<string, string> = {
      morning: 'Mañana',
      work: 'Trabajo',
      evening: 'Noche',
      anytime: 'Cualquier momento'
    };
    return labels[category] || category;
  }

  private loadTodayProgress(): DailyProgress {
    const today = new Date().toISOString().split('T')[0];
    const raw = localStorage.getItem(this.PROGRESS_KEY);
    
    if (raw) {
      try {
        const allProgress = JSON.parse(raw);
        const todayProgress = allProgress[today];
        
        if (todayProgress) {
          return todayProgress;
        }
      } catch (e) {
        console.error('Error loading progress:', e);
      }
    }
    
    return {
      date: today,
      completedRoutines: [],
      totalMinutes: 0
    };
  }

  private saveProgress(progress: DailyProgress) {
    const raw = localStorage.getItem(this.PROGRESS_KEY);
    let allProgress: Record<string, DailyProgress> = {};
    
    if (raw) {
      try {
        allProgress = JSON.parse(raw);
      } catch (e) {
        console.error('Error parsing progress:', e);
      }
    }
    
    allProgress[progress.date] = progress;
    localStorage.setItem(this.PROGRESS_KEY, JSON.stringify(allProgress));
  }

  get completionPercentage(): number {
    const total = this.routines().length;
    const completed = this.dailyProgress().completedRoutines.length;
    return Math.round((completed / total) * 100);
  }

  closeCongratulations() {
    this.showCongratulations.set(false);
  }

  resetAllRoutines() {
    const today = new Date().toISOString().split('T')[0];
    const newProgress: DailyProgress = {
      date: today,
      completedRoutines: [],
      totalMinutes: 0
    };
    
    this.dailyProgress.set(newProgress);
    this.saveProgress(newProgress);
    this.showCongratulations.set(false);
  }
}
