import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { ApiService } from '../../../services/api.service';

interface Mensaje {
  id_mensaje: number;
  id_conversacion: number;
  remitente: 'CLIENTE' | 'SUPERVISOR' | string;
  contenido: string;
  fecha_envio: string;
}

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="mensajes-page">
      <div class="mensajes-container card-xl">
        <div class="chat-header">
          <h3>Conversación</h3>
        </div>

        <div id="chat-messages" class="chat-messages" style="min-height:300px; max-height:55vh; overflow:auto;">
          @for (m of mensajes(); track m.id_mensaje) {
            <div class="chat-message" [class.me]="m.remitente === 'CLIENTE'" [class.them]="m.remitente !== 'CLIENTE'">
              <div class="bubble">{{ m.contenido }}</div>
              <div class="time">{{ formatDate(m.fecha_envio) }}</div>
            </div>
          }
          @empty {
            <div class="chat-empty">Selecciona o envía un mensaje para comenzar</div>
          }
        </div>

        <div class="chat-input">
          <input type="text" placeholder="Escribe un mensaje..." [(ngModel)]="nuevoMensaje" />
          <button class="btn btn-grad" (click)="enviar()" [disabled]="enviando() || !nuevoMensaje.trim()">Enviar</button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .chat-message { display:flex; flex-direction:column; gap:4px; margin: 8px 0; }
    .chat-message.me { align-items: flex-end; }
    .chat-message.them { align-items: flex-start; }
    .bubble { max-width: 70%; padding: 10px 12px; border-radius: 12px; background: var(--bg-tertiary); color: var(--text-primary); }
    .chat-message.me .bubble { background: #4f46e5; color: #fff; }
    .time { font-size: 0.75rem; color: var(--text-secondary); }
    .chat-input { display:flex; gap: 0.5rem; margin-top: 1rem; }
    .chat-input input { flex:1; padding: 0.75rem; border: 1px solid var(--border-color); border-radius: var(--radius-sm); background: var(--bg-secondary); color: var(--text-primary); }
  `]
})
export class ChatComponent implements OnInit {
  mensajes = signal<Mensaje[]>([]);
  nuevoMensaje = '';
  enviando = signal<boolean>(false);
  idConversacion!: number;

  constructor(private route: ActivatedRoute, private api: ApiService) {}

  ngOnInit(): void {
    this.route.paramMap.subscribe(params => {
      const id = params.get('id');
      this.idConversacion = id ? +id : 0;
      if (this.idConversacion) {
        this.cargarMensajes();
      }
    });
  }

  cargarMensajes(): void {
    this.api.get<any>(`/api/cliente/mensajes/${this.idConversacion}`).subscribe({
      next: (resp) => {
        const mensajes = Array.isArray(resp) ? resp : (resp?.data || []);
        this.mensajes.set(mensajes);
        queueMicrotask(() => this.scrollBottom());
      },
      error: (err) => console.error('Error cargando mensajes:', err)
    });
  }

  enviar(): void {
    if (!this.nuevoMensaje.trim() || !this.idConversacion) return;
    this.enviando.set(true);
    const payload = {
      id_conversacion: this.idConversacion,
      contenido: this.nuevoMensaje.trim(),
      remitente: 'CLIENTE'
    };
    this.api.post<Mensaje>('/api/cliente/mensajes', payload).subscribe({
      next: () => {
        this.nuevoMensaje = '';
        this.cargarMensajes();
        this.enviando.set(false);
      },
      error: (err) => { console.error('Error enviando mensaje:', err); this.enviando.set(false); }
    });
  }

  formatDate(d: string): string {
    try { return new Date(d).toLocaleString(); } catch { return d; }
  }

  private scrollBottom(): void {
    const el = document.getElementById('chat-messages');
    if (el) el.scrollTop = el.scrollHeight;
  }
}








