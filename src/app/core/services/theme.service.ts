import { Injectable } from '@angular/core';

export type Theme = 'light' | 'dark';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  private key = 'lifehub_theme';
  private current: Theme = 'light';

  constructor() {
    let saved: Theme | null = null;
    try {
      if (typeof window !== 'undefined' && typeof window.localStorage !== 'undefined') {
        saved = localStorage.getItem(this.key) as Theme | null;
      }
    } catch {
      saved = null;
    }

    this.current = saved ?? 'light';
    this.apply(this.current);
  }

  get theme(): Theme {
    return this.current;
  }

  toggle(): Theme {
    const next: Theme = this.current === 'dark' ? 'light' : 'dark';
    this.set(next);
    return next;
  }

  set(theme: Theme) {
    this.current = theme;
    localStorage.setItem(this.key, theme);
    this.apply(theme);
  }

  private apply(theme: Theme) {
    if (typeof document !== 'undefined') {
      document.documentElement.setAttribute('data-theme', theme);
      document.documentElement.classList.toggle('dark-theme', theme === 'dark');
      document.documentElement.classList.toggle('light-theme', theme === 'light');
      document.body?.classList.toggle('dark-theme', theme === 'dark');
      document.body?.classList.toggle('light-theme', theme === 'light');
    }
  }
}
