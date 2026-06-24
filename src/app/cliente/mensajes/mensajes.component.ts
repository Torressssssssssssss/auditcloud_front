// mensajes.component.ts (Cliente)
import { Component, OnInit, signal, inject, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { SolicitudPago } from '../../models/pago.model';

type EmisorTipo = 'CLIENTE' | 'SUPERVISOR' | 'AUDITOR';
type ChatItem =
  | { tipo: 'mensaje'; id: string; fecha: string; mensaje: Mensaje }
  | { tipo: 'pago'; id: string; fecha: string; solicitud: SolicitudPago };

interface Mensaje {
  id_mensaje?: number;
  id_conversacion?: number;
  emisor_tipo: EmisorTipo;
  emisor_id: number;
  contenido: string;
  creado_en: string;
  remitente_nombre?: string;
}

interface Conversacion {
  id_conversacion: number;
  id_cliente?: number;
  id_empresa_auditora: number;
  empresa?: { nombre: string };
  nombre_contacto?: string;
  rol_contacto?: string;
  ultimo_mensaje?: Mensaje;
  creado_en: string;
}

@Component({
  selector: 'app-cliente-mensajes',
  standalone: true,
  imports: [CommonModule, RouterModule, FormsModule, LoadingSpinnerComponent, EmptyStateComponent, IconComponent],
  templateUrl: './mensajes.component.html',
  styleUrls: ['./mensajes.component.css']
})
export class MensajesComponent implements OnInit, AfterViewChecked {
  private api = inject(ApiService);
  private auth = inject(AuthService);
  private route = inject(ActivatedRoute);

  loading = signal<boolean>(true);
  conversaciones = signal<Conversacion[]>([]);
  conversacionSeleccionada = signal<Conversacion | null>(null);
  mensajes = signal<Mensaje[]>([]);
  solicitudesPago = signal<SolicitudPago[]>([]);
  textoMensaje = '';
  shouldScroll = false;

  @ViewChild('chatContainer') private chatContainer!: ElementRef;

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

  cargarConversaciones() {
    const idCliente = this.auth.getIdUsuario();
    
    this.api.get<any>(`/api/cliente/conversaciones/${idCliente}`)
      .subscribe({
        next: (data) => {
          const conversaciones = Array.isArray(data) ? data : (data?.data || []);
          const ordenadas = conversaciones
            .map((conv: any) => this.normalizarConversacion(conv))
            .sort((a: Conversacion, b: Conversacion) => {
              const fechaA = new Date(a.ultimo_mensaje?.creado_en || a.creado_en).getTime();
              const fechaB = new Date(b.ultimo_mensaje?.creado_en || b.creado_en).getTime();
              return fechaB - fechaA;
            });
          this.conversaciones.set(ordenadas);
          this.loading.set(false);
          this.verificarParametrosURL();
        },
        error: (err) => {
          console.warn('No se cargaron conversaciones previas o hubo error (404 es normal si es nuevo).', err);
          this.conversaciones.set([]); 
          this.loading.set(false);
          this.verificarParametrosURL();
        }
      });
  }

  cargarSolicitudesPago() {
    const idCliente = this.auth.getIdUsuario();
    if (!idCliente) return;

    this.api.get<any>(`/api/cliente/solicitudes-pago/${idCliente}`)
      .subscribe({
        next: (response) => {
          const solicitudes = Array.isArray(response) ? response : (response?.data || []);
          this.solicitudesPago.set(Array.isArray(solicitudes) ? solicitudes : []);
        },
        error: (err) => {
          console.warn('No se cargaron solicitudes de pago para el chat.', err);
          this.solicitudesPago.set([]);
        }
      });
  }

  verificarParametrosURL() {
    const params = this.route.snapshot.queryParams;
    const idEmpresa = params['empresa'] ? Number(params['empresa']) : null;
    const nombreEmpresa = params['nombre'];

    if (idEmpresa) {
      const existente = this.conversaciones().find(c => c.id_empresa_auditora === idEmpresa);
      
      if (existente) {
        this.seleccionarConversacion(existente);
      } else {
        const nuevaVirtual: Conversacion = {
          id_conversacion: 0,
          id_empresa_auditora: idEmpresa,
          empresa: { nombre: nombreEmpresa || 'Nueva Empresa' },
          creado_en: new Date().toISOString(),
          ultimo_mensaje: {
            emisor_tipo: 'SUPERVISOR',
            emisor_id: 0,
            contenido: 'Escribe tu primer mensaje para iniciar el chat.',
            creado_en: new Date().toISOString()
          }
        };
        this.conversaciones.update(lista => [nuevaVirtual, ...lista]);
        this.seleccionarConversacion(nuevaVirtual);
      }
    }
  }

  seleccionarConversacion(conv: Conversacion) {
    this.conversacionSeleccionada.set(conv);
    this.mensajes.set([]);
    
    if (conv.id_conversacion !== 0) {
      this.api.get<any>(`/api/cliente/mensajes/${conv.id_conversacion}`)
        .subscribe(res => {
          const msgs = Array.isArray(res) ? res : (res?.mensajes || []);
          this.mensajes.set(msgs.map((msg: any) => this.normalizarMensaje(msg)));
          this.shouldScroll = true;
        });
    } else {
      this.shouldScroll = true;
    }
  }

  enviarMensaje() {
    if (!this.textoMensaje.trim() || !this.conversacionSeleccionada()) return;

    const convActual = this.conversacionSeleccionada()!;
    const esNueva = convActual.id_conversacion === 0;
    const contenido = this.textoMensaje.trim();
    const payload: any = { contenido };

    if (esNueva) {
      payload.id_empresa_auditora = convActual.id_empresa_auditora;
    } else {
      payload.id_conversacion = convActual.id_conversacion;
    }

    const msgTemp: Mensaje = {
      id_mensaje: Date.now(),
      emisor_tipo: 'CLIENTE',
      emisor_id: this.auth.getIdUsuario()!,
      contenido,
      creado_en: new Date().toISOString(),
      remitente_nombre: 'Tú'
    };
    this.mensajes.update(m => [...m, msgTemp]);
    this.actualizarPreviewConversacion(convActual.id_conversacion, msgTemp);
    this.textoMensaje = '';
    this.shouldScroll = true;

    this.api.post<any>('/api/cliente/mensajes', payload)
      .subscribe({
        next: () => {
          if (esNueva) {
            this.cargarConversaciones();
          }
        },
        error: (err) => {
          console.error(err);
          alert('Error al enviar mensaje');
        }
      });
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

  solicitudesChat(): SolicitudPago[] {
    const conv = this.conversacionSeleccionada();
    const idCliente = this.auth.getIdUsuario();
    if (!conv || conv.id_conversacion === 0 || !idCliente) return [];

    const idsVistos = new Set<number>();
    return this.solicitudesPago()
      .filter((solicitud) => {
        const mismoCliente = Number(solicitud.id_cliente) === Number(idCliente);
        const mismaAuditora = Number((solicitud as any).id_empresa_auditora || solicitud.id_empresa) === Number(conv.id_empresa_auditora);
        return mismoCliente && mismaAuditora;
      })
      .filter((solicitud) => {
        if (idsVistos.has(solicitud.id_solicitud)) return false;
        idsVistos.add(solicitud.id_solicitud);
        return true;
      });
  }

  scrollToBottom() {
    try {
      this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
    } catch(err) { }
  }

  esPropio(msg: Mensaje) {
    return msg.emisor_tipo === 'CLIENTE' && (!msg.emisor_id || msg.emisor_id === this.auth.getIdUsuario());
  }

  esPagoPropio(solicitud: SolicitudPago): boolean {
    return Number((solicitud as any).creado_por_cliente || 0) === Number(this.auth.getIdUsuario());
  }

  nombreRemitente(msg: Mensaje) {
    if (this.esPropio(msg)) return 'Tú';
    return msg.remitente_nombre || this.conversacionSeleccionada()?.nombre_contacto || this.nombrePorRol(msg.emisor_tipo);
  }

  previewRemitente(conv: Conversacion): string {
    const msg = conv.ultimo_mensaje;
    if (!msg) return 'Sistema';
    if (this.esMensajeDeUsuarioActual(msg)) return 'Tú';
    return msg.remitente_nombre || conv.nombre_contacto || this.nombrePorRol(msg.emisor_tipo);
  }

  previewContenido(conv: Conversacion): string {
    return conv.ultimo_mensaje?.contenido || 'Nueva conversación';
  }

  previewFecha(conv: Conversacion): string {
    return conv.ultimo_mensaje?.creado_en || conv.creado_en;
  }

  estadoPagoTexto(solicitud: SolicitudPago): string {
    const estado = Number(solicitud.id_estado);
    if (estado === 2 || solicitud.pagada_en || (solicitud as any).mercadopago_status === 'approved') return 'Pagado';
    if (estado === 3) return 'Rechazado';
    if (estado === 4) return 'En proceso';
    return 'Pendiente';
  }

  estadoPagoClase(solicitud: SolicitudPago): string {
    const estado = this.estadoPagoTexto(solicitud).toLowerCase().replace(' ', '-');
    return `payment-status ${estado}`;
  }

  puedePagar(solicitud: SolicitudPago): boolean {
    return this.estadoPagoTexto(solicitud) === 'Pendiente';
  }

  formatoMonto(monto: number | string): string {
    const valor = Number(monto || 0);
    return valor.toLocaleString('es-MX', { style: 'currency', currency: 'MXN' });
  }

  private normalizarConversacion(raw: any): Conversacion {
    return {
      ...raw,
      creado_en: raw.creado_en || raw.fecha_creacion || new Date().toISOString(),
      ultimo_mensaje: raw.ultimo_mensaje ? this.normalizarMensaje(raw.ultimo_mensaje) : undefined
    };
  }

  private normalizarMensaje(raw: any): Mensaje {
    const tipo = (raw.emisor_tipo || raw.tipo_remitente || raw.tipo || 'SUPERVISOR') as EmisorTipo;
    return {
      id_mensaje: raw.id_mensaje,
      id_conversacion: raw.id_conversacion,
      emisor_tipo: tipo,
      emisor_id: Number(raw.emisor_id ?? raw.id_remitente ?? raw.id_usuario ?? 0),
      contenido: raw.contenido || '',
      creado_en: raw.creado_en || raw.fecha_envio || raw.fecha || new Date().toISOString(),
      remitente_nombre: raw.remitente_nombre || raw.nombre_remitente || raw.usuario?.nombre
    };
  }

  private actualizarPreviewConversacion(idConversacion: number, mensaje: Mensaje) {
    if (!idConversacion) return;
    this.conversaciones.update(lista => lista.map(conv =>
      conv.id_conversacion === idConversacion ? { ...conv, ultimo_mensaje: mensaje } : conv
    ));
  }

  private esMensajeDeUsuarioActual(msg: Mensaje): boolean {
    return msg.emisor_tipo === 'CLIENTE' && (!msg.emisor_id || msg.emisor_id === this.auth.getIdUsuario());
  }

  private nombrePorRol(tipo?: EmisorTipo): string {
    if (tipo === 'AUDITOR') return 'Auditora Demo';
    if (tipo === 'SUPERVISOR') return 'Supervisor';
    if (tipo === 'CLIENTE') return 'Cliente Demo';
    return 'Usuario';
  }

  private timeValue(fecha?: string): number {
    const value = fecha ? new Date(fecha).getTime() : 0;
    return Number.isNaN(value) ? 0 : value;
  }
}
