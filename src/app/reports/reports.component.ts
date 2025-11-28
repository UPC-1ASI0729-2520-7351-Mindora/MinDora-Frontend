import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TranslateModule } from '@ngx-translate/core';
import { ReportsService, Report } from '../services/reports.service';

@Component({
  selector: 'app-reports',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TranslateModule],
  templateUrl: './reports.component.html',
  styleUrl: './reports.component.css',
})
export class ReportsComponent implements OnInit {
  reports = signal<Report[]>([]);
  showCreateModal = signal(false);
  showViewModal = signal(false);
  selectedReport = signal<Report | null>(null);
  reportForm!: FormGroup;
  filterType = signal<string>('all');
  searchTerm = signal<string>('');
  isLoading = signal(false);
  errorMessage = signal<string>('');

  reportTypes = [
    { value: 'daily', label: 'reports.types.daily', icon: 'fa-calendar-day', color: '#0d6efd' },
    { value: 'weekly', label: 'reports.types.weekly', icon: 'fa-calendar-week', color: '#198754' },
    { value: 'monthly', label: 'reports.types.monthly', icon: 'fa-calendar', color: '#6f42c1' },
    { value: 'project', label: 'reports.types.project', icon: 'fa-folder-open', color: '#fd7e14' },
    { value: 'incident', label: 'reports.types.incident', icon: 'fa-exclamation-triangle', color: '#dc3545' },
  ];

  // Computed filtered reports
  filteredReports = computed(() => {
    let filtered = this.reports();
    
    // Filter by type
    if (this.filterType() !== 'all') {
      filtered = filtered.filter(r => r.type === this.filterType());
    }

    // Filter by search term
    const search = this.searchTerm().toLowerCase();
    if (search) {
      filtered = filtered.filter(r => 
        r.title.toLowerCase().includes(search) ||
        r.summary.toLowerCase().includes(search) ||
        r.content.toLowerCase().includes(search)
      );
    }

    return filtered.sort((a, b) => 
      new Date(b.reportDate).getTime() - new Date(a.reportDate).getTime()
    );
  });

