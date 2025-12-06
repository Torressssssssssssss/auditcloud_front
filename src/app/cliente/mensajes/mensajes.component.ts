import { Component, OnInit, signal, inject, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms'; // Necesario para ngModel
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { IconComponent } from '../../shared/components/icon/icon.component';

// Interfaces
interface Mensaje {
  id_mensaje: number;
  id_conversacion: number;
  emisor_tipo: 'CLIENTE' | 'SUPERVISOR' | 'AUDITOR';
  emisor_id: number;
  contenido: string;
  fecha_envio?: string; // Mapeo de creado_en
  creado_en: string;
}

interface Conversacion {
  id_conversacion: number;
  empresa?: { nombre: string };
  ultimo_mensaje?: Mensaje;
  id_empresa_auditora: number;
  creado_en: string;
}

@Component({
  selector: 'app-cliente-mensajes',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    FormsModule, 
    LoadingSpinnerComponent, 
    EmptyStateComponent,
    IconComponent
  ],
  templateUrl: './mensajes.component.html',
  styleUrls: ['./mensajes.component.css']
})
export class MensajesComponent implements OnInit, AfterViewChecked {
  private apiService = inject(ApiService);
  private authService = inject(AuthService);
  private route = inject(ActivatedRoute);

  // Estados
  loading = signal<boolean>(true);
  conversaciones = signal<Conversacion[]>([]);
  conversacionSeleccionada = signal<Conversacion | null>(null);
  mensajes = signal<Mensaje[]>([]);
  textoMensaje = '';
  shouldScrollToBottom = false;

  @ViewChild('chatContainer') private chatContainer!: ElementRef;

  ngOnInit(): void {
    this.cargarConversaciones();
  }

  ngAfterViewChecked() {
    // Auto-scroll cuando llegan mensajes nuevos
    if (this.shouldScrollToBottom) {
      this.scrollToBottom();
      this.shouldScrollToBottom = false;
    }
  }

  cargarConversaciones() {
    const idCliente = this.authService.getIdUsuario();
    this.apiService.get<Conversacion[]>(`/api/cliente/conversaciones/${idCliente}`)
      .subscribe({
        next: (data) => {
          const ordenadas = [...data].sort((a, b) => {
            const fechaA = new Date(a.ultimo_mensaje?.creado_en || a.creado_en).getTime();
            const fechaB = new Date(b.ultimo_mensaje?.creado_en || b.creado_en).getTime();
            return fechaB - fechaA;
          });
          this.conversaciones.set(ordenadas);
          this.loading.set(false);
          
          // Verificar parámetros URL para abrir chat específico
          const params = this.route.snapshot.queryParams;
          if (params['empresa'] && !this.conversacionSeleccionada()) {
             this.buscarOCrearChat(+params['empresa']);
          }
        },
        error: (err) => {
          console.error(err);
          this.loading.set(false);
        }
      });
  }

  seleccionarConversacion(conv: Conversacion) {
    this.conversacionSeleccionada.set(conv);
    this.shouldScrollToBottom = true;
    this.cargarMensajes(conv.id_conversacion);
  }

  cargarMensajes(idConversacion: number) {
    this.apiService.get<Mensaje[]>(`/api/cliente/mensajes/${idConversacion}`)
      .subscribe({
        next: (msgs) => {
          const ordenados = [...msgs].sort((a, b) => new Date(a.creado_en).getTime() - new Date(b.creado_en).getTime());
          this.mensajes.set(ordenados);
          this.shouldScrollToBottom = true;
          setTimeout(() => this.scrollToBottom(), 0);
        }
      });
  }

  enviarMensaje() {
    if (!this.textoMensaje.trim() || !this.conversacionSeleccionada()) return;

    const payload = {
      id_conversacion: this.conversacionSeleccionada()!.id_conversacion,
      contenido: this.textoMensaje
    };

    this.apiService.post<Mensaje>('/api/cliente/mensajes', payload)
      .subscribe({
        next: (nuevoMsg) => {
          this.mensajes.update(msgs => [...msgs, nuevoMsg]);
          this.textoMensaje = '';
          this.shouldScrollToBottom = true;

          // 2. Actualizar lista de la izquierda (Mover conversación al inicio)
          this.cargarConversaciones(); 
        },
        error: (err) => console.error('Error envío', err)
      });
  }

  buscarOCrearChat(idEmpresa: number) {
    // Buscar en locales
    const existente = this.conversaciones().find(c => c.id_empresa_auditora === idEmpresa);
    if (existente) {
      this.seleccionarConversacion(existente);
    } else {
      // Crear nueva conversación
      const idCliente = this.authService.getIdUsuario();
      const payload = {
        id_empresa_auditora: idEmpresa,
        id_cliente: idCliente
      };  
    }
  }

  scrollToBottom(): void {
    try {
      this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
    } catch(err) { }
  }

  esPropio(msg: Mensaje): boolean {
    return msg.emisor_tipo === 'CLIENTE';
  }

  esSupervisor(msg: Mensaje): boolean {
    return msg.emisor_tipo === 'SUPERVISOR';
  }

  esAuditor(msg: Mensaje): boolean {
    return msg.emisor_tipo === 'AUDITOR';
  }

  esSolicitudPago(msg: Mensaje): boolean {
    // Detectar si el mensaje es una notificación automática de pago
    // (Puedes ajustar esta lógica según cómo guardes las notificaciones en el backend)
    return msg.contenido.includes('Solicitud de Pago'); 
  }
}