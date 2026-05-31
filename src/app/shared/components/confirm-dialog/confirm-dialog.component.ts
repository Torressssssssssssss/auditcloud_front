import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-confirm-dialog',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="visible" class="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full flex items-center justify-center z-50">
      <div class="relative bg-white rounded-lg shadow-xl p-6 max-w-sm w-full mx-4">
        <h3 class="text-lg font-medium leading-6 text-gray-900 mb-2">{{ titulo }}</h3>
        <p class="text-sm text-gray-500 mb-6">{{ mensaje }}</p>
        <div class="flex justify-end gap-3">
          <button (click)="cancel.emit()" class="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300">
            Cancelar
          </button>
          <button (click)="confirm.emit()" class="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
            Confirmar
          </button>
        </div>
      </div>
    </div>
  `
})
export class ConfirmDialogComponent {
  @Input() visible = false;
  @Input() titulo = 'Confirmación';
  @Input() mensaje = '¿Estás seguro?';
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();
}