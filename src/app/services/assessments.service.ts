import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, throwError, BehaviorSubject } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

export interface Assessment {
  id?: number;
  employeeId: number;
  assessmentType: 'PSYCHOLOGICAL' | 'PERFORMANCE' | 'WELLBEING' | 'RISK_ANALYSIS';
  score: number;
  emotionalState: 'CALM' | 'STRESSED' | 'ANXIOUS' | 'DEPRESSED' | 'MOTIVATED' | 'FATIGUED' | 'NEUTRAL';
  observations: string;
  recommendations: string;
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AssessmentsService {
  // URL de tu backend Spring Boot
  private apiUrl = 'http://localhost:8080/api/v1/assessments';
  
  // Subject para notificar cambios en los assessments
  private assessmentsSubject = new BehaviorSubject<Assessment[]>([]);
  public assessments$ = this.assessmentsSubject.asObservable();

  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };

  constructor(private http: HttpClient) {
    this.loadAssessments();
  }

  /**
   * Obtener todos los assessments del backend
   */
  getAllAssessments(): Observable<Assessment[]> {
    return this.http.get<Assessment[]>(this.apiUrl).pipe(
      tap(assessments => this.assessmentsSubject.next(assessments)),
      catchError(this.handleError)
    );
  }

  /**
   * Obtener un assessment por ID
   */
  getAssessmentById(id: number): Observable<Assessment> {
    return this.http.get<Assessment>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Obtener assessments por empleado
   */
  getAssessmentsByEmployee(employeeId: number): Observable<Assessment[]> {
    return this.http.get<Assessment[]>(`${this.apiUrl}/employee/${employeeId}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Obtener assessments por tipo
   */
  getAssessmentsByType(type: string): Observable<Assessment[]> {
    return this.http.get<Assessment[]>(`${this.apiUrl}/type/${type}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Crear un nuevo assessment
   */
  createAssessment(assessment: Assessment): Observable<Assessment> {
    // Convertir el tipo a mayúsculas para el backend Spring Boot
    const assessmentToSend = {
      ...assessment,
      assessmentType: assessment.assessmentType.toUpperCase(),
      emotionalState: assessment.emotionalState.toUpperCase()
    };
    
    return this.http.post<Assessment>(this.apiUrl, assessmentToSend, this.httpOptions).pipe(
      tap(() => this.loadAssessments()), // Recargar la lista después de crear
      catchError(this.handleError)
    );
  }

  /**
   * Actualizar un assessment existente
   */
  updateAssessment(id: number, assessment: Assessment): Observable<Assessment> {
    // Convertir los enums a mayúsculas para el backend Spring Boot
    const assessmentToSend = {
      ...assessment,
      assessmentType: assessment.assessmentType.toUpperCase(),
      emotionalState: assessment.emotionalState.toUpperCase()
    };
    
    return this.http.put<Assessment>(`${this.apiUrl}/${id}`, assessmentToSend, this.httpOptions).pipe(
      tap(() => this.loadAssessments()), // Recargar la lista después de actualizar
      catchError(this.handleError)
    );
  }

  /**
   * Eliminar un assessment
   */
  deleteAssessment(id: number): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => this.loadAssessments()), // Recargar la lista después de eliminar
      catchError(this.handleError)
    );
  }

  /**
   * Obtener estadísticas de assessments
   */
  getStatistics(): Observable<{
    totalAssessments: number;
    averageScore: number;
    mostCommonEmotionalState: string;
  }> {
    return this.http.get<any>(`${this.apiUrl}/statistics`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Cargar assessments y actualizar el subject
   */
  private loadAssessments(): void {
    this.getAllAssessments().subscribe({
      next: (assessments) => console.log('✅ Assessments cargados desde MySQL:', assessments.length),
      error: (error) => console.error('❌ Error al cargar assessments:', error)
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
          errorMessage = 'Assessment no encontrado.';
          break;
        case 500:
          errorMessage = 'Error interno del servidor.';
          break;
      }
    }
    
    console.error('Error en AssessmentsService:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }

  /**
   * Convertir el resultado del cuestionario local al formato del backend
   */
  convertLocalToBackendFormat(
    localResult: any,
    employeeId: number = 1
  ): Assessment {
    // Mapear el nivel de estrés a estado emocional
    const emotionalStateMap: Record<string, Assessment['emotionalState']> = {
      'low': 'CALM',
      'moderate': 'STRESSED',
      'high': 'ANXIOUS'
    };

    // Mapear el score (0-100) manteniendo el rango
    const score = Math.round(localResult.score);

    // Determinar el tipo de assessment basado en las categorías
    let assessmentType: Assessment['assessmentType'] = 'PSYCHOLOGICAL';
    if (localResult.categoryScores) {
      const maxCategory = Object.entries(localResult.categoryScores)
        .reduce((a: any, b: any) => a[1] > b[1] ? a : b);
      
      // Mapear categorías del cuestionario a tipos del backend
      if (maxCategory[0] === 'work') assessmentType = 'PERFORMANCE';
      else if (maxCategory[0] === 'physical' || maxCategory[0] === 'sleep') assessmentType = 'WELLBEING';
      else assessmentType = 'PSYCHOLOGICAL';
    }

    // Construir observaciones desde las categorías
    const observations = localResult.categoryScores 
      ? `Evaluación de estrés completada. Puntajes por categoría - Trabajo: ${localResult.categoryScores.work}/100, Sueño: ${localResult.categoryScores.sleep}/100, Físico: ${localResult.categoryScores.physical}/100, Emocional: ${localResult.categoryScores.emotional}/100. Nivel de estrés detectado: ${localResult.level}.`
      : `Evaluación completada con puntaje de ${score}/100`;

    // Construir recomendaciones
    const recommendations = localResult.recommendations && localResult.recommendations.length > 0
      ? localResult.recommendations.join('. ') + '.'
      : 'Se recomienda seguimiento continuo del estado emocional y evaluaciones periódicas.';

    return {
      employeeId,
      assessmentType,
      score,
      emotionalState: emotionalStateMap[localResult.level] || 'NEUTRAL',
      observations,
      recommendations
    };
  }
}
