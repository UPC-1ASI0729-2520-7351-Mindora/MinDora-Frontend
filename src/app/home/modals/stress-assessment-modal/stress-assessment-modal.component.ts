import { Component, signal, computed, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TranslateModule } from '@ngx-translate/core';

export interface Question {
  id: string;
  category: 'work' | 'sleep' | 'physical' | 'emotional';
  question: string;
  options: QuestionOption[];
}

export interface QuestionOption {
  value: number; // 0-4 (0 = never, 4 = always)
  label: string;
}

export interface AssessmentResult {
  score: number; // 0-100
  level: 'low' | 'moderate' | 'high';
  recommendations: string[];
  timestamp: Date;
}

@Component({
  selector: 'app-stress-assessment-modal',
  standalone: true,
  imports: [CommonModule, FormsModule, TranslateModule],
  templateUrl: './stress-assessment-modal.component.html',
  styleUrl: './stress-assessment-modal.component.css',
})
export class StressAssessmentModalComponent {
  @Output() close = new EventEmitter<void>();
  @Output() completed = new EventEmitter<AssessmentResult>();

  // Current step (0-based index)
  currentStep = signal(0);

  // User answers (question id -> selected value)
  answers = signal<Map<string, number>>(new Map());

  // Assessment complete flag
  isComplete = signal(false);

  // Final result
  result = signal<AssessmentResult | null>(null);

  // Questions organized by category
  questions: Question[] = [
    // Work Stress (5 questions)
    {
      id: 'work_1',
      category: 'work',
      question: 'modals.stressAssessment.questions.work_1',
      options: this.getStandardOptions(),
    },
    {
      id: 'work_2',
      category: 'work',
      question: 'modals.stressAssessment.questions.work_2',
      options: this.getStandardOptions(),
    },
    {
      id: 'work_3',
      category: 'work',
      question: 'modals.stressAssessment.questions.work_3',
      options: this.getStandardOptions(),
    },
    {
      id: 'work_4',
      category: 'work',
      question: 'modals.stressAssessment.questions.work_4',
      options: this.getStandardOptions(),
    },
    {
      id: 'work_5',
      category: 'work',
      question: 'modals.stressAssessment.questions.work_5',
      options: this.getStandardOptions(),
    },
    // Sleep Quality (3 questions)
    {
      id: 'sleep_1',
      category: 'sleep',
      question: 'modals.stressAssessment.questions.sleep_1',
      options: this.getStandardOptions(),
    },
    {
      id: 'sleep_2',
      category: 'sleep',
      question: 'modals.stressAssessment.questions.sleep_2',
      options: this.getStandardOptions(),
    },
    {
      id: 'sleep_3',
      category: 'sleep',
      question: 'modals.stressAssessment.questions.sleep_3',
      options: this.getStandardOptions(),
    },
    // Physical Symptoms (4 questions)
    {
      id: 'physical_1',
      category: 'physical',
      question: 'modals.stressAssessment.questions.physical_1',
      options: this.getStandardOptions(),
    },
    {
      id: 'physical_2',
      category: 'physical',
      question: 'modals.stressAssessment.questions.physical_2',
      options: this.getStandardOptions(),
    },
    {
      id: 'physical_3',
      category: 'physical',
      question: 'modals.stressAssessment.questions.physical_3',
      options: this.getStandardOptions(),
    },
    {
      id: 'physical_4',
      category: 'physical',
      question: 'modals.stressAssessment.questions.physical_4',
      options: this.getStandardOptions(),
    },
    // Emotional State (3 questions)
    {
      id: 'emotional_1',
      category: 'emotional',
      question: 'modals.stressAssessment.questions.emotional_1',
      options: this.getStandardOptions(),
    },
    {
      id: 'emotional_2',
      category: 'emotional',
      question: 'modals.stressAssessment.questions.emotional_2',
      options: this.getStandardOptions(),
    },
    {
      id: 'emotional_3',
      category: 'emotional',
      question: 'modals.stressAssessment.questions.emotional_3',
      options: this.getStandardOptions(),
    },
  ];

  // Total number of questions
  totalQuestions = this.questions.length;

  // Current question
  currentQuestion = computed(() => this.questions[this.currentStep()]);

  // Progress percentage
  progress = computed(() => {
    if (this.isComplete()) return 100;
    return Math.round(((this.currentStep() + 1) / this.totalQuestions) * 100);
  });

  // Check if current question is answered
  isCurrentQuestionAnswered = computed(() => {
    const question = this.currentQuestion();
    return this.answers().has(question.id);
  });

