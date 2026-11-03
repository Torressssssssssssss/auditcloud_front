import { AfterViewInit, Component, DestroyRef, ElementRef, OnDestroy, OnInit, ViewChild, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { EMPTY, Subject, auditTime, catchError, filter, merge, startWith, switchMap, tap } from 'rxjs';
import { Chart, CategoryScale, Legend, LineController, LineElement, LinearScale, PointElement, Tooltip } from 'chart.js';
import { ApiService } from '../../services/api.service';
import { EstadoConexion, WebsocketService } from '../../services/websocket.service';
import { ConsumosMensuales } from '../../models/dashboard-directivo.model';

Chart.register(CategoryScale, LinearScale, LineController, LineElement, PointElement, Tooltip, Legend);

@Component({
  selector: 'app-dashboard-directivo',
  standalone: true,
  imports: [CommonModule],
  providers: [WebsocketService],
  templateUrl: './dashboard-directivo.component.html',
  styleUrl: './dashboard-directivo.component.css',
})
export class DashboardDirectivoComponent implements OnInit, AfterViewInit, OnDestroy
{
  private readonly api = inject(ApiService);
  private readonly websocket = inject(WebsocketService);
  private readonly destruccion = inject(DestroyRef);
  private readonly recargar = new Subject<void>();
  private graficaAgua?: Chart<'line'>;
  private graficaEnergia?: Chart<'line'>;
  readonly anio = signal(new Date().getUTCFullYear());
  readonly cargando = signal(true);
  readonly error = signal('');
  readonly errorAnio = signal('');
  readonly conexion = signal<EstadoConexion>('desconectado');
  readonly datos = signal<ConsumosMensuales | null>(null);
  readonly actualizacion = signal<Date | null>(null);
  readonly meses = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

  @ViewChild('lienzoAgua', { static: true }) private lienzoAgua!: ElementRef<HTMLCanvasElement>;
  @ViewChild('lienzoEnergia', { static: true }) private lienzoEnergia!: ElementRef<HTMLCanvasElement>;

  ngOnInit(): void
  {
    this.websocket.estado$.pipe(takeUntilDestroyed(this.destruccion)).subscribe((estado) => this.conexion.set(estado));
    merge(
      this.recargar,
      this.websocket.nuevoConsumo$,
      this.websocket.estado$.pipe(filter((estado) => estado === 'conectado')),
    ).pipe(
      auditTime(150),
      startWith(null),
      tap(() =>
      {
        this.cargando.set(true);
        this.error.set('');
      }),
      switchMap(() => this.api.get<ConsumosMensuales>(`/api/direccion/consumos-mensuales?anio=${this.anio()}`).pipe(
        catchError(() =>
        {
          this.error.set('No se pudieron actualizar los consumos. Puedes volver a intentarlo.');
          this.cargando.set(false);
          return EMPTY;
        }),
      )),
      takeUntilDestroyed(this.destruccion),
    ).subscribe((resumen) =>
    {
      this.datos.set(resumen);
      this.actualizarGrafica(this.graficaAgua, resumen.agua);
      this.actualizarGrafica(this.graficaEnergia, resumen.energia);
      this.actualizacion.set(new Date());
      this.cargando.set(false);
    });
    this.websocket.conectar();
  }

  ngAfterViewInit(): void
  {
    this.graficaAgua = this.crearGrafica(this.lienzoAgua.nativeElement, 'Agua (m³)', '#1678b5');
    this.graficaEnergia = this.crearGrafica(this.lienzoEnergia.nativeElement, 'Energía (kWh)', '#c17b00');
    const resumen = this.datos();
    if (resumen)
    {
      this.actualizarGrafica(this.graficaAgua, resumen.agua);
      this.actualizarGrafica(this.graficaEnergia, resumen.energia);
    }
  }

  cambiarAnio(evento: Event): void
  {
    const valor = (evento.target as HTMLInputElement).value;
    if (!/^[1-9]\d{3}$/.test(valor))
    {
      this.errorAnio.set('Selecciona un año entre 1000 y 9999.');
      return;
    }
    this.errorAnio.set('');
    this.anio.set(Number(valor));
    this.actualizar();
  }

  actualizar(): void
  {
    this.recargar.next();
  }

  private crearGrafica(lienzo: HTMLCanvasElement, etiqueta: string, color: string): Chart<'line'>
  {
    return new Chart<'line'>(lienzo, {
      type: 'line',
      data: {
        labels: this.meses,
        datasets: [{ label: etiqueta, data: Array(12).fill(0), borderColor: color, tension: 0.2 }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        scales: { y: { beginAtZero: true } },
      },
    });
  }

  private actualizarGrafica(grafica: Chart<'line'> | undefined, valores: string[]): void
  {
    if (!grafica) return;
    grafica.data.datasets[0]!.data = valores.map((valor) => Number(valor));
    grafica.update('none');
  }

  ngOnDestroy(): void
  {
    this.graficaAgua?.destroy();
    this.graficaEnergia?.destroy();
    this.recargar.complete();
  }
}
