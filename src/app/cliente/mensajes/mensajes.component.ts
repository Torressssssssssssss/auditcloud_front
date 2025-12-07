// mensajes.component.ts (Versión Final Cliente)
import { Component, OnInit, signal, inject, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { IconComponent } from '../../shared/components/icon/icon.component';

// Interfaces
interface Mensaje {
  id_mensaje?: number; // Opcional porque al crear localmente no tiene ID aun
  id_conversacion?: number;
  emisor_tipo: 'CLIENTE' | 'SUPERVISOR' | 'AUDITOR';
  emisor_id: number;
  contenido: string;
  creado_en: string;
}

interface Conversacion {
  id_conversacion: number; // 0 si es nueva (virtual)
  id_empresa_auditora: number;
  empresa?: { nombre: string };
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
  textoMensaje = '';
  shouldScroll = false;

  @ViewChild('chatContainer') private chatContainer!: ElementRef;

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
    const idCliente = this.auth.getIdUsuario();
    
    this.api.get<Conversacion[]>(`/api/cliente/conversaciones/${idCliente}`)
      .subscribe({
        next: (data) => {
          const ordenadas = [...data].sort((a, b) => {
            const fechaA = new Date(a.ultimo_mensaje?.creado_en || a.creado_en).getTime();
            const fechaB = new Date(b.ultimo_mensaje?.creado_en || b.creado_en).getTime();
            return fechaB - fechaA;
          });
          this.conversaciones.set(ordenadas);
          this.loading.set(false);
          this.verificarParametrosURL(); // <--- Lógica de "Contactar"
        },
        error: (err) => {
          console.warn('No se cargaron conversaciones previas o hubo error (404 es normal si es nuevo).', err);
          
          // 👇 SOLUCIÓN: Si falla, asumimos que no hay chats y seguimos adelante
          this.conversaciones.set([]); 
          this.loading.set(false);
          this.verificarParametrosURL(); // <--- ¡Ahora esto se ejecutará siempre!
        }
      });
  }

  verificarParametrosURL() {
    // Si venimos de "Contactar" en la lista de empresas
    const params = this.route.snapshot.queryParams;
    const idEmpresa = params['empresa'] ? Number(params['empresa']) : null;
    const nombreEmpresa = params['nombre'];

    if (idEmpresa) {
      // 1. Buscar si ya existe el chat
      const existente = this.conversaciones().find(c => c.id_empresa_auditora === idEmpresa);
      
      if (existente) {
        this.seleccionarConversacion(existente);
      } else {
        // 2. Si no existe, crear chat "Virtual" temporal
        const nuevaVirtual: Conversacion = {
          id_conversacion: 0, // 0 indica que no existe en BD
          id_empresa_auditora: idEmpresa,
          empresa: { nombre: nombreEmpresa || 'Nueva Empresa' },
          creado_en: new Date().toISOString(),
          ultimo_mensaje: {
            emisor_tipo: 'SUPERVISOR',
            emisor_id: 0,
            contenido: '¡Hola! Escribe tu primer mensaje para iniciar el chat.',
            creado_en: new Date().toISOString()
          }
        };
        
        // La agregamos al principio de la lista visualmente
        this.conversaciones.update(lista => [nuevaVirtual, ...lista]);
        this.seleccionarConversacion(nuevaVirtual);
      }
    }
  }

  seleccionarConversacion(conv: Conversacion) {
    this.conversacionSeleccionada.set(conv);
    this.mensajes.set([]); // Limpiar previos
    
    if (conv.id_conversacion !== 0) {
      // Cargar mensajes reales
      this.api.get<any>(`/api/cliente/mensajes/${conv.id_conversacion}`)
        .subscribe(res => {
          const msgs = Array.isArray(res) ? res : res.mensajes || [];
          this.mensajes.set(msgs);
          this.shouldScroll = true;
        });
    } else {
      // Chat nuevo vacío
      this.shouldScroll = true;
    }
  }

  enviarMensaje() {
    if (!this.textoMensaje.trim() || !this.conversacionSeleccionada()) return;

    const convActual = this.conversacionSeleccionada()!;
    const esNueva = convActual.id_conversacion === 0;

    // Payload dinámico
    const payload: any = {
      contenido: this.textoMensaje
    };

    if (esNueva) {
      // Si es nueva, mandamos el ID de la empresa para que el backend la cree
      payload.id_empresa_auditora = convActual.id_empresa_auditora;
    } else {
      // Si ya existe, mandamos el ID de conversación
      payload.id_conversacion = convActual.id_conversacion;
    }

    // Optimistic UI: Mostrar mensaje inmediatamente
    const msgTemp: Mensaje = {
      id_mensaje: Date.now(), // ID temporal
      emisor_tipo: 'CLIENTE',
      emisor_id: this.auth.getIdUsuario()!,
      contenido: this.textoMensaje,
      creado_en: new Date().toISOString()
    };
    this.mensajes.update(m => [...m, msgTemp]);
    this.textoMensaje = '';
    this.shouldScroll = true;

    this.api.post<any>('/api/cliente/mensajes', payload)
      .subscribe({
        next: (resp) => {
          // Si era nueva, ahora ya tiene ID real. Actualizamos todo.
          if (esNueva) {
            this.cargarConversaciones(); // Recargar para obtener el ID real y quitar el 0
          }
        },
        error: (err) => {
          console.error(err);
          alert('Error al enviar mensaje');
        }
      });
  }

  scrollToBottom() {
    try {
      this.chatContainer.nativeElement.scrollTop = this.chatContainer.nativeElement.scrollHeight;
    } catch(err) { }
  }

  // Helpers HTML
  esPropio(msg: Mensaje) { return msg.emisor_tipo === 'CLIENTE'; }
  esSupervisor(msg: Mensaje) { return msg.emisor_tipo === 'SUPERVISOR'; }
  esAuditor(msg: Mensaje) { return msg.emisor_tipo === 'AUDITOR'; }
  esSolicitudPago(msg: Mensaje) { return msg.contenido.includes('Solicitud de Pago'); }
}