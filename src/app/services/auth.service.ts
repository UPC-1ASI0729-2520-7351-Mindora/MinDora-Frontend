import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

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

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  constructor() {
    // Verificar si hay un usuario guardado en localStorage
    const savedUser = localStorage.getItem('currentUser');
    if (savedUser) {
      this.currentUserSubject.next(JSON.parse(savedUser));
    }
  }

  login(credentials: LoginCredentials): boolean {
    // Simulación simple de login - en una app real esto sería una llamada HTTP
    const users = this.getStoredUsers();
    const user = users.find(u => u.email === credentials.email && u.password === credentials.password);
    
    if (user) {
      const userData = { id: user.id, email: user.email, name: user.name };
      this.currentUserSubject.next(userData);
      localStorage.setItem('currentUser', JSON.stringify(userData));
      return true;
    }
    return false;
  }

  register(credentials: RegisterCredentials): boolean {
    // Verificar si el email ya existe
    const users = this.getStoredUsers();
    if (users.find(u => u.email === credentials.email)) {
      return false;
    }

    // Crear nuevo usuario
    const newUser = {
      id: Date.now(), // ID simple basado en timestamp
      name: credentials.name,
      email: credentials.email,
      password: credentials.password
    };

    users.push(newUser);
    localStorage.setItem('users', JSON.stringify(users));

    // Auto-login después del registro
    const userData = { id: newUser.id, email: newUser.email, name: newUser.name };
    this.currentUserSubject.next(userData);
    localStorage.setItem('currentUser', JSON.stringify(userData));
    
    return true;
  }

  logout(): void {
    this.currentUserSubject.next(null);
    localStorage.removeItem('currentUser');
  }

  isAuthenticated(): boolean {
    return this.currentUserSubject.value !== null;
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  private getStoredUsers(): any[] {
    const users = localStorage.getItem('users');
    return users ? JSON.parse(users) : [];
  }
}
