import { Component, ChangeDetectionStrategy, inject, computed } from '@angular/core';
import { LOCALE_ID } from '@angular/core';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatTooltipModule } from '@angular/material/tooltip';

@Component({
  selector: 'app-language-switcher',
  standalone: true,
  imports: [MatButtonToggleModule, MatTooltipModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './language-switcher.component.html',
  styleUrl: './language-switcher.component.scss',
})
export class LanguageSwitcherComponent {
  private readonly localeId = inject(LOCALE_ID);

  readonly currentLocale = computed(() => (this.localeId.startsWith('en') ? 'en' : 'vi'));

  switchTo(targetLocale: 'vi' | 'en'): void {
    if (targetLocale === this.currentLocale()) return;

    const { pathname, search, hash } = window.location;
    const isOnEnPath = pathname.startsWith('/en/') || pathname === '/en';

    let targetPath: string;
    if (targetLocale === 'en') {
      targetPath = '/en' + (isOnEnPath ? pathname.slice(3) || '/' : pathname);
    } else {
      targetPath = isOnEnPath ? pathname.slice(3) || '/' : pathname;
    }

    window.location.href = targetPath + search + hash;
  }
}
