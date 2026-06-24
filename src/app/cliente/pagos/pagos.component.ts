import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { environment } from '../../../environments/environment';
import { IconComponent } from '../../shared/components/icon/icon.component';

interface SolicitudPago {
  id_solicitud: number;
  monto: number;
  concepto: string;
  id_estado: number; // 1 = PENDIENTE, 2 = PAGADA
  creado_en: string;
  pagada_en?: string;
  empresa_auditora?: number;
  mercadopago_status?: string | null;
  mercadopago_status_detail?: string | null;
  mercadopago_payment_id?: string | null;
  id_pago_mercadopago?: string | null;
  id_preferencia?: string | null;
}

interface PreferenciaMercadoPago {
  id_preferencia: string;
  preference_id?: string;
  init_point?: string;
  sandbox_init_point?: string;
}

interface EstadoMercadoPagoResponse {
  id_solicitud_pago: number;
  estado?: 'pagado' | 'pendiente';
  estado_interno: 'pagado' | 'pendiente';
  id_estado: number;
  pagado?: boolean;
  mercadopago_status?: string | null;
  mercadopago_status_detail?: string | null;
  mercadopago_payment_id?: string | null;
  payment_id?: string | null;
  id_preferencia?: string | null;
  pagada_en?: string | null;
  mensaje?: string;
  solicitud?: SolicitudPago;
}

interface ConfirmarMercadoPagoResponse {
  status?: string;
  status_detail?: string | null;
  message?: string;
  payment_id?: string | null;
  solicitud?: SolicitudPago;
}

interface ModalPagoState {
  visible: boolean;
  solicitud: SolicitudPago | null;
  checkoutUrl: string | null;
  mensaje: string;
  detalle: string;
  verificando: boolean;
  popupBloqueado: boolean;
  popupCerrado: boolean;
  error: boolean;
}

