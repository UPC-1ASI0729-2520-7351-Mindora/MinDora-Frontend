import { Component, signal, computed, Output, EventEmitter, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

interface BreathingExercise {
  id: string;
  name: string;
  description: string;
  icon: string;
  pattern: number[]; // [inhale, hold1, exhale, hold2] in seconds
  cycles: number;
  color: string;
  benefits: string[];
}

type BreathPhase = 'inhale' | 'hold1' | 'exhale' | 'hold2';

@Component({
  selector: 'app-breathing-exercises-modal',
  imports: [CommonModule, TranslateModule],
  templateUrl: './breathing-exercises-modal.component.html',
  styleUrl: './breathing-exercises-modal.component.css',
})
export class BreathingExercisesModalComponent {
  @Output() close = new EventEmitter<void>();

  // Available exercises
  exercises = signal<BreathingExercise[]>([
    {
      id: 'box',
      name: 'breathingExercises.exercises.box.name',
      description: 'breathingExercises.exercises.box.description',
      icon: 'fa-square',
      pattern: [4, 4, 4, 4],
      cycles: 5,
      color: '#0d6efd',
      benefits: [
        'breathingExercises.exercises.box.benefit1',
        'breathingExercises.exercises.box.benefit2',
        'breathingExercises.exercises.box.benefit3',
      ],
    },
    {
      id: 'calm',
      name: 'breathingExercises.exercises.calm.name',
      description: 'breathingExercises.exercises.calm.description',
      icon: 'fa-moon',
      pattern: [4, 7, 8, 0],
      cycles: 4,
      color: '#6f42c1',
      benefits: [
        'breathingExercises.exercises.calm.benefit1',
        'breathingExercises.exercises.calm.benefit2',
        'breathingExercises.exercises.calm.benefit3',
      ],
    },
    {
      id: 'energize',
      name: 'breathingExercises.exercises.energize.name',
      description: 'breathingExercises.exercises.energize.description',
      icon: 'fa-bolt',
      pattern: [2, 0, 2, 0],
      cycles: 10,
      color: '#ffc107',
      benefits: [
        'breathingExercises.exercises.energize.benefit1',
        'breathingExercises.exercises.energize.benefit2',
        'breathingExercises.exercises.energize.benefit3',
      ],
    },
    {
      id: 'deep',
      name: 'breathingExercises.exercises.deep.name',
      description: 'breathingExercises.exercises.deep.description',
      icon: 'fa-spa',
      pattern: [5, 2, 5, 2],
      cycles: 6,
      color: '#198754',
      benefits: [
        'breathingExercises.exercises.deep.benefit1',
        'breathingExercises.exercises.deep.benefit2',
        'breathingExercises.exercises.deep.benefit3',
      ],
    },
  ]);

  // Exercise state
  selectedExercise = signal<BreathingExercise | null>(null);
  isRunning = signal(false);
  isPaused = signal(false);
  currentPhase = signal<BreathPhase>('inhale');
  currentCycle = signal(0);
  secondsLeft = signal(0);
  
  // Animation state
  breathScale = signal(1);
  
  private intervalId: any = null;

  // Computed properties
  progress = computed(() => {
    const exercise = this.selectedExercise();
    if (!exercise) return 0;
    const totalCycles = exercise.cycles;
    const current = this.currentCycle();
    return (current / totalCycles) * 100;
  });

  totalSeconds = computed(() => {
    const exercise = this.selectedExercise();
    if (!exercise) return 0;
    const cycleSeconds = exercise.pattern.reduce((a, b) => a + b, 0);
    return cycleSeconds * exercise.cycles;
  });

  elapsedSeconds = computed(() => {
    const exercise = this.selectedExercise();
    if (!exercise) return 0;
    const cycleSeconds = exercise.pattern.reduce((a, b) => a + b, 0);
    return (this.currentCycle() * cycleSeconds) + this.getPhaseElapsed();
  });

  // Animation effect
  constructor() {
    effect(() => {
      const phase = this.currentPhase();
      if (this.isRunning() && !this.isPaused()) {
        if (phase === 'inhale') {
          this.breathScale.set(1.5);
        } else if (phase === 'exhale') {
          this.breathScale.set(0.7);
        } else {
          // hold phases maintain current scale
        }
      }
    });
  }

  selectExercise(exercise: BreathingExercise) {
    this.stop();
    this.selectedExercise.set(exercise);
  }

  start() {
    const exercise = this.selectedExercise();
    if (!exercise) return;

    this.isRunning.set(true);
    this.isPaused.set(false);
    
    if (this.currentCycle() === 0) {
      this.currentCycle.set(1);
      this.currentPhase.set('inhale');
      this.secondsLeft.set(exercise.pattern[0]);
    }

    this.runTimer();
  }

  pause() {
    this.isPaused.set(true);
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  resume() {
    this.isPaused.set(false);
    this.runTimer();
  }

  stop() {
    this.isRunning.set(false);
    this.isPaused.set(false);
    this.currentCycle.set(0);
    this.currentPhase.set('inhale');
    this.secondsLeft.set(0);
    this.breathScale.set(1);
    
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  private runTimer() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    this.intervalId = setInterval(() => {
      if (this.isPaused()) return;

      const exercise = this.selectedExercise();
      if (!exercise) {
        this.stop();
        return;
      }

      let seconds = this.secondsLeft();
      seconds--;
      this.secondsLeft.set(seconds);

      if (seconds <= 0) {
        this.moveToNextPhase();
      }
    }, 1000);
  }

  private moveToNextPhase() {
    const exercise = this.selectedExercise();
    if (!exercise) return;

    const phase = this.currentPhase();
    const pattern = exercise.pattern;
    
    let nextPhase: BreathPhase;
    let nextSeconds: number;

    if (phase === 'inhale') {
      nextPhase = 'hold1';
      nextSeconds = pattern[1];
    } else if (phase === 'hold1') {
      nextPhase = 'exhale';
      nextSeconds = pattern[2];
    } else if (phase === 'exhale') {
      nextPhase = 'hold2';
      nextSeconds = pattern[3];
    } else {
      // Completed one cycle
      const currentCycleNum = this.currentCycle();
      if (currentCycleNum >= exercise.cycles) {
        // Exercise complete
        this.completeExercise();
        return;
      }
      
      this.currentCycle.set(currentCycleNum + 1);
      nextPhase = 'inhale';
      nextSeconds = pattern[0];
    }

    // Skip phases with 0 seconds
    if (nextSeconds === 0) {
      this.currentPhase.set(nextPhase);
      this.secondsLeft.set(0);
      this.moveToNextPhase();
      return;
    }

    this.currentPhase.set(nextPhase);
    this.secondsLeft.set(nextSeconds);
  }

  private completeExercise() {
    this.stop();
    this.saveLog();
    
    // Show completion message
    alert('¡Ejercicio completado! Excelente trabajo.');
  }

  private saveLog() {
    const exercise = this.selectedExercise();
    if (!exercise) return;

    const logs = JSON.parse(localStorage.getItem('breathLogs') || '[]');
    logs.push({
      exerciseId: exercise.id,
      exerciseName: exercise.name,
      date: new Date().toISOString(),
      cycles: exercise.cycles,
    });
    localStorage.setItem('breathLogs', JSON.stringify(logs));
  }

  private getPhaseElapsed(): number {
    const exercise = this.selectedExercise();
    if (!exercise) return 0;

    const phase = this.currentPhase();
    const pattern = exercise.pattern;
    const secondsLeft = this.secondsLeft();

    let phaseIndex = 0;
    if (phase === 'hold1') phaseIndex = 1;
    else if (phase === 'exhale') phaseIndex = 2;
    else if (phase === 'hold2') phaseIndex = 3;

    const phaseDuration = pattern[phaseIndex];
    return phaseDuration - secondsLeft;
  }

  getPhaseTranslationKey(): string {
    const phase = this.currentPhase();
    return `breathingExercises.phases.${phase}`;
  }

  closeModal() {
    this.stop();
    this.close.emit();
  }

  backToList() {
    this.stop();
    this.selectedExercise.set(null);
  }
}
