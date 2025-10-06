import { Component, inject } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-lang-switch',
  imports: [CommonModule],
  templateUrl: './lang-switch.html',
  styleUrl: './lang-switch.css',
})
export class LangSwitch {
  private translateService = inject(TranslateService);

  currentLang = this.translateService.currentLang || this.translateService.defaultLang || 'es';

  languages = [
    { code: 'es', name: 'Español', flag: '🇪🇸' },
    { code: 'en', name: 'English', flag: '🇺🇸' },
  ];

  switchLanguage(langCode: string) {
    this.translateService.use(langCode);
    this.currentLang = langCode;
    localStorage.setItem('selectedLanguage', langCode);
  }

  getCurrentLanguage() {
    return this.languages.find((lang) => lang.code === this.currentLang);
  }

  ngOnInit() {
    // Check for saved language preference
    const savedLang = localStorage.getItem('selectedLanguage');
    if (savedLang && this.languages.some((lang) => lang.code === savedLang)) {
      this.switchLanguage(savedLang);
    }
  }
}
