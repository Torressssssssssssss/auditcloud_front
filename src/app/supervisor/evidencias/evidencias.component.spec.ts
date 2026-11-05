import { TestBed } from '@angular/core/testing';
import { of } from 'rxjs';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { FileService } from '../../services/file.service';
import { EvidenciasComponent } from './evidencias.component';

describe('Evidencias del supervisor', () =>
{
  it('mostrar las métricas recibidas y admitir evidencias sin consumo', async () =>
  {
    const auditoria =
    {
      id_auditoria: 20, id_cliente: 9, id_solicitud_pago: 3, id_estado: 2,
      fecha_creacion: '2026-01-01', estado_actualizado_en: '2026-01-02'
    };
    const evidencia =
    {
      id_evidencia: 1, id_auditoria: 20, id_modulo: 3, id_auditor: 8,
      tipo: 'COMENTARIO', descripcion: 'Lectura eléctrica', creado_en: '2026-01-31',
      consumo:
      {
        id_evidencia: 1, tipo_recurso: 'Energía', cantidad: '18.420',
        unidad_medida: 'MWh', fecha_inicio: '2026-01-01', fecha_fin: '2026-01-31'
      }
    };
    await TestBed.configureTestingModule(
    {
      imports: [EvidenciasComponent],
      providers: [
        {
          provide: ApiService,
          useValue:
          {
            get: (ruta: string) => of(ruta.endsWith('/evidencias')
              ? [evidencia, { ...evidencia, id_evidencia: 2, consumo: null }]
              : [auditoria])
          }
        },
        { provide: AuthService, useValue: { getIdEmpresa: () => 11 } },
        { provide: FileService, useValue: {} }
      ]
    }).compileComponents();
    const vista = TestBed.createComponent(EvidenciasComponent);
    vista.detectChanges();
    vista.componentInstance.auditoriaSeleccionada.set(auditoria);
    vista.componentInstance.cargarEvidencias(auditoria.id_auditoria);
    vista.detectChanges();
    await vista.whenStable();

    const contenido = vista.nativeElement.textContent;
    expect(contenido).toContain('Energía');
    expect(contenido).toContain('18.420 MWh');
    expect(contenido).toContain('01/01/2026 – 31/01/2026');
    expect(vista.nativeElement.querySelectorAll('app-consumo-ambiental')).toHaveLength(1);
    expect(vista.nativeElement.querySelector('[aria-label="Sin consumo registrado"]')).toBeTruthy();
  });
});
