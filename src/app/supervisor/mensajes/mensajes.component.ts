import { Component, OnInit, signal, inject, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { ApiService, SolicitudPagoPayload } from '../../services/api.service';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { IconComponent } from '../../shared/components/icon/icon.component';

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
    this.cargarConversaciones();
  }

  ngAfterViewChecked() {
    if (this.shouldScroll) {
      this.scrollToBottom();
      this.shouldScroll = false;
    }
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
}