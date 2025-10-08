import { Routes } from '@angular/router';
import { LandingComponent } from './landing/landing.component';
import { Coaching } from './coaching/coaching';

export const routes: Routes = [
  { path: '', component: LandingComponent },
  { path: 'coaching', component: Coaching },
  { path: '**', redirectTo: '' },
];
