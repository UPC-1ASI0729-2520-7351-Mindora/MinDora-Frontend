import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, tap } from 'rxjs/operators';

export interface Appointment {
  id?: number | string;  // Puede ser número o UUID string
  psychologistId: number;
  psychologistName: string;
  employeeId: number;
  date: string; // YYYY-MM-DD
  time: string; // HH:mm
  type: 'video' | 'in-person' | 'phone';
  reason: string;
  notes?: string;
  status: 'upcoming' | 'past' | 'cancelled';
  createdAt?: string;
  updatedAt?: string;
}

@Injectable({
  providedIn: 'root'
})
export class AppointmentsHttpService {
  private apiUrl = 'http://localhost:8080/api/v1/appointments';
  
  private httpOptions = {
    headers: new HttpHeaders({
      'Content-Type': 'application/json'
    })
  };

  constructor(private http: HttpClient) {}

  /**
   * Obtener todos los appointments
   */
  getAllAppointments(): Observable<Appointment[]> {
    return this.http.get<Appointment[]>(this.apiUrl).pipe(
      tap((appointments) => console.log('✅ Appointments obtenidos:', appointments.length)),
      catchError(this.handleError)
    );
  }

  /**
   * Crear un nuevo appointment
   */
  createAppointment(appointment: Appointment): Observable<Appointment> {
    return this.http.post<Appointment>(this.apiUrl, appointment, this.httpOptions).pipe(
      tap((created) => console.log('✅ Appointment creado con ID:', created.id)),
      catchError(this.handleError)
    );
  }

  /**
   * Obtener appointment por ID
   */
  getAppointmentById(id: number | string): Observable<Appointment> {
    return this.http.get<Appointment>(`${this.apiUrl}/${id}`).pipe(
      catchError(this.handleError)
    );
  }

  /**
   * Actualizar un appointment
   */
  updateAppointment(id: number | string, appointment: Appointment): Observable<Appointment> {
    return this.http.put<Appointment>(`${this.apiUrl}/${id}`, appointment, this.httpOptions).pipe(
      tap(() => console.log('✅ Appointment actualizado')),
      catchError(this.handleError)
    );
  }

  /**
   * Eliminar un appointment
   */
  deleteAppointment(id: number | string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`).pipe(
      tap(() => console.log('✅ Appointment eliminado')),
      catchError(this.handleError)
    );
  }

  /**
   * Cancelar un appointment
   */
  cancelAppointment(id: number | string): Observable<Appointment> {
    return this.http.patch<Appointment>(`${this.apiUrl}/${id}/cancel`, {}, this.httpOptions).pipe(
      tap(() => console.log('✅ Appointment cancelado')),
      catchError(this.handleError)
    );
  }

  /**
   * Manejo de errores HTTP
   */
  private handleError(error: any) {
    let errorMessage = 'Error desconocido';
    if (error.error instanceof ErrorEvent) {
      // Error del lado del cliente
      errorMessage = `Error: ${error.error.message}`;
    } else {
      // Error del lado del servidor
      errorMessage = `Código: ${error.status}\nMensaje: ${error.message}`;
    }
    console.error('❌ Error en AppointmentsHttpService:', errorMessage);
    return throwError(() => new Error(errorMessage));
  }
}
