import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

export interface Report {
  id?: number;
  employeeId: number;
  title: string;
  content: string;
  summary: string;
  type: string;
  completedTasks: number;
  pendingTasks: number;
  blockers: number;
  reportDate: string; // YYYY-MM-DD format
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class ReportsService {
  // URL de tu backend Spring Boot
  private apiUrl = 'http://localhost:8080/api/v1/reports';
  
  // Subject para notificar cambios en los reportes
  private reportsSubject = new BehaviorSubject<Report[]>([]);
  public reports$ = this.reportsSubject.asObservable();

  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };

  constructor(private http: HttpClient) {
    this.loadReports();
  }

  /**
   * Obtener todos los reportes del backend
   */
  getAllReports(): Observable<Report[]> {
    return this.http.get<Report[]>(this.apiUrl).pipe(
      tap(reports => this.reportsSubject.next(reports)),
      catchError(this.handleError)
    );
  }

  /**
   * Obtener un reporte por ID
   */
  getReportById(id: number): Observable<Report> {
    return this.http.get<Report>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Obtener reportes por empleado
   */
  getReportsByEmployee(employeeId: number): Observable<Report[]> {
    return this.http.get<Report[]>(`${this.apiUrl}/employee/${employeeId}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Obtener reportes por tipo
   */
  getReportsByType(type: string): Observable<Report[]> {
    return this.http.get<Report[]>(`${this.apiUrl}/type/${type}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Crear un nuevo reporte
   */
  createReport(report: Report): Observable<Report> {
    // Convertir el tipo a mayúsculas para el backend Spring Boot
    const reportToSend = {
      ...report,
      type: report.type.toUpperCase()
    };
    
    return this.http.post<Report>(this.apiUrl, reportToSend, this.httpOptions).pipe(
      tap(() => this.loadReports()), // Recargar la lista después de crear
      catchError(this.handleError)
    );
  }

  /**
   * Actualizar un reporte existente
   */
  updateReport(id: number, report: Report): Observable<Report> {
    // Convertir el tipo a mayúsculas para el backend Spring Boot
    const reportToSend = {
      ...report,
      type: report.type.toUpperCase()
    };
    
    return this.http.put<Report>(`${this.apiUrl}/${id}`, reportToSend, this.httpOptions).pipe(
      tap(() => this.loadReports()), // Recargar la lista después de actualizar
      catchError(this.handleError)
    );
  }

  /**
   * Eliminar un reporte
   */
  deleteReport(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.loadReports()), // Recargar la lista después de eliminar
      catchError(this.handleError)
    );
  }

  /**
   * Obtener estadísticas de reportes
   */
  getStatistics(): Observable<{
    totalReports: number;
    completedTasks: number;
    pendingTasks: number;
    blockers: number;
  }> {
    return this.http.get<any>(`${this.apiUrl}/statistics`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Cargar reportes y actualizar el subject
   */
  private loadReports(): void {
    this.getAllReports().subscribe({
      next: (reports) => console.log('Reportes cargados:', reports.length),
      error: (error) => console.error('Error al cargar reportes:', error)
    });
  }

  /**
   * Manejo de errores HTTP
   */
  private handleError(error: HttpErrorResponse) {
    let errorMessage = 'Ocurrió un error desconocido';
    
    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      errorMessage = `Código de error: ${error.status}\nMensaje: ${error.message}`;
      
      // Mensajes específicos según el código de estado
      switch (error.status) {
        case 0:
          errorMessage = 'No se puede conectar con el servidor. Verifica que el backend esté ejecutándose.';
          break;
        case 400:
          errorMessage = 'Solicitud inválida. Verifica los datos enviados.';
          break;
        case 404:
          errorMessage = 'Reporte no encontrado.';
          break;
        case 500:
          errorMessage = 'Error interno del servidor.';
          break;
      }
    }
    
    console.error('Error en ReportsService:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
