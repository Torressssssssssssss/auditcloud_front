import { TestBed } from '@angular/core/testing';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ConfirmDialogComponent } from './confirm-dialog.component';

describe('Diálogo de confirmación', () =>
{
  afterEach(() => TestBed.resetTestingModule());

  it('carga el overlay y permite cancelar con Escape y confirmar', () =>
  {
    const vista = TestBed.createComponent(ConfirmDialogComponent);
    const confirmar = vi.fn();
    const cancelar = vi.fn();
    vista.componentInstance.confirm.subscribe(confirmar);
    vista.componentInstance.cancel.subscribe(cancelar);
    vista.componentRef.setInput('visible', true);
    vista.componentRef.setInput('titulo', 'Confirmar cambio de estado');
    vista.detectChanges();
    const fondo = vista.nativeElement.querySelector('.dialog-overlay') as HTMLElement;
    expect(fondo).not.toBeNull();
    expect(getComputedStyle(fondo).position).toBe('fixed');
    expect(vista.nativeElement.querySelector('[role="dialog"]').getAttribute('aria-modal')).toBe('true');
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(cancelar).toHaveBeenCalledOnce();
    vista.nativeElement.querySelector('.btn-primary').click();
    expect(confirmar).toHaveBeenCalledOnce();
    vista.componentRef.setInput('visible', false);
    vista.detectChanges();
    expect(vista.nativeElement.querySelector('.dialog-overlay')).toBeNull();
    vista.destroy();
  });

  it('bloquea confirmación y cancelación durante el guardado', () =>
  {
    const vista = TestBed.createComponent(ConfirmDialogComponent);
    const confirmar = vi.fn();
    const cancelar = vi.fn();
    vista.componentInstance.confirm.subscribe(confirmar);
    vista.componentInstance.cancel.subscribe(cancelar);
    vista.componentRef.setInput('visible', true);
    vista.componentRef.setInput('ocupado', true);
    vista.detectChanges();
    vista.componentInstance.confirmar();
    vista.componentInstance.cancelar();
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    expect(confirmar).not.toHaveBeenCalled();
    expect(cancelar).not.toHaveBeenCalled();
    expect(vista.nativeElement.querySelector('.btn-primary').disabled).toBe(true);
    vista.destroy();
  });
});
