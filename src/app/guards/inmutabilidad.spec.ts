import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of, throwError } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { AuditoriaDetalleComponent as DetalleAuditor } from '../auditor/auditorias/detalle/detalle.component';
import { AuditoriaDetalleComponent as DetalleSupervisor } from '../supervisor/auditorias/detalle/detalle.component';
import { ApiService } from '../services/api.service';
import { AuthService } from '../services/auth.service';
import { FileService } from '../services/file.service';

describe('AC-06: controles de edición de auditorías', () =>
{
  let escenario: ComponentFixture<DetalleAuditor | DetalleSupervisor>;
  let apiSimulada: { get: ReturnType<typeof vi.fn>; post: ReturnType<typeof vi.fn>;
    put: ReturnType<typeof vi.fn>; patch: ReturnType<typeof vi.fn> };
  const auditoria = { id_auditoria: 20, id_empresa_auditora: 11, id_cliente: 9,
    id_estado: 3, objetivo: 'Objetivo protegido', modulos: [1], cliente: { nombre_empresa: 'Cliente' } };

  beforeEach(() =>
  {
    apiSimulada = { get: vi.fn(() => of([])), post: vi.fn(() => of({})),
      put: vi.fn(() => of({})), patch: vi.fn(() => of({})) };
    TestBed.configureTestingModule({
      imports: [DetalleAuditor, DetalleSupervisor],
      providers: [provideRouter([]),
        { provide: ApiService, useValue: apiSimulada },
        { provide: AuthService, useValue: { getIdEmpresa: () => 11 } },
        { provide: FileService, useValue: {} }],
    });
  });

  afterEach(() => escenario?.destroy());

  it('deshabilita Editar y Agregar Actualización, conservando las descargas', () =>
  {
    const vista = TestBed.createComponent(DetalleAuditor);
    escenario = vista;
    vista.componentInstance.auditoria.set(auditoria);
    vista.componentInstance.loading.set(false);
    vista.detectChanges();
    const botones = Array.from(vista.nativeElement.querySelectorAll('button')) as HTMLButtonElement[];
    expect(botones.find(boton => boton.textContent!.trim() === 'Editar')!.disabled).toBe(true);
    expect(botones.find(boton => boton.textContent!.includes('Agregar Actualización'))!.disabled).toBe(true);
    expect(botones.find(boton => boton.textContent!.includes('Descargar Reporte'))!.disabled).toBe(false);
    vista.componentInstance.startEditObjetivo();
    vista.componentInstance.saveObjetivo();
    vista.componentInstance.guardarComentario();
    expect(apiSimulada.patch).not.toHaveBeenCalled();
    expect(apiSimulada.post).not.toHaveBeenCalled();
  });

  it('bloquea los módulos y las asignaciones de un supervisor sin enviar peticiones', () =>
  {
    const vista = TestBed.createComponent(DetalleSupervisor);
    escenario = vista;
    vista.componentInstance.auditoria.set(auditoria);
    vista.componentInstance.loading.set(false);
    vista.detectChanges();
    const botones = Array.from(vista.nativeElement.querySelectorAll('button')) as HTMLButtonElement[];
    const protegidos = botones.filter(boton => ['+ Agua', '+ Residuos', '+ Energía', 'Asignar auditor'].includes(boton.textContent!.trim()));
    expect(protegidos).toHaveLength(4);
    expect(protegidos.every(boton => boton.disabled)).toBe(true);
    vista.componentInstance.agregarModulo(2);
    vista.componentInstance.asignarAuditor();
    vista.componentInstance.quitarAuditor();
    vista.componentInstance.solicitarCambioEstado(1);
    vista.componentInstance.confirmarCambioEstado();
    expect(apiSimulada.post).not.toHaveBeenCalled();
    expect(apiSimulada.put).not.toHaveBeenCalled();
  });

  it('convierte la vista del auditor en solo lectura si se cerró en otra sesión', () =>
  {
    const vista = TestBed.createComponent(DetalleAuditor);
    escenario = vista;
    vista.componentInstance.auditoria.set({ ...auditoria, id_estado: 2 });
    apiSimulada.patch.mockReturnValue(throwError(() => ({ error: { code: 'AUDITORIA_FINALIZADA', message: 'Solo lectura.' } })));
    vista.componentInstance.saveObjetivo();
    expect(vista.componentInstance.soloLectura).toBe(true);
    expect(vista.componentInstance.avisoInmutabilidad()).toBe('Solo lectura.');
  });

  it('mantiene habilitada la edición del objetivo de una auditoría abierta', () =>
  {
    const vista = TestBed.createComponent(DetalleAuditor);
    escenario = vista;
    vista.componentInstance.auditoria.set({ ...auditoria, id_estado: 2 });
    vista.componentInstance.startEditObjetivo();
    expect(vista.componentInstance.isEditingObjetivo()).toBe(true);
    vista.componentInstance.saveObjetivo();
    expect(apiSimulada.patch).toHaveBeenCalledOnce();
  });
});
