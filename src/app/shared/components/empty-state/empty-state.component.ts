import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IconComponent } from '../icon/icon.component';

@Component({
  selector: 'app-empty-state',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './empty-state.component.html',
  styleUrl: './empty-state.component.css'
})
export class EmptyStateComponent {
  @Input() mensaje: string = 'No hay datos disponibles';
  @Input() icono: string = '📭';

  private readonly iconNames = new Set([
    'dashboard', 'building', 'document', 'credit-card', 'chat', 'message-square',
    'paperclip', 'file-text', 'users', 'settings', 'user', 'chart-bar', 'chart-line',
    'bell', 'search', 'filter', 'plus', 'edit', 'trash', 'check', 'x', 'arrow-right',
    'arrow-left', 'calendar', 'clock', 'eye', 'download', 'upload', 'mail', 'phone',
    'map-pin', 'check-circle', 'alert-circle', 'info', 'sun', 'moon', 'send', 'file',
    'refresh', 'document-check', 'timeline', 'folder', 'chevron-up', 'chevron-down',
    'camera', 'activity', 'chevron-right', 'alert-triangle'
  ]);

  get usaIcono(): boolean {
    return this.iconNames.has(this.icono);
  }

  get iconName(): any {
    return this.icono;
  }
}