@Component({
  selector: 'app-cliente-pagos',
  standalone: true,
  imports: [CommonModule, IconComponent],
  templateUrl: './pagos.component.html',
  styleUrls: ['./pagos.component.css']
})
export class PagosComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private popupMercadoPago: Window | null = null;
  private pollingId: ReturnType<typeof setInterval> | null = null;

  todasLasSolicitudes = signal<SolicitudPago[]>([]);
  cargando = signal(true);
  procesandoId = signal<number | null>(null);
  estadoPago = signal('');
  modalPago = signal<ModalPagoState>({
    visible: false,
    solicitud: null,
    checkoutUrl: null,
    mensaje: '',
    detalle: '',
    verificando: false,
    popupBloqueado: false,
    popupCerrado: false,
    error: false
  });

  pendientes = computed(() => this.todasLasSolicitudes().filter(s => s.id_estado === 1));
  historial = computed(() => this.todasLasSolicitudes().filter(s => s.id_estado === 2));

  ngOnInit(): void {
    this.cargarDatos();
    this.revisarRetornoMercadoPago();
  }

  ngOnDestroy(): void {
    this.detenerPolling();
  }

  revisarRetornoMercadoPago(): void {
    this.route.queryParamMap.subscribe((params) => {
      const status = params.get('status');
      const paymentId = params.get('payment_id') || params.get('collection_id');
      const externalReference = params.get('external_reference');
      const idSolicitud = externalReference ? Number(externalReference) : null;

      if (!status) {
        return;
      }

      if (status === 'success' || status === 'approved') {
        this.estadoPago.set('Pago recibido, verificando confirmacion.');
        if (paymentId || idSolicitud) {
          this.confirmarRetornoMercadoPago(paymentId, idSolicitud);
        } else {
          this.cargarDatos();
        }
      } else if (status === 'failure') {
        this.estadoPago.set('El pago no se completo.');
        this.cargarDatos();
      } else if (status === 'pending') {
        this.estadoPago.set('El pago esta pendiente.');
        if (idSolicitud) {
          this.verificarEstadoSolicitud(idSolicitud, false);
        } else {
          this.cargarDatos();
        }
      }
    });
  }

  obtenerHeaders(): HttpHeaders {
    const token = localStorage.getItem('auditcloud_token');
    return new HttpHeaders({ 'Authorization': `Bearer ${token}` });
  }

  cargarDatos(): void {
    this.cargando.set(true);

    const token = localStorage.getItem('auditcloud_token');
    const userStr = localStorage.getItem('auditcloud_user');

    if (!token || !userStr) {
      this.router.navigate(['/login']);
      return;
    }

    const usuario = JSON.parse(userStr) as { id_usuario: number };
    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

    this.http.get<SolicitudPago[]>(`${environment.apiUrl}/api/cliente/solicitudes-pago/${usuario.id_usuario}`, { headers })
      .subscribe({
        next: (data) => {
          this.todasLasSolicitudes.set(data);
          this.cargando.set(false);
        },
        error: (err: unknown) => {
          console.error('Error', err);
          this.cargando.set(false);
        }
      });
  }

  pagarConMercadoPago(solicitud: SolicitudPago): void {
    this.procesandoId.set(solicitud.id_solicitud);
    this.estadoPago.set('');
    this.popupMercadoPago = null;

    this.http.post<PreferenciaMercadoPago>(
      `${environment.apiUrl}/api/pagos/mercadopago/preferencia`,
      { id_solicitud_pago: solicitud.id_solicitud },
      { headers: this.obtenerHeaders() }
    ).subscribe({
      next: (data) => {
        const urlDestino = data?.sandbox_init_point || data?.init_point || null;
        if (!urlDestino) {
          this.procesandoId.set(null);
          this.estadoPago.set('No se pudo obtener la URL de Mercado Pago.');
          return;
        }

        this.abrirModalPago(solicitud, urlDestino);
        this.abrirPopupMercadoPago(urlDestino);
        this.verificarEstadoSolicitud(solicitud.id_solicitud, false);
        this.iniciarPollingEstado(solicitud.id_solicitud);
      },
      error: (err: { error?: { message?: string } }) => {
        this.popupMercadoPago?.close();
        this.popupMercadoPago = null;
        this.procesandoId.set(null);
        this.estadoPago.set(err?.error?.message || 'No fue posible iniciar el pago con Mercado Pago.');
      }
    });
  }

  abrirMercadoPagoManual(): void {
    const url = this.modalPago().checkoutUrl;
    if (!url) {
      return;
    }

    const popup = this.crearPopup(url);
    if (popup) {
      this.popupMercadoPago = popup;
      this.actualizarModal({
        popupBloqueado: false,
        popupCerrado: false,
        error: false,
        detalle: 'Se abrió una ventana segura para finalizar el pago.'
      });
      return;
    }

    this.actualizarModal({
      popupBloqueado: true,
      error: true,
      detalle: 'El navegador bloqueó la ventana emergente. Usa el botón para abrir Mercado Pago.'
    });
    window.location.href = url;
  }

  verificarPagoActual(): void {
    const solicitud = this.modalPago().solicitud;
    if (!solicitud) {
      return;
    }

    this.verificarEstadoSolicitud(solicitud.id_solicitud, true);
  }

  cancelarPago(): void {
    this.detenerPolling();
    this.procesandoId.set(null);
    this.actualizarModal({ visible: false, verificando: false });
    this.estadoPago.set('Pago cancelado. No se marco como pagado.');
  }

  private abrirModalPago(solicitud: SolicitudPago, checkoutUrl: string): void {
    this.modalPago.set({
      visible: true,
      solicitud,
      checkoutUrl,
      mensaje: 'Completa tu pago en Mercado Pago',
      detalle: 'Se abrió una ventana segura para finalizar el pago.',
      verificando: false,
      popupBloqueado: false,
      popupCerrado: false,
      error: false
    });
  }

  private abrirPopupMercadoPago(url: string): void {
    if (this.popupMercadoPago && !this.popupMercadoPago.closed) {
      this.popupMercadoPago.location.href = url;
      return;
    }

    const popup = this.crearPopup(url);
    if (!popup) {
      this.popupMercadoPago = null;
      this.actualizarModal({
        popupBloqueado: true,
        detalle: 'El navegador bloqueó la ventana emergente. Usa el botón para abrir Mercado Pago.',
        error: true
      });
      return;
    }

    this.popupMercadoPago = popup;
  }

  private crearPopup(url: string): Window | null {
    const width = Math.min(980, Math.max(360, window.screen.availWidth - 80));
    const height = Math.min(760, Math.max(560, window.screen.availHeight - 100));
    const left = Math.max(0, Math.round((window.screen.availWidth - width) / 2));
    const top = Math.max(0, Math.round((window.screen.availHeight - height) / 2));
    return window.open(
      url,
      'MercadoPagoCheckout',
      `popup=yes,width=${width},height=${height},left=${left},top=${top}`
    );
  }

  private iniciarPollingEstado(idSolicitud: number): void {
    this.detenerPolling();
    this.pollingId = setInterval(() => {
      if (this.popupMercadoPago?.closed) {
        this.actualizarModal({ popupCerrado: true, detalle: 'La ventana de Mercado Pago se cerro. Verificando el estado del pago.' });
      }
      this.verificarEstadoSolicitud(idSolicitud, false);
    }, 5000);
  }

  private detenerPolling(): void {
    if (this.pollingId) {
      clearInterval(this.pollingId);
      this.pollingId = null;
    }
  }

  private verificarEstadoSolicitud(idSolicitud: number, manual: boolean): void {
    this.actualizarModal({ verificando: true, error: false });
    this.http.get<EstadoMercadoPagoResponse>(
      `${environment.apiUrl}/api/pagos/mercadopago/estado/${idSolicitud}`,
      { headers: this.obtenerHeaders() }
    ).subscribe({
      next: (res) => this.aplicarEstadoPago(res, manual),
      error: (err: { error?: { message?: string } }) => {
        this.actualizarModal({
          verificando: false,
          error: true,
          detalle: err?.error?.message || 'No fue posible verificar el estado del pago.'
        });
      }
    });
  }

  private confirmarRetornoMercadoPago(paymentId: string | null, idSolicitud: number | null): void {
    this.http.post<ConfirmarMercadoPagoResponse>(
      `${environment.apiUrl}/api/pagos/mercadopago/confirmar`,
      {
        payment_id: paymentId || undefined,
        id_solicitud: idSolicitud || undefined
      },
      { headers: this.obtenerHeaders() }
    ).subscribe({
      next: (res) => {
        this.estadoPago.set(res?.status === 'approved'
          ? 'Pago confirmado con Mercado Pago.'
          : res?.message || 'Pago recibido. Verificando confirmacion.');
        this.cargarDatos();
      },
      error: (err: { error?: { message?: string } }) => {
        this.estadoPago.set(err?.error?.message || 'Pago recibido. Pendiente de confirmacion.');
        this.cargarDatos();
      }
    });
  }

  private aplicarEstadoPago(res: EstadoMercadoPagoResponse, manual: boolean): void {
    const pagado = Boolean(res.pagado) || res.estado === 'pagado' || res.estado_interno === 'pagado' || res.id_estado === 2 || res.mercadopago_status === 'approved';

    if (res.solicitud) {
      this.actualizarSolicitudLocal(res.solicitud);
    }

    if (pagado) {
      this.detenerPolling();
      this.procesandoId.set(null);
      this.actualizarModal({ visible: false, verificando: false });
      this.estadoPago.set('Pago confirmado con Mercado Pago.');
      this.cargarDatos();
      return;
    }

    this.actualizarModal({
      verificando: false,
      error: false,
      detalle: manual
        ? res.mensaje || 'Aún no se confirma el pago.'
        : 'Aún no se confirma el pago.'
    });
  }

  private actualizarSolicitudLocal(solicitudActualizada: SolicitudPago): void {
    this.todasLasSolicitudes.update((solicitudes) => solicitudes.map((solicitud) => (
      solicitud.id_solicitud === solicitudActualizada.id_solicitud
        ? { ...solicitud, ...solicitudActualizada }
        : solicitud
    )));
  }

  private actualizarModal(parcial: Partial<ModalPagoState>): void {
    this.modalPago.update((actual) => ({ ...actual, ...parcial }));
  }
}