  // Statistics
  statistics = computed(() => {
    const reports = this.reports();
    const total = reports.length;
    const completed = reports.reduce((sum, r) => sum + r.completedTasks, 0);
    const pending = reports.reduce((sum, r) => sum + r.pendingTasks, 0);
    const blockers = reports.reduce((sum, r) => sum + r.blockers, 0);
    
    return { total, completed, pending, blockers };
  });

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private reportsService: ReportsService
  ) {}

  ngOnInit(): void {
    this.initializeForm();
    this.loadReportsFromBackend();
    
    // Suscribirse a cambios en los reportes
    this.reportsService.reports$.subscribe({
      next: (reports) => this.reports.set(reports),
      error: (error) => console.error('Error en suscripción:', error)
    });
  }

  private initializeForm(): void {
    const today = new Date().toISOString().split('T')[0];
    
    this.reportForm = this.fb.group({
      employeeId: [1, [Validators.required, Validators.min(1)]],
      title: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(200)]],
      content: ['', [Validators.required, Validators.minLength(20)]],
      summary: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
      type: ['daily', Validators.required],
      completedTasks: [0, [Validators.required, Validators.min(0)]],
      pendingTasks: [0, [Validators.required, Validators.min(0)]],
      blockers: [0, [Validators.required, Validators.min(0)]],
      reportDate: [today, Validators.required],
    });
  }

  /**
   * Cargar reportes desde el backend MySQL
   */
  private loadReportsFromBackend(): void {
    this.isLoading.set(true);
    this.errorMessage.set('');
    
    this.reportsService.getAllReports().subscribe({
      next: (reports) => {
        this.reports.set(reports);
        this.isLoading.set(false);
        console.log('✅ Reportes cargados desde MySQL:', reports.length);
      },
      error: (error) => {
        console.error('❌ Error al cargar reportes:', error);
        this.errorMessage.set(error.message);
        this.isLoading.set(false);
        
        // Fallback: cargar reportes demo si hay error de conexión
        if (error.message.includes('conectar con el servidor')) {
          console.warn('⚠️ Backend no disponible. Usando modo offline.');
          this.loadDemoReportsOffline();
        }
      }
    });
  }

  /**
   * Cargar reportes demo solo si el backend no está disponible
   */
  private loadDemoReportsOffline(): void {
    const today = new Date();
    const demoReports: Report[] = [
      {
        id: 1,
        employeeId: 1,
        title: 'Reporte Diario - Desarrollo de Frontend',
        content: 'Hoy completé la implementación del módulo de autenticación con validación de formularios y manejo de errores. Se implementaron las pantallas de login y registro con diseño responsivo.',
        summary: 'Implementación del módulo de autenticación completada con éxito.',
        type: 'daily',
        completedTasks: 5,
        pendingTasks: 2,
        blockers: 0,
        reportDate: today.toISOString().split('T')[0],
        createdAt: new Date().toISOString(),
      },
      {
        id: 2,
        employeeId: 1,
        title: 'Reporte Semanal - Sprint 3',
        content: 'Durante esta semana se completaron las historias de usuario relacionadas con el dashboard principal. Se realizaron pruebas de integración y se corrigieron bugs menores.',
        summary: 'Sprint 3 completado al 85%, pendiente refinamiento de UI.',
        type: 'weekly',
        completedTasks: 12,
        pendingTasks: 3,
        blockers: 1,
        reportDate: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        createdAt: new Date(today.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      },
    ];

    this.reports.set(demoReports);
  }

  openCreateModal(): void {
    this.reportForm.reset({
      employeeId: 1,
      title: '',
      content: '',
      summary: '',
      type: 'daily',
      completedTasks: 0,
      pendingTasks: 0,
      blockers: 0,
      reportDate: new Date().toISOString().split('T')[0],
    });
    this.showCreateModal.set(true);
  }

  closeCreateModal(): void {
    this.showCreateModal.set(false);
    this.reportForm.reset();
  }

  createReport(): void {
    if (this.reportForm.invalid) {
      this.markFormGroupTouched(this.reportForm);
      return;
    }

    this.isLoading.set(true);
    const newReport: Report = this.reportForm.value;

    this.reportsService.createReport(newReport).subscribe({
      next: (createdReport) => {
        console.log('✅ Reporte creado en MySQL:', createdReport);
        this.reports.update(reports => [...reports, createdReport]);
        this.closeCreateModal();
        this.isLoading.set(false);
        alert('¡Reporte creado exitosamente!');
      },
      error: (error) => {
        console.error('❌ Error al crear reporte:', error);
        this.errorMessage.set(error.message);
        this.isLoading.set(false);
        alert(`Error al crear el reporte: ${error.message}`);
      }
    });
  }

  viewReport(report: Report): void {
    this.selectedReport.set(report);
    this.showViewModal.set(true);
  }

  closeViewModal(): void {
    this.showViewModal.set(false);
    this.selectedReport.set(null);
  }

  deleteReport(id: number): void {
    if (!confirm('¿Estás seguro de que quieres eliminar este reporte?')) {
      return;
    }

    this.isLoading.set(true);
    
    this.reportsService.deleteReport(id).subscribe({
      next: () => {
        console.log('✅ Reporte eliminado de MySQL:', id);
        this.reports.update(reports => reports.filter(r => r.id !== id));
        this.isLoading.set(false);
        alert('¡Reporte eliminado exitosamente!');
      },
      error: (error) => {
        console.error('❌ Error al eliminar reporte:', error);
        this.errorMessage.set(error.message);
        this.isLoading.set(false);
        alert(`Error al eliminar el reporte: ${error.message}`);
      }
    });
  }

  setFilter(type: string): void {
    this.filterType.set(type);
  }

  onSearchChange(event: Event): void {
    const target = event.target as HTMLInputElement;
    this.searchTerm.set(target.value);
  }

  getTypeInfo(type: string) {
    // Convertir de mayúsculas (DAILY, WEEKLY) a minúsculas (daily, weekly) para buscar
    const lowerType = type.toLowerCase();
    return this.reportTypes.find(t => t.value === lowerType) || this.reportTypes[0];
  }

  getFieldError(fieldName: string): string | null {
    const field = this.reportForm.get(fieldName);
    if (field?.touched && field?.errors) {
      if (field.errors['required']) return 'Este campo es obligatorio';
      if (field.errors['minlength']) 
        return `Mínimo ${field.errors['minlength'].requiredLength} caracteres`;
      if (field.errors['maxlength']) 
        return `Máximo ${field.errors['maxlength'].requiredLength} caracteres`;
      if (field.errors['min']) return `Valor mínimo: ${field.errors['min'].min}`;
    }
    return null;
  }

  private markFormGroupTouched(formGroup: FormGroup): void {
    Object.keys(formGroup.controls).forEach(key => {
      const control = formGroup.get(key);
      control?.markAsTouched();
    });
  }

  goBack(): void {
    this.router.navigate(['/home']);
  }
}
