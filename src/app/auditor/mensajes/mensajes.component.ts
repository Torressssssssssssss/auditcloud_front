import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { Conversacion, Mensaje } from '../../models/mensaje.model';

@Component({
  selector: 'app-auditor-mensajes',
  standalone: true,
  imports: [
    CommonModule,
    LoadingSpinnerComponent,
    EmptyStateComponent
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

  constructor(
    private apiService: ApiService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.loadConversaciones();
  }

  loadConversaciones(): void {
    this.loading.set(true);
    const idAuditor = this.authService.getIdUsuario();
    if (!idAuditor) { this.loading.set(false); return; }

    this.apiService.get<any>(`/api/auditor/conversaciones/${idAuditor}`)
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
    this.apiService.get<any>(`/api/auditor/mensajes/${idConversacion}`)
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

    const idAuditor = this.authService.getIdUsuario();
    if (!idAuditor) return;

    const mensaje = {
      id_conversacion: this.conversacionSeleccionada()!.id_conversacion,
      id_usuario: idAuditor,
      contenido: contenido,
      tipo: 'TEXTO'
    };

    this.apiService.post<Mensaje>('/api/auditor/mensajes', mensaje)
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
}








