import { Component, OnInit, signal, inject, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService, SolicitudPagoItem, SolicitudPagoPayload } from '../../services/api.service';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { IconComponent } from '../../shared/components/icon/icon.component';

type ChatItem =
  | { tipo: 'mensaje'; id: string; fecha: string; mensaje: Mensaje }
  | { tipo: 'pago'; id: string; fecha: string; solicitud: SolicitudPagoItem };

interface Mensaje {
  id_mensaje: number;
  id_conversacion: number;
  emisor_tipo: 'CLIENTE' | 'SUPERVISOR' | 'AUDITOR';
  emisor_id: number;
  contenido: string;
  creado_en: string;
}

interface Conversacion {
  id_conversacion: number;
  cliente?: { 
    id_usuario: number;
    id_empresa: number; // Necesario para el botón de cobro
    nombre: string; 
    nombre_empresa: string; 
  }; 
  ultimo_mensaje?: Mensaje;
  creado_en: string;
}

@Component({
  selector: 'app-supervisor-mensajes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterModule,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    IconComponent
  ],
  templateUrl: './mensajes.component.html',
  styleUrls: ['./mensajes.component.css']
})
export class MensajesComponent implements OnInit, AfterViewChecked {
  private apiService = inject(ApiService);

  loading = signal<boolean>(true);
  conversaciones = signal<Conversacion[]>([]);
  conversacionSeleccionada = signal<Conversacion | null>(null);
  mensajes = signal<Mensaje[]>([]);
  solicitudesPago = signal<SolicitudPagoItem[]>([]);
  mostrarModalSolicitud = signal(false);
  creandoSolicitud = signal(false);
  errorSolicitud = signal<string | null>(null);
  exitoSolicitud = signal<string | null>(null);
  montoSolicitud: number | null = null;
  conceptoSolicitud = '';
  textoMensaje = '';
  shouldScroll = false;

  @ViewChild('chatViewport') private chatViewport!: ElementRef;

  ngOnInit(): void {
    this.cargarSolicitudesPago();
    this.cargarConversaciones();
  }

  ngAfterViewChecked() {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
  }

  cargarSolicitudesPago() {
    this.apiService.listSupervisorSolicitudesPago({ page: 1, limit: 200 })
      .subscribe({
        next: (response) => this.solicitudesPago.set(response?.data || []),
        error: (err) => {
          console.warn('No se cargaron solicitudes de pago para el chat supervisor.', err);
          this.solicitudesPago.set([]);
        }
      });
  }

  cargarConversaciones() {
    this.apiService.get<Conversacion[]>('/api/supervisor/conversaciones')
      .subscribe({
        next: (data) => {
          const ordenadas = [...data].sort((a, b) => {
            const fa = new Date(a.ultimo_mensaje?.creado_en || a.creado_en).getTime();
            const fb = new Date(b.ultimo_mensaje?.creado_en || b.creado_en).getTime();
            return fb - fa;
          });
          this.conversaciones.set(ordenadas);
          this.loading.set(false);
        },
        error: (err) => {
          console.error(err);
          this.loading.set(false);
        }
      });
  }

  seleccionar(conv: Conversacion) {
    this.conversacionSeleccionada.set(conv);
    this.shouldScroll = true;
    this.cargarMensajes(conv.id_conversacion);
  }

  cargarMensajes(id: number) {
    this.apiService.get<Mensaje[]>(`/api/supervisor/mensajes/${id}`)
      .subscribe({
        next: (msgs) => {
          const ordenados = [...msgs].sort((a, b) => new Date(a.creado_en).getTime() - new Date(b.creado_en).getTime());
          this.mensajes.set(ordenados);
          this.shouldScroll = true;
          setTimeout(() => this.scrollToBottom(), 0);
        }
      });
  }

  enviar() {
    if (!this.textoMensaje.trim() || !this.conversacionSeleccionada()) return;

    const payload = {
      id_conversacion: this.conversacionSeleccionada()!.id_conversacion,
      contenido: this.textoMensaje
    };

    this.apiService.post<Mensaje>('/api/supervisor/mensajes', payload)
      .subscribe({
        next: (nuevo) => {
          this.mensajes.update(m => [...m, nuevo]);
          this.textoMensaje = '';
          this.shouldScroll = true;
          this.cargarConversaciones();
        }
      });
  }

    abrirSolicitudPago() {
      const conv = this.conversacionSeleccionada();
      if (!conv?.cliente) {
        this.errorSolicitud.set('La conversación seleccionada no tiene datos suficientes para generar la solicitud.');
        return;
      }

      this.errorSolicitud.set(null);
      this.exitoSolicitud.set(null);
      this.montoSolicitud = null;
      this.conceptoSolicitud = '';
      this.mostrarModalSolicitud.set(true);
    }

    cerrarSolicitudPago() {
      if (this.creandoSolicitud()) return;
      this.mostrarModalSolicitud.set(false);
      this.errorSolicitud.set(null);
    }

