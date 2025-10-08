import { Component, signal } from '@angular/core';
import { TranslateModule } from '@ngx-translate/core';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-landing',
  imports: [TranslateModule, RouterLink],
  templateUrl: './landing.component.html',
  styleUrl: './landing.component.css',
})
export class LandingComponent {
  protected readonly title = signal('os');
  protected readonly currentYear = new Date().getFullYear();
}
