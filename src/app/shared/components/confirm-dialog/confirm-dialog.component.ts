import { Component, ElementRef, EventEmitter, HostListener, Input, Output, ViewChild } from '@angular/core';

@Component(
{
  selector: 'app-confirm-dialog',
  standalone: true,
  templateUrl: './confirm-dialog.component.html',
  styleUrls: ['./confirm-dialog.component.css']
})
export class ConfirmDialogComponent
{
  private static siguienteIdentificador = 0;
  readonly identificador = `confirmacion-${++ConfirmDialogComponent.siguienteIdentificador}`;
  private elementoAnterior: HTMLElement | null = null;
  private contenedor?: ElementRef<HTMLElement>;

  @Input() visible = false;
  @Input() ocupado = false;
  @Input() titulo = 'Confirmación';
  @Input() mensaje = '¿Estás seguro?';
  @Output() confirm = new EventEmitter<void>();
  @Output() cancel = new EventEmitter<void>();

  @ViewChild('contenido') set contenido(elemento: ElementRef<HTMLElement> | undefined)
  {
    this.contenedor = elemento;
    if(elemento)
    {
      this.elementoAnterior = document.activeElement instanceof HTMLElement ? document.activeElement : null;
      elemento.nativeElement.querySelector<HTMLButtonElement>('button')?.focus();
    }
    else
    {
      this.elementoAnterior?.focus();
      this.elementoAnterior = null;
    }
  }

  confirmar(): void
  {
    if(!this.ocupado) this.confirm.emit();
  }

  cancelar(): void
  {
    if(!this.ocupado) this.cancel.emit();
  }

  @HostListener('document:keydown.escape', ['$event']) cerrarConEscape(evento: Event): void
  {
    if(this.visible)
    {
      evento.preventDefault();
      this.cancelar();
    }
  }

  mantenerFoco(evento: Event): void
  {
    const botones = this.contenedor?.nativeElement.querySelectorAll<HTMLButtonElement>('button:not(:disabled)');
    if(!botones?.length)
    {
      evento.preventDefault();
      return;
    }
    const primero = botones[0];
    const ultimo = botones[botones.length - 1];
    const inverso = evento instanceof KeyboardEvent && evento.shiftKey;
    if(inverso && document.activeElement === primero)
    {
      evento.preventDefault();
      ultimo.focus();
    }
    else if(!inverso && document.activeElement === ultimo)
    {
      evento.preventDefault();
      primero.focus();
    }
  }
}