  // Can go to next step
  canGoNext = computed(() => {
    return this.isCurrentQuestionAnswered() && this.currentStep() < this.totalQuestions - 1;
  });

  // Can go to previous step
  canGoPrevious = computed(() => {
    return this.currentStep() > 0 && !this.isComplete();
  });

  // Can submit assessment
  canSubmit = computed(() => {
    return (
      this.currentStep() === this.totalQuestions - 1 && this.isCurrentQuestionAnswered()
    );
  });

  private getStandardOptions(): QuestionOption[] {
    return [
      { value: 0, label: 'modals.stressAssessment.options.never' },
      { value: 1, label: 'modals.stressAssessment.options.rarely' },
      { value: 2, label: 'modals.stressAssessment.options.sometimes' },
      { value: 3, label: 'modals.stressAssessment.options.often' },
      { value: 4, label: 'modals.stressAssessment.options.always' },
    ];
  }

  selectAnswer(value: number): void {
    const question = this.currentQuestion();
    const newAnswers = new Map(this.answers());
    newAnswers.set(question.id, value);
    this.answers.set(newAnswers);
  }

  getSelectedAnswer(): number | undefined {
    const question = this.currentQuestion();
    return this.answers().get(question.id);
  }

  nextStep(): void {
    if (this.canGoNext()) {
      this.currentStep.update((step) => step + 1);
    }
  }

  previousStep(): void {
    if (this.canGoPrevious()) {
      this.currentStep.update((step) => step - 1);
    }
  }

  submitAssessment(): void {
    if (!this.canSubmit()) return;

    // Calculate total score
    const totalScore = Array.from(this.answers().values()).reduce(
      (sum, value) => sum + value,
      0
    );

    // Maximum possible score (15 questions * 4 points each = 60)
    const maxScore = this.totalQuestions * 4;

    // Convert to 0-100 scale
    const normalizedScore = Math.round((totalScore / maxScore) * 100);

    // Determine stress level
    let level: 'low' | 'moderate' | 'high';
    if (normalizedScore < 33) {
      level = 'low';
    } else if (normalizedScore < 67) {
      level = 'moderate';
    } else {
      level = 'high';
    }

    // Generate recommendations based on level
    const recommendations = this.generateRecommendations(level, normalizedScore);

    const assessmentResult: AssessmentResult = {
      score: normalizedScore,
      level,
      recommendations,
      timestamp: new Date(),
    };

    this.result.set(assessmentResult);
    this.isComplete.set(true);
  }

  private generateRecommendations(
    level: 'low' | 'moderate' | 'high',
    score: number
  ): string[] {
    const recommendations: string[] = [];

    if (level === 'low') {
      recommendations.push('modals.stressAssessment.recommendations.low_1');
      recommendations.push('modals.stressAssessment.recommendations.low_2');
      recommendations.push('modals.stressAssessment.recommendations.low_3');
    } else if (level === 'moderate') {
      recommendations.push('modals.stressAssessment.recommendations.moderate_1');
      recommendations.push('modals.stressAssessment.recommendations.moderate_2');
      recommendations.push('modals.stressAssessment.recommendations.moderate_3');
      recommendations.push('modals.stressAssessment.recommendations.moderate_4');
    } else {
      recommendations.push('modals.stressAssessment.recommendations.high_1');
      recommendations.push('modals.stressAssessment.recommendations.high_2');
      recommendations.push('modals.stressAssessment.recommendations.high_3');
      recommendations.push('modals.stressAssessment.recommendations.high_4');
    }

    return recommendations;
  }

  saveResults(): void {
    const resultData = this.result();
    if (resultData) {
      // Emit the result to parent component
      this.completed.emit(resultData);
      // Close modal
      this.closeModal();
    }
  }

  retakeAssessment(): void {
    this.currentStep.set(0);
    this.answers.set(new Map());
    this.isComplete.set(false);
    this.result.set(null);
  }

  closeModal(): void {
    this.close.emit();
  }

  getCategoryIcon(category: string): string {
    const icons: Record<string, string> = {
      work: 'fa-solid fa-briefcase',
      sleep: 'fa-solid fa-bed',
      physical: 'fa-solid fa-heart-pulse',
      emotional: 'fa-solid fa-brain',
    };
    return icons[category] || 'fa-solid fa-question';
  }

  getCategoryColor(category: string): string {
    const colors: Record<string, string> = {
      work: '#6366f1',
      sleep: '#8b5cf6',
      physical: '#ec4899',
      emotional: '#f59e0b',
    };
    return colors[category] || '#6b7280';
  }
}

