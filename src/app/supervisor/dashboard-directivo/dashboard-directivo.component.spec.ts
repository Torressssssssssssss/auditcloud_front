import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { BehaviorSubject, Subject } from 'rxjs';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { environment } from '../../../environments/environment';
import { NuevoConsumo } from '../../models/dashboard-directivo.model';
import { EstadoConexion, WebsocketService } from '../../services/websocket.service';
import { DashboardDirectivoComponent } from './dashboard-directivo.component';

const graficasSimuladas = vi.hoisted(() => ({ instancias: [] as Array<{
  data: { datasets: Array<{ data: number[] }> };
  update: ReturnType<typeof vi.fn>;
  destroy: ReturnType<typeof vi.fn>;
}> }));

vi.mock('chart.js', () =>
{
  class GraficaSimulada
  {
    static register = vi.fn();
    data: { datasets: Array<{ data: number[] }> };
    update = vi.fn();
    destroy = vi.fn();
    constructor(_lienzo: unknown, configuracion: { data: { datasets: Array<{ data: number[] }> } })
    {
      this.data = configuracion.data;
      graficasSimuladas.instancias.push(this);
    }
  }
  return {
    Chart: GraficaSimulada, CategoryScale: {}, Legend: {}, LineController: {},
    LineElement: {}, LinearScale: {}, PointElement: {}, Tooltip: {},
  };
});

describe('AC-04: dashboard directivo', () =>
{
  let escenario: ComponentFixture<DashboardDirectivoComponent>;
  let http: HttpTestingController;
  let consumos: Subject<NuevoConsumo>;
  let estado: BehaviorSubject<EstadoConexion>;
  let resumen: { anio: number; agua: string[]; energia: string[]; unidad_agua: string; unidad_energia: string };
  const esperarRafaga = () => new Promise(resolver => setTimeout(resolver, 200));
  const direccion = () => `${environment.apiUrl}/api/direccion/consumos-mensuales?anio=${new Date().getUTCFullYear()}`;

  beforeEach(() =>
  {
    graficasSimuladas.instancias.length = 0;
    consumos = new Subject<NuevoConsumo>();
    estado = new BehaviorSubject<EstadoConexion>('desconectado');
    resumen = { anio: new Date().getUTCFullYear(), agua: Array(12).fill('0'), energia: Array(12).fill('0'),
      unidad_agua: 'm3', unidad_energia: 'kWh' };
    TestBed.configureTestingModule({
      imports: [DashboardDirectivoComponent],
      providers: [provideHttpClient(), provideHttpClientTesting()],
    });
    TestBed.overrideComponent(DashboardDirectivoComponent, {
      set: { providers: [{ provide: WebsocketService, useValue: {
        nuevoConsumo$: consumos.asObservable(), estado$: estado.asObservable(), conectar: vi.fn(),
      } }] },
    });
    escenario = TestBed.createComponent(DashboardDirectivoComponent);
    http = TestBed.inject(HttpTestingController);
    escenario.detectChanges();
    http.expectOne(direccion()).flush(resumen);
  });

  afterEach(() =>
  {
    escenario.destroy();
    http.verify();
  });

  it('crea dos gráficas con los doce meses del snapshot inicial', () =>
  {
    expect(graficasSimuladas.instancias).toHaveLength(2);
    expect(graficasSimuladas.instancias[0]!.data.datasets[0]!.data).toEqual(Array(12).fill(0));
    expect(escenario.componentInstance.cargando()).toBe(false);
  });

  it('agrupa eventos duplicados y actualiza las gráficas con los totales del servidor', async () =>
  {
    const consumo: NuevoConsumo = { id_evidencia: 7, id_auditoria: 20, tipo_recurso: 'Agua', cantidad: '5.000',
      unidad_medida: 'm3', fecha_inicio: '2026-01-01', fecha_fin: '2026-01-31' };
    consumos.next(consumo);
    consumos.next(consumo);
    await esperarRafaga();
    resumen.agua[0] = '5.000';
    http.expectOne(direccion()).flush(resumen);
    expect(graficasSimuladas.instancias[0]!.data.datasets[0]!.data[0]).toBe(5);
    expect(graficasSimuladas.instancias[0]!.update).toHaveBeenCalledWith('none');
  });

  it('recupera el snapshot al reconectarse, incluyendo eventos perdidos', async () =>
  {
    estado.next('conectado');
    await esperarRafaga();
    resumen.energia[3] = '2000.000';
    http.expectOne(direccion()).flush(resumen);
    expect(graficasSimuladas.instancias[1]!.data.datasets[0]!.data[3]).toBe(2000);
  });

  it('permite reintentar después de un fallo de API sin perder la suscripción', async () =>
  {
    escenario.componentInstance.actualizar();
    await esperarRafaga();
    http.expectOne(direccion()).flush({}, { status: 500, statusText: 'Error' });
    expect(escenario.componentInstance.error()).toContain('No se pudieron');
    escenario.componentInstance.actualizar();
    await esperarRafaga();
    http.expectOne(direccion()).flush(resumen);
    expect(escenario.componentInstance.error()).toBe('');
  });

  it('destruye ambas gráficas al abandonar la pantalla', () =>
  {
    escenario.destroy();
    for (const grafica of graficasSimuladas.instancias)
    {
      expect(grafica.destroy).toHaveBeenCalledOnce();
    }
  });
});
