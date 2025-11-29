import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';

export interface User {
  id: number;
  email: string;
  name: string;
}

export interface LoginCredentials {
  email: string;
  password: string;
}

export interface RegisterCredentials {
  name: string;
  email: string;
  password: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:8080/api/v1/auth';
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();
  private tokenKey = 'auth_token';
  private userKey = 'currentUser';

  constructor(private http: HttpClient) {
    // Verificar si hay un usuario guardado en localStorage
    const savedUser = localStorage.getItem(this.userKey);
    const savedToken = localStorage.getItem(this.tokenKey);
    
    if (savedUser && savedToken) {
      this.currentUserSubject.next(JSON.parse(savedUser));
    }
  }

  /**
   * Login de usuario
   */
  login(credentials: LoginCredentials): Observable<boolean> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap((response: AuthResponse) => {
        console.log('✅ Login exitoso:', response.user);
        this.setSession(response);
      }),
      map(() => true),
      catchError((error) => {
        console.error('❌ Error en login:', error);
        return throwError(() => new Error(error.error?.message || 'Email o contraseña incorrectos'));
      })
    );
  }

  /**
   * Registro de usuario
   */
  register(credentials: RegisterCredentials): Observable<boolean> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, credentials).pipe(
      tap((response: AuthResponse) => {
        console.log('✅ Registro exitoso:', response.user);
        this.setSession(response);
      }),
      map(() => true),
      catchError((error) => {
        console.error('❌ Error en registro:', error);
        return throwError(() => new Error(error.error?.message || 'Error al registrar usuario'));
      })
    );
  }

  /**
   * Logout de usuario
   */
  logout(): void {
    this.currentUserSubject.next(null);
    localStorage.removeItem(this.tokenKey);
    localStorage.removeItem(this.userKey);
    console.log('👋 Usuario desconectado');
  }

  /**
   * Verificar si el usuario está autenticado
   */
  isAuthenticated(): boolean {
    const token = this.getToken();
    return token !== null && this.currentUserSubject.value !== null;
  }

  /**
   * Obtener usuario actual
   */
  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  /**
   * Obtener token JWT
   */
  getToken(): string | null {
    return localStorage.getItem(this.tokenKey);
  }

  /**
   * Guardar sesión después de login/registro
   */
  private setSession(response: AuthResponse): void {
    localStorage.setItem(this.tokenKey, response.token);
    localStorage.setItem(this.userKey, JSON.stringify(response.user));
    this.currentUserSubject.next(response.user);
  }

  /**
   * Obtener headers con token JWT para peticiones autenticadas
   */
  getAuthHeaders(): HttpHeaders {
    const token = this.getToken();
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    });
  }
}
