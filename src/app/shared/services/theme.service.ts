import { Injectable, signal } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class ThemeService {
  current = signal<'light' | 'dark'>('light');

  constructor() {
    // Verificar preferencia del sistema
    const prefersDark = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches;
    const saved = localStorage.getItem('theme');
    const initial = saved ? (saved === 'dark' ? 'dark' : 'light') : (prefersDark ? 'dark' : 'light');
    this.apply(initial);
  }

  toggle(): void {
    const next = this.current() === 'dark' ? 'light' : 'dark';
    this.apply(next);
  }

  apply(theme: 'light' | 'dark'): void {
    this.current.set(theme);
    const root = document.documentElement;
    if (theme === 'dark') root.classList.add('dark');
    else root.classList.remove('dark');
    localStorage.setItem('theme', theme);
  }
}
