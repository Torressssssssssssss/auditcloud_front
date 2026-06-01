import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '../../../environments/environment';

interface SolicitudPago {
  id_solicitud: number;
  monto: number;
  concepto: string;
  id_estado: number; // 1 = PENDIENTE, 2 = PAGADA
  creado_en: string;
  pagada_en?: string;
  empresa_auditora?: number; // ID de la empresa que cobra
}

@Component({
  selector: 'app-cliente-pagos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pagos.component.html',
  styleUrls: ['./pagos.component.css']
})
export class PagosComponent implements OnInit {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  
  // Lista cruda de todas las solicitudes
  todasLasSolicitudes = signal<SolicitudPago[]>([]);
  cargando = signal(true);
  procesandoId = signal<number | null>(null);
  estadoPago = signal('');

  // Filtros automáticos (Signals computadas)
  pendientes = computed(() => this.todasLasSolicitudes().filter(s => s.id_estado === 1));
  historial = computed(() => this.todasLasSolicitudes().filter(s => s.id_estado === 2));

  ngOnInit() {
    this.cargarDatos();
    this.revisarRetornoMercadoPago();
  }

  revisarRetornoMercadoPago() {
    this.route.queryParamMap.subscribe((params) => {
      const status = params.get('status');
      const paymentId = params.get('payment_id');
      const externalReference = params.get('external_reference');

      if (status === 'success' || status === 'approved') {
        if (paymentId) {
          const headers = this.obtenerHeaders();
          this.http.post<{ status?: string; message?: string }>(
            `${environment.apiUrl}/api/pagos/mercadopago/confirmar`,
            {
              payment_id: paymentId,
              id_solicitud: externalReference ? Number(externalReference) : undefined
            },
            { headers }
          ).subscribe({
            next: (res) => {
              this.estadoPago.set(res?.status === 'approved'
                ? 'Pago confirmado con Mercado Pago.'
                : 'Pago recibido. Verificando confirmación.');
              this.cargarDatos();
            },
            error: (err) => {
              this.estadoPago.set(err?.error?.message || 'Pago recibido. Pendiente de confirmación.');
              this.cargarDatos();
            }
          });
        } else {
          this.estadoPago.set('Pago recibido. Si no aparece de inmediato, refresca la lista.');
        }
      } else if (status === 'failure') {
        this.estadoPago.set('El pago fue rechazado o cancelado.');
      } else if (status === 'pending') {
        this.estadoPago.set('El pago quedó pendiente de aprobación.');
      }
    });
  }

  obtenerHeaders() {
    const token = localStorage.getItem('auditcloud_token');
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }

  cargarDatos() {
    this.cargando.set(true);
    
    const token = localStorage.getItem('auditcloud_token');
    const userStr = localStorage.getItem('auditcloud_user');

    if (!token || !userStr) {
      this.router.navigate(['/login']);
      return;
    }

    const usuario = JSON.parse(userStr);
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

    // Consumimos el endpoint de cliente
    this.http.get<SolicitudPago[]>(`${environment.apiUrl}/api/cliente/solicitudes-pago/${usuario.id_usuario}`, { headers })
      .subscribe({
        next: (data) => {
          this.todasLasSolicitudes.set(data);
          this.cargando.set(false);
        },
        error: (err) => {
          console.error('Error', err);
          this.cargando.set(false);
        }
      });
  }

  pagarConMercadoPago(solicitud: SolicitudPago) {
    this.procesandoId.set(solicitud.id_solicitud);
    this.estadoPago.set('');

    const headers = this.obtenerHeaders();
    this.http.post<{ id_preferencia: string; init_point?: string; sandbox_init_point?: string }>(
      `${environment.apiUrl}/api/pagos/mercadopago/preferencia`,
      { id_solicitud: solicitud.id_solicitud },
      { headers }
    ).subscribe({
      next: (data) => {
        const urlDestino = data?.sandbox_init_point || data?.init_point;
        if (!urlDestino) {
          this.procesandoId.set(null);
          this.estadoPago.set('No se pudo obtener la URL de Mercado Pago.');
          return;
        }

        window.location.href = urlDestino;
      },
      error: (err) => {
        this.procesandoId.set(null);
        this.estadoPago.set(err?.error?.message || 'No fue posible iniciar el pago con Mercado Pago.');
      }
    });
  }
}