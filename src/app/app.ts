import { Component, signal, inject, OnInit } from '@angular/core';
import { LayoutComponent } from './layout/layout.component';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  imports: [LayoutComponent],
  templateUrl: './app.html',
  styleUrl: './app.css',
})
export class App implements OnInit {
  protected readonly title = signal('neuro');
  private translateService = inject(TranslateService);

  ngOnInit() {
    // Set default language
    this.translateService.setDefaultLang('es');

    // Check for saved language preference
    const savedLang = localStorage.getItem('selectedLanguage');
    if (savedLang) {
      this.translateService.use(savedLang);
    } else {
      this.translateService.use('es');
    }
  }
}
