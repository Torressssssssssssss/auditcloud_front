import { Component, OnInit, signal, inject, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService, SolicitudPagoItem } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
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
  // El auditor ve "Clientes", no empresas auditoras
  cliente?: { 
    id_usuario?: number;
    id_empresa?: number;
    nombre: string; 
    nombre_empresa: string; 
  }; 
  creado_en: string;
  ultimo_mensaje?: Mensaje;
  asunto?: string;
}

@Component({
  selector: 'app-auditor-mensajes',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    IconComponent
  ],
  templateUrl: './mensajes.component.html',
  styleUrl: './mensajes.component.css'
})
export class MensajesComponent implements OnInit, AfterViewChecked {
  private apiService = inject(ApiService);
  private authService = inject(AuthService);

  loading = signal<boolean>(true);
  conversaciones = signal<Conversacion[]>([]);
  conversacionSeleccionada = signal<Conversacion | null>(null);
  mensajes = signal<Mensaje[]>([]);
  solicitudesPago = signal<SolicitudPagoItem[]>([]);
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
    this.apiService.get<SolicitudPagoItem[]>('/api/auditor/solicitudes-pago')
      .subscribe({
        next: (data) => this.solicitudesPago.set(Array.isArray(data) ? data : []),
        error: (err) => {
          console.warn('No se cargaron solicitudes de pago para el chat auditor.', err);
          this.solicitudesPago.set([]);
        }
      });
  }

  cargarConversaciones() {
    // Endpoint específico de auditor
    this.apiService.get<Conversacion[]>('/api/auditor/conversaciones')
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
          console.error('Error cargando chats:', err);
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
    this.apiService.get<Mensaje[]>(`/api/auditor/mensajes/${id}`)
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

    this.apiService.post<Mensaje>('/api/auditor/mensajes', payload)
      .subscribe({
        next: (nuevo) => {
          this.mensajes.update(m => [...m, nuevo]);
          this.textoMensaje = '';
          this.shouldScroll = true;
          this.cargarConversaciones(); // Actualizar orden de lista
        }
      });
  }

  scrollToBottom() {
    try {
      this.chatViewport.nativeElement.scrollTop = this.chatViewport.nativeElement.scrollHeight;
    } catch(err) {}
  }

  // Identifica si el mensaje es mío (Auditor)
  esPropio(msg: Mensaje): boolean {
    // Puedes validar por ID específico o por rol
    return msg.emisor_tipo === 'AUDITOR' && msg.emisor_id === this.authService.getIdUsuario();
  }

  esCliente(msg: Mensaje): boolean {
    return msg.emisor_tipo === 'CLIENTE';
  }

  esSupervisor(msg: Mensaje): boolean {
    return msg.emisor_tipo === 'SUPERVISOR';
  }

  esPagoPropio(solicitud: SolicitudPagoItem): boolean {
    return Number((solicitud as any).creado_por_auditor || 0) === Number(this.authService.getIdUsuario());
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
        const mismoCliente = !conv.cliente?.id_usuario || Number(solicitud.id_cliente) === Number(conv.cliente.id_usuario);
        const mismaEmpresaCliente = !conv.cliente?.id_empresa || !solicitud.id_empresa_cliente || Number(solicitud.id_empresa_cliente) === Number(conv.cliente.id_empresa);
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
    if (msg.emisor_tipo === 'AUDITOR' && msg.emisor_id === this.authService.getIdUsuario()) return 'Tú';
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