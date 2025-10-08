import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LangSwitch } from '../shared/lang-switch/lang-switch';
import { TranslateModule } from '@ngx-translate/core';
import { AuthService, User } from '../services/auth.service';

@Component({
  selector: 'app-header',
  imports: [CommonModule, LangSwitch, TranslateModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent implements OnInit {
  currentUser: User | null = null;

  constructor(
    private authService: AuthService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  goToRegister(): void {
    this.router.navigate(['/register']);
  }

  goToCoaching(): void {
    this.router.navigate(['/coaching']);
  }
}
