import { TestBed } from '@angular/core/testing';
import { ActivatedRoute, provideRouter } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { of, Subject } from 'rxjs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ApiService } from '../../../services/api.service';
import { AuthService } from '../../../services/auth.service';
import { AuditoriaDetalleComponent } from './detalle.component';

describe('Detalle del supervisor: confirmaciones visuales', () =>
{
  afterEach(() => TestBed.resetTestingModule());

  function preparar()
  {
    const respuestaEstado = new Subject<unknown>();
    const respuestaRetiro = new Subject<unknown>();
    const actualizar = vi.fn(() => respuestaEstado);
    const retirar = vi.fn(() => respuestaRetiro);
    const consultar = vi.fn((ruta: string) => of(ruta.endsWith('/participantes') || ruta.includes('/auditores/') ? [] :
    {
      data: [{ id_auditoria: 42, id_estado: 1, modulos: [1] }]
    }));
    TestBed.configureTestingModule(
    {
      imports: [AuditoriaDetalleComponent],
      providers:
      [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: { get: () => '42' } } } },
        { provide: AuthService, useValue: { getIdEmpresa: () => 11 } },
        { provide: ApiService, useValue: { get: consultar, put: actualizar, removeSupervisorAuditorFromAuditoria: retirar } }
      ]
    });
    const vista = TestBed.createComponent(AuditoriaDetalleComponent);
    vista.detectChanges();
    return { vista, actualizar, retirar, respuestaEstado, respuestaRetiro };
  }

  it('confirma una sola actualización y muestra el éxito sin alertas nativas', () =>
  {
    const escenario = preparar();
    const componente = escenario.vista.componentInstance;
    componente.solicitarCambioEstado(2);
    escenario.vista.detectChanges();
    expect(escenario.vista.nativeElement.querySelector('[role="dialog"]')).not.toBeNull();
    componente.confirmarCambioEstado();
    componente.confirmarCambioEstado();
    expect(escenario.actualizar).toHaveBeenCalledExactlyOnceWith('/api/supervisor/auditorias/42/estado', { id_estado: 2 });
    escenario.respuestaEstado.next({});
    escenario.respuestaEstado.complete();
    escenario.vista.detectChanges();
    expect(componente.auditoria()?.id_estado).toBe(2);
    expect(componente.guardandoEstado()).toBe(false);
    expect(escenario.vista.nativeElement.querySelector('[role="dialog"]')).toBeNull();
    expect(escenario.vista.nativeElement.textContent).toContain('Estado actualizado correctamente.');
    escenario.vista.destroy();
  });

  it('muestra un fallo de conexión sin perder los datos actuales de la auditoría', () =>
  {
    const escenario = preparar();
    const componente = escenario.vista.componentInstance;
    componente.solicitarCambioEstado(2);
    componente.confirmarCambioEstado();
    escenario.respuestaEstado.error(new HttpErrorResponse({ status: 0 }));
    escenario.vista.detectChanges();
    expect(componente.auditoria()?.id_estado).toBe(1);
    expect(componente.guardandoEstado()).toBe(false);
    expect(escenario.vista.nativeElement.textContent).toContain('No hay conexión con el servidor');
    escenario.vista.destroy();
  });

  it('solo retira al auditor después de confirmar en el diálogo', () =>
  {
    const escenario = preparar();
    const componente = escenario.vista.componentInstance;
    componente.quitarAuditor();
    expect(escenario.retirar).not.toHaveBeenCalled();
    componente.cancelarRetiroAuditor();
    expect(componente.mostrarConfirmacionRetiro()).toBe(false);
    componente.quitarAuditor();
    componente.confirmarRetiroAuditor();
    expect(escenario.retirar).toHaveBeenCalledExactlyOnceWith(42);
    escenario.respuestaRetiro.next({});
    escenario.respuestaRetiro.complete();
    expect(componente.mostrarConfirmacionRetiro()).toBe(false);
    escenario.vista.destroy();
  });
});
