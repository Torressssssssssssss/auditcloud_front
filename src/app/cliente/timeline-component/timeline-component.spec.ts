import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';
import { vi } from 'vitest';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { FileService } from '../../services/file.service';

import { TimelineComponent } from './timeline-component';

describe('TimelineComponent', () =>
{
  let component: TimelineComponent;
  let fixture: ComponentFixture<TimelineComponent>;
  let apiSimulada: { get: ReturnType<typeof vi.fn> };

  beforeEach(async () =>
  {
    apiSimulada = { get: vi.fn(() => of([])) };
    await TestBed.configureTestingModule({
      imports: [TimelineComponent],
      providers: [
        { provide: ActivatedRoute, useValue: { queryParams: of({}) } },
        { provide: ApiService, useValue: apiSimulada },
        { provide: AuthService, useValue: { getUsuarioActual: () => ({ id_empresa: 11 }) } },
        { provide: FileService, useValue: {} }
      ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(TimelineComponent);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('debe cargar el historial vacío de la empresa autenticada', () =>
  {
    expect(component).toBeTruthy();
    expect(apiSimulada.get).toHaveBeenCalledExactlyOnceWith('/api/timeline/empresa/11');
    expect(component.grupos()).toEqual([]);
    expect(fixture.nativeElement.textContent).toContain('No hay historiales de auditoría para esta empresa.');
  });

  it('mostrar consumo y conservar eventos sin mediciones', async () =>
  {
    apiSimulada.get.mockReturnValue(of([
      {
        id_auditoria: 20,
        fecha_creacion: '2026-01-01',
        estado: 2,
        items: [
          {
            id: 'EVI-1', tipo: 'EVIDENCIA', descripcion: 'Lectura de agua',
            autor: 'Auditora', fecha: '2026-01-31',
            consumo:
            {
              id_evidencia: 1, tipo_recurso: 'Agua', cantidad: '0.000',
              unidad_medida: 'm3', fecha_inicio: '2026-01-01', fecha_fin: '2026-01-31'
            }
          },
          {
            id: 'COM-2', tipo: 'COMENTARIO', descripcion: 'Revisión pendiente',
            autor: 'Cliente', fecha: '2026-01-31'
          }
        ]
      }
    ]));
    component.cargarHistorialCompleto();
    fixture.detectChanges();
    await fixture.whenStable();

    const contenido = fixture.nativeElement.textContent;
    expect(contenido).toContain('Agua');
    expect(contenido).toContain('0.000 m³ (metros cúbicos)');
    expect(contenido).toContain('01/01/2026 – 31/01/2026');
    expect(contenido).toContain('Revisión pendiente');
    expect(fixture.nativeElement.querySelectorAll('app-consumo-ambiental')).toHaveLength(1);
  });

});
