import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { Conversacion, Mensaje } from '../../models/mensaje.model';
import { SolicitudPago } from '../../models/pago.model';

@Component({
  selector: 'app-mensajes',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    IconComponent
  ],
  templateUrl: './mensajes.component.html',
  styleUrl: './mensajes.component.css'
})
export class MensajesComponent implements OnInit {
  loading = signal<boolean>(true);
  conversaciones = signal<Conversacion[]>([]);
  conversacionSeleccionada = signal<Conversacion | null>(null);
  mensajes = signal<Mensaje[]>([]);
  nuevoMensaje = signal<string>('');
  showSolicitudForm = signal<boolean>(false);
  solicitudForm: FormGroup;

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.solicitudForm = this.fb.group({
      concepto: ['', Validators.required],
      monto: ['', [Validators.required, Validators.min(1)]],
      fecha_expiracion: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.loadConversaciones();
  }

  loadConversaciones(): void {
    this.loading.set(true);
    const idEmpresa = this.authService.getIdEmpresa();
    
    if (!idEmpresa) {
      this.loading.set(false);
      return;
    }

    // Nota: Ajustar endpoint según tu backend
    this.apiService.get<any>(`/api/supervisor/conversaciones/${idEmpresa}`)
      .subscribe({
        next: (response) => {
          const conversaciones = Array.isArray(response) ? response : (response?.data || []);
          this.conversaciones.set(conversaciones);
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error cargando conversaciones:', error);
          this.loading.set(false);
        }
      });
  }

  seleccionarConversacion(conversacion: Conversacion): void {
    this.conversacionSeleccionada.set(conversacion);
    this.cargarMensajes(conversacion.id_conversacion);
  }

  cargarMensajes(idConversacion: number): void {
    // Nota: Ajustar endpoint según tu backend
    this.apiService.get<any>(`/api/supervisor/mensajes/${idConversacion}`)
      .subscribe({
        next: (response) => {
          const mensajes = Array.isArray(response) ? response : (response?.data || []);
          this.mensajes.set(mensajes);
          setTimeout(() => this.scrollToBottom(), 100);
        },
        error: (error) => {
          console.error('Error cargando mensajes:', error);
        }
      });
  }

  enviarMensaje(): void {
    const contenido = this.nuevoMensaje().trim();
    if (!contenido || !this.conversacionSeleccionada()) return;

    const idUsuario = this.authService.getIdUsuario();
    if (!idUsuario) return;

    const mensaje = {
      id_conversacion: this.conversacionSeleccionada()!.id_conversacion,
      id_usuario: idUsuario,
      contenido: contenido,
      tipo: 'TEXTO'
    };

    // Nota: Ajustar endpoint según tu backend
    this.apiService.post<Mensaje>('/api/supervisor/mensajes', mensaje)
      .subscribe({
        next: () => {
          this.nuevoMensaje.set('');
          this.cargarMensajes(this.conversacionSeleccionada()!.id_conversacion);
          this.loadConversaciones();
        },
        error: (error) => {
          console.error('Error enviando mensaje:', error);
        }
      });
  }

  crearSolicitudPago(): void {
    if (this.solicitudForm.invalid || !this.conversacionSeleccionada()) return;

    const idEmpresa = this.authService.getIdEmpresa();
    const idCliente = this.conversacionSeleccionada()!.id_cliente;
    
    if (!idEmpresa || !idCliente) return;

    const solicitud = {
      id_empresa: idEmpresa,
      id_cliente: idCliente,
      monto: +this.solicitudForm.value.monto,
      concepto: this.solicitudForm.value.concepto,
      fecha_expiracion: this.solicitudForm.value.fecha_expiracion
    };

    this.apiService.post<SolicitudPago>('/api/supervisor/solicitudes-pago', solicitud)
      .subscribe({
        next: (solicitudCreada) => {
          // Enviar mensaje con la solicitud
          const idUsuario = this.authService.getIdUsuario();
          if (idUsuario) {
            const mensaje = {
              id_conversacion: this.conversacionSeleccionada()!.id_conversacion,
              id_usuario: idUsuario,
              contenido: `Solicitud de pago: ${solicitudCreada.concepto} - ${this.formatearMonto(solicitudCreada.monto)}`,
              tipo: 'SOLICITUD_PAGO'
            };

            this.apiService.post<Mensaje>('/api/supervisor/mensajes', mensaje)
              .subscribe({
                next: () => {
                  this.showSolicitudForm.set(false);
                  this.solicitudForm.reset();
                  this.cargarMensajes(this.conversacionSeleccionada()!.id_conversacion);
                },
                error: (error) => {
                  console.error('Error enviando mensaje de solicitud:', error);
                }
              });
          }
        },
        error: (error) => {
          console.error('Error creando solicitud:', error);
        }
      });
  }

  scrollToBottom(): void {
    const chatContainer = document.getElementById('chat-messages');
    if (chatContainer) {
      chatContainer.scrollTop = chatContainer.scrollHeight;
    }
  }

  formatearFecha(fecha: string): string {
    const date = new Date(fecha);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutos = Math.floor(diff / 60000);
    
    if (minutos < 1) return 'Ahora';
    if (minutos < 60) return `Hace ${minutos} min`;
    if (minutos < 1440) return `Hace ${Math.floor(minutos / 60)} horas`;
    return date.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
  }

  formatearMonto(monto: number): string {
    return new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(monto);
  }

  esMensajePropio(mensaje: Mensaje): boolean {
    return mensaje.id_usuario === this.authService.getIdUsuario();
  }

  get concepto() { return this.solicitudForm.get('concepto'); }
  get monto() { return this.solicitudForm.get('monto'); }
  get fecha_expiracion() { return this.solicitudForm.get('fecha_expiracion'); }
}