    crearSolicitudPago() {
      const conv = this.conversacionSeleccionada();
      const cliente = conv?.cliente;

      if (!cliente?.id_empresa || !cliente?.id_usuario) {
        this.errorSolicitud.set('No se puede generar la solicitud porque faltan la empresa o el usuario destino en la conversación.');
        return;
      }

      if (!this.montoSolicitud || !this.conceptoSolicitud.trim()) {
        this.errorSolicitud.set('El monto y el concepto son obligatorios.');
        return;
      }

      const payload: SolicitudPagoPayload = {
        id_empresa: Number(cliente.id_empresa),
        id_cliente: Number(cliente.id_usuario),
        monto: Number(this.montoSolicitud),
        concepto: this.conceptoSolicitud.trim()
      };

      this.creandoSolicitud.set(true);
      this.errorSolicitud.set(null);

      this.apiService.createSupervisorSolicitudPago(payload).subscribe({
        next: () => {
          this.creandoSolicitud.set(false);
          this.mostrarModalSolicitud.set(false);
          this.exitoSolicitud.set('Solicitud de pago creada correctamente.');
          this.cargarSolicitudesPago();
        },
        error: (error) => {
          this.creandoSolicitud.set(false);
          this.errorSolicitud.set(error?.error?.message || 'No fue posible crear la solicitud de pago.');
        }
      });
  }

  scrollToBottom() {
    try {
      this.chatViewport.nativeElement.scrollTop = this.chatViewport.nativeElement.scrollHeight;
    } catch(err) {}
  }

  esPropio(msg: Mensaje): boolean {
    return msg.emisor_tipo === 'SUPERVISOR'; // Yo soy el supervisor
  }

  esCliente(msg: Mensaje): boolean {
    return msg.emisor_tipo === 'CLIENTE';
  }

  esPagoPropio(solicitud: SolicitudPagoItem): boolean {
    const conv = this.conversacionSeleccionada();
    if (!conv?.cliente) return false;

    const mismoCliente = Number(solicitud.id_cliente) === Number(conv.cliente.id_usuario);
    const mismaEmpresaCliente = !solicitud.id_empresa_cliente || Number(solicitud.id_empresa_cliente) === Number(conv.cliente.id_empresa);
    return mismoCliente && mismaEmpresaCliente;
  }

  chatItems(): ChatItem[] {
    const mensajes: ChatItem[] = this.mensajes().map((mensaje) => ({
      tipo: 'mensaje',
      id: `mensaje-${mensaje.id_mensaje || mensaje.creado_en}`,
      fecha: mensaje.creado_en,
      mensaje
    }));

    const pagos: ChatItem[] = this.solicitudesChat().map((solicitud) => ({
      tipo: 'pago',
      id: `pago-${solicitud.id_solicitud}`,
      fecha: solicitud.creado_en || solicitud.pagada_en || '',
      solicitud
    }));

    return [...mensajes, ...pagos].sort((a, b) => this.timeValue(a.fecha) - this.timeValue(b.fecha));
  }

  solicitudesChat(): SolicitudPagoItem[] {
    const conv = this.conversacionSeleccionada();
    if (!conv?.cliente) return [];

    const idsVistos = new Set<number>();
    return this.solicitudesPago()
      .filter((solicitud) => {
        const mismoCliente = Number(solicitud.id_cliente) === Number(conv.cliente?.id_usuario);
        const mismaEmpresaCliente = !solicitud.id_empresa_cliente || Number(solicitud.id_empresa_cliente) === Number(conv.cliente?.id_empresa);
        return mismoCliente && mismaEmpresaCliente;
      })
      .filter((solicitud) => {
        if (idsVistos.has(solicitud.id_solicitud)) return false;
        idsVistos.add(solicitud.id_solicitud);
        return true;
      });
  }

  previewRemitente(conv: Conversacion): string {
    const msg = conv.ultimo_mensaje;
    if (!msg) return 'Sistema';
    if (msg.emisor_tipo === 'SUPERVISOR') return 'Tú';
    return conv.cliente?.nombre || this.nombrePorRol(msg.emisor_tipo);
  }

  estadoPagoTexto(solicitud: SolicitudPagoItem): string {
    const estado = Number(solicitud.id_estado);
    if (estado === 2 || solicitud.pagada_en || (solicitud as any).mercadopago_status === 'approved') return 'Pagado';
    if (estado === 3) return 'Rechazado';
    if (estado === 4) return 'En proceso';
    return 'Pendiente';
  }

  estadoPagoClase(solicitud: SolicitudPagoItem): string {
    return `payment-status ${this.estadoPagoTexto(solicitud).toLowerCase().replace(' ', '-')}`;
  }

  formatoMonto(monto: number | string): string {
    return Number(monto || 0).toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
  }

  private nombrePorRol(tipo?: string): string {
    if (tipo === 'AUDITOR') return 'Auditor';
    if (tipo === 'SUPERVISOR') return 'Supervisor';
    if (tipo === 'CLIENTE') return 'Cliente';
    return 'Usuario';
  }

  private timeValue(fecha?: string): number {
    const value = fecha ? new Date(fecha).getTime() : 0;
    return Number.isNaN(value) ? 0 : value;
  }
}