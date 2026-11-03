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
});
