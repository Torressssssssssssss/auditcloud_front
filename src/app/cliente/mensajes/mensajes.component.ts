import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterModule, ActivatedRoute } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { IconComponent } from '../../shared/components/icon/icon.component';
import { Conversacion, Mensaje } from '../../models/mensaje.model';
import { SolicitudPago } from '../../models/pago.model';

@Component({
  selector: 'app-cliente-mensajes',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
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
  idEmpresaSeleccionada = signal<number | null>(null);

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) {}

  ngOnInit(): void {
    this.loadConversaciones();
    
    // Verificar si hay parámetro de empresa en la URL
    this.route.queryParams.subscribe(params => {
      if (params['empresa']) {
        this.idEmpresaSeleccionada.set(+params['empresa']);
        this.crearOAbrirConversacion(+params['empresa']);
      }
    });
  }

  loadConversaciones(): void {
    this.loading.set(true);
    const idCliente = this.authService.getIdUsuario();
    
    if (!idCliente) {
      this.loading.set(false);
      return;
    }

    this.apiService.get<any>(`/api/cliente/conversaciones/${idCliente}`)
      .subscribe({
        next: (response) => {
          const conversaciones = Array.isArray(response) ? response : (response?.data || []);
          this.conversaciones.set(conversaciones);
          this.loading.set(false);
          
          // Si hay conversación seleccionada, cargar sus mensajes
          if (this.conversacionSeleccionada()) {
            this.cargarMensajes(this.conversacionSeleccionada()!.id_conversacion);
          }
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
    this.apiService.get<any>(`/api/cliente/mensajes/${idConversacion}`)
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

    const idCliente = this.authService.getIdUsuario();
    if (!idCliente) return;

    const mensaje = {
      id_conversacion: this.conversacionSeleccionada()!.id_conversacion,
      id_usuario: idCliente,
      contenido: contenido,
      tipo: 'TEXTO'
    };

    // Nota: Ajustar endpoint según tu backend
    this.apiService.post<Mensaje>('/api/cliente/mensajes', mensaje)
      .subscribe({
        next: () => {
          this.nuevoMensaje.set('');
          this.cargarMensajes(this.conversacionSeleccionada()!.id_conversacion);
          this.loadConversaciones(); // Actualizar lista
        },
        error: (error) => {
          console.error('Error enviando mensaje:', error);
        }
      });
  }

  crearOAbrirConversacion(idEmpresa: number): void {
    const idCliente = this.authService.getIdUsuario();
    if (!idCliente) return;

    // Buscar si ya existe conversación con esta empresa
    const existente = this.conversaciones().find(c => c.id_empresa_auditora === idEmpresa);
    
    if (existente) {
      this.seleccionarConversacion(existente);
    } else {
      // Crear nueva conversación
      const nuevaConversacion = {
        id_cliente: idCliente,
        id_empresa_auditora: idEmpresa,
        asunto: 'Consulta',
        primer_mensaje: 'Hola, me gustaría obtener más información.'
      };

      this.apiService.post<Conversacion>('/api/cliente/conversaciones', nuevaConversacion)
        .subscribe({
          next: (conversacion) => {
            this.loadConversaciones();
            this.seleccionarConversacion(conversacion);
          },
          error: (error) => {
            console.error('Error creando conversación:', error);
          }
        });
    }
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

  esMensajePropio(mensaje: Mensaje): boolean {
    return mensaje.id_usuario === this.authService.getIdUsuario();
  }

  esSolicitudPago(mensaje: Mensaje): boolean {
    return mensaje.tipo === 'SOLICITUD_PAGO';
  }
}
