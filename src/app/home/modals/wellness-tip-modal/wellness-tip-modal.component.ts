import { Component, signal, computed, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TranslateModule } from '@ngx-translate/core';

interface WellnessTip {
  id: string;
  category: 'breathing' | 'stretching' | 'mindfulness' | 'hydration' | 'posture';
  title: string;
  description: string;
  icon: string;
  color: string;
  exercise: WellnessExercise;
}

interface WellnessExercise {
  type: 'breathing' | 'stretching' | 'timer' | 'checklist';
  duration: number; // seconds
  steps: ExerciseStep[];
}

interface ExerciseStep {
  instruction: string;
  duration: number; // seconds for this step
  image?: string;
}

@Component({
  selector: 'app-wellness-tip-modal',
  imports: [CommonModule, TranslateModule],
  templateUrl: './wellness-tip-modal.component.html',
  styleUrl: './wellness-tip-modal.component.css',
})
export class WellnessTipModalComponent {
  @Output() close = new EventEmitter<void>();

  // Available tips
  tips = signal<WellnessTip[]>([
    {
      id: 'breathing',
      category: 'breathing',
      title: 'wellnessTips.breathing.title',
      description: 'wellnessTips.breathing.description',
      icon: 'fa-wind',
      color: '#6f42c1',
      exercise: {
        type: 'breathing',
        duration: 60,
        steps: [
          { instruction: 'wellnessTips.breathing.step1', duration: 4 },
          { instruction: 'wellnessTips.breathing.step2', duration: 4 },
          { instruction: 'wellnessTips.breathing.step3', duration: 4 },
        ],
      },
    },
    {
      id: 'stretching',
      category: 'stretching',
      title: 'wellnessTips.stretching.title',
      description: 'wellnessTips.stretching.description',
      icon: 'fa-person-walking',
      color: '#198754',
      exercise: {
        type: 'stretching',
        duration: 120,
        steps: [
          { instruction: 'wellnessTips.stretching.step1', duration: 20 },
          { instruction: 'wellnessTips.stretching.step2', duration: 20 },
          { instruction: 'wellnessTips.stretching.step3', duration: 20 },
          { instruction: 'wellnessTips.stretching.step4', duration: 20 },
          { instruction: 'wellnessTips.stretching.step5', duration: 20 },
          { instruction: 'wellnessTips.stretching.step6', duration: 20 },
        ],
      },
    },
    {
      id: 'mindfulness',
      category: 'mindfulness',
      title: 'wellnessTips.mindfulness.title',
      description: 'wellnessTips.mindfulness.description',
      icon: 'fa-spa',
      color: '#0d6efd',
      exercise: {
        type: 'timer',
        duration: 300,
        steps: [
          { instruction: 'wellnessTips.mindfulness.step1', duration: 60 },
          { instruction: 'wellnessTips.mindfulness.step2', duration: 120 },
          { instruction: 'wellnessTips.mindfulness.step3', duration: 120 },
        ],
      },
    },
    {
      id: 'hydration',
      category: 'hydration',
      title: 'wellnessTips.hydration.title',
      description: 'wellnessTips.hydration.description',
      icon: 'fa-glass-water',
      color: '#0dcaf0',
      exercise: {
        type: 'checklist',
        duration: 0,
        steps: [
          { instruction: 'wellnessTips.hydration.step1', duration: 0 },
          { instruction: 'wellnessTips.hydration.step2', duration: 0 },
          { instruction: 'wellnessTips.hydration.step3', duration: 0 },
        ],
      },
    },
    {
      id: 'posture',
      category: 'posture',
      title: 'wellnessTips.posture.title',
      description: 'wellnessTips.posture.description',
      icon: 'fa-chair',
      color: '#fd7e14',
      exercise: {
        type: 'checklist',
        duration: 0,
        steps: [
          { instruction: 'wellnessTips.posture.step1', duration: 0 },
          { instruction: 'wellnessTips.posture.step2', duration: 0 },
          { instruction: 'wellnessTips.posture.step3', duration: 0 },
          { instruction: 'wellnessTips.posture.step4', duration: 0 },
        ],
      },
    },
  ]);

  selectedTip = signal<WellnessTip | null>(null);
  isExercising = signal(false);
  isPaused = signal(false);
  currentStepIndex = signal(0);
  secondsLeft = signal(0);
  completedSteps = signal<Set<number>>(new Set());

  private intervalId: any = null;

  currentStep = computed(() => {
    const tip = this.selectedTip();
    const index = this.currentStepIndex();
    if (!tip || index >= tip.exercise.steps.length) return null;
    return tip.exercise.steps[index];
  });

  progress = computed(() => {
    const tip = this.selectedTip();
    if (!tip) return 0;
    const totalSteps = tip.exercise.steps.length;
    const current = this.currentStepIndex();
    return (current / totalSteps) * 100;
  });

  selectTip(tip: WellnessTip) {
    this.selectedTip.set(tip);
    this.isExercising.set(false);
    this.currentStepIndex.set(0);
    this.completedSteps.set(new Set());
  }

  startExercise() {
    const tip = this.selectedTip();
    if (!tip) return;

    this.isExercising.set(true);
    this.isPaused.set(false);
    this.currentStepIndex.set(0);
    this.completedSteps.set(new Set());

    const firstStep = tip.exercise.steps[0];
    if (firstStep.duration > 0) {
      this.secondsLeft.set(firstStep.duration);
      this.runTimer();
    }
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
    this.isExercising.set(false);
    this.isPaused.set(false);
    this.currentStepIndex.set(0);
    this.secondsLeft.set(0);
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }

  nextStep() {
    const tip = this.selectedTip();
    if (!tip) return;

    const currentIndex = this.currentStepIndex();
    const newCompleted = new Set(this.completedSteps());
    newCompleted.add(currentIndex);
    this.completedSteps.set(newCompleted);

    if (currentIndex + 1 >= tip.exercise.steps.length) {
      this.completeExercise();
      return;
    }

    this.currentStepIndex.set(currentIndex + 1);
    const nextStep = tip.exercise.steps[currentIndex + 1];
    
    if (nextStep.duration > 0) {
      this.secondsLeft.set(nextStep.duration);
    }
  }

  toggleChecklistItem(index: number) {
    const completed = new Set(this.completedSteps());
    if (completed.has(index)) {
      completed.delete(index);
    } else {
      completed.add(index);
    }
    this.completedSteps.set(completed);

    // Check if all items are completed
    const tip = this.selectedTip();
    if (tip && completed.size === tip.exercise.steps.length) {
      this.completeExercise();
    }
  }

  isStepCompleted(index: number): boolean {
    return this.completedSteps().has(index);
  }

  private runTimer() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }

    this.intervalId = setInterval(() => {
      if (this.isPaused()) return;

      let seconds = this.secondsLeft();
      seconds--;
      this.secondsLeft.set(seconds);

      if (seconds <= 0) {
        this.nextStep();
      }
    }, 1000);
  }

  private completeExercise() {
    this.stop();
    this.saveLog();
    alert('¡Ejercicio completado! Excelente trabajo. 🎉');
  }

  private saveLog() {
    const tip = this.selectedTip();
    if (!tip) return;

    const logs = JSON.parse(localStorage.getItem('wellnessLogs') || '[]');
    logs.push({
      tipId: tip.id,
      category: tip.category,
      date: new Date().toISOString(),
    });
    localStorage.setItem('wellnessLogs', JSON.stringify(logs));
  }

  backToList() {
    this.stop();
    this.selectedTip.set(null);
  }

  closeModal() {
    this.stop();
    this.close.emit();
  }
}
