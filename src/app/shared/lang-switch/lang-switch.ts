import { Component, inject, Output, EventEmitter } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-lang-switch',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './lang-switch.html',
  styleUrl: './lang-switch.css',
})
export class LangSwitch {
  @Output() languageChange = new EventEmitter<'es' | 'en'>();
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
    this.languageChange.emit(langCode as 'es' | 'en');
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
