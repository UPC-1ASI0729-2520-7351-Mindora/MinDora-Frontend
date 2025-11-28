import { Routes } from '@angular/router';
import { Coaching } from './coaching/coaching';
import { LandingComponent } from './landing/landing.component';
import { LoginComponent } from './auth/login/login.component';
import { RegisterComponent } from './auth/register/register.component';
import { HomeComponent } from './home/home.component';
import { AssessmentTrackingComponent } from './assessment-tracking/assessment-tracking.component';
import { ProfileSettingsComponent } from './profile-settings/profile-settings.component';
import { AuthGuard } from './guards/auth.guard';
import { SubscriptionComponent } from './subscription/subscription.component';
import { RoutinesComponent } from './routines/routines.component';
import { ReportsComponent } from './reports/reports.component';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: '', redirectTo: '/home', pathMatch: 'full' },
  { path: 'home', component: HomeComponent, canActivate: [AuthGuard] },
  { path: 'login', component: LoginComponent },
  { path: 'register', component: RegisterComponent },
  { path: 'coaching', component: Coaching, canActivate: [AuthGuard] },
  { path: 'routines', component: RoutinesComponent, canActivate: [AuthGuard] },
  { path: 'assessment-tracking', component: AssessmentTrackingComponent, canActivate: [AuthGuard] },
  { path: 'profile-settings', component: ProfileSettingsComponent, canActivate: [AuthGuard] },
  { path: 'reports', component: ReportsComponent, canActivate: [AuthGuard] },

  // ➜ Aquí integras el nuevo
  { path: 'subscription/:plan', component: SubscriptionComponent, canActivate: [AuthGuard] },

  { path: '**', redirectTo: '/home' },
];
