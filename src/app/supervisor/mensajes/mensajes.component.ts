import { Component, OnInit, signal, inject, ViewChild, ElementRef, AfterViewChecked } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router'; // Necesario para redirigir a Pagos
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
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
  private authService = inject(AuthService);
  private router = inject(Router); // Inyectamos Router

  loading = signal<boolean>(true);
  conversaciones = signal<Conversacion[]>([]);
  conversacionSeleccionada = signal<Conversacion | null>(null);
  mensajes = signal<Mensaje[]>([]);
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

  // --- FUNCIÓN SOLICITADA ---
  irACrearSolicitud() {
    const conv = this.conversacionSeleccionada();
    if (!conv || !conv.cliente) return;

    // Redirige al componente de Pagos del Supervisor
    // Pasamos el ID de la empresa cliente como parámetro opcional (si tu router lo soporta)
    // o simplemente vamos a la página para que él lo llene.
    this.router.navigate(['/supervisor/pagos'], { 
      queryParams: { 
        crear: true, 
        empresa: conv.cliente.id_empresa 
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