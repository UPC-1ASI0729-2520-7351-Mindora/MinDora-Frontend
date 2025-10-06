import { Component } from '@angular/core';
import { LangSwitch } from '../shared/lang-switch/lang-switch';
import { TranslateModule } from '@ngx-translate/core';

@Component({
  selector: 'app-header',
  imports: [LangSwitch, TranslateModule],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent {}
