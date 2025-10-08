import { Routes } from '@angular/router';
import { LandingComponent } from './landing/landing.component';
import { Coaching } from './coaching/coaching';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'coaching', component: Coaching, canActivate: [AuthGuard] },
  { path: '**', redirectTo: '' },
];
