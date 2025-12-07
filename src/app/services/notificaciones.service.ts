import { Injectable, signal } from '@angular/core';
import { Observable, interval } from 'rxjs';
import { ApiService } from './api.service';
import { AuthService } from './auth.service';

export interface Notificacion {
  id_notificacion: number;
  id_cliente: number;
  id_auditoria?: number;
  id_conversacion?: number; // Para notificaciones de tipo mensaje_nuevo
  id_empresa_auditora?: number; // Para notificaciones de tipo mensaje_nuevo
  tipo: 'evidencia_subida' | 'estado_cambiado' | 'reporte_subido' | 'mensaje_nuevo';
  titulo: string;
  mensaje: string;
  fecha: string;
  leida: boolean;
  auditoria?: {
    id_auditoria: number;
    empresa?: {
      nombre: string;
    };
  };
}

@Injectable({
  providedIn: 'root'
})
export class NotificacionesService {
  private notificaciones = signal<Notificacion[]>([]);
  private noLeidas = signal<number>(0);
  
  // Exponer signals para que los componentes puedan suscribirse
  readonly notificaciones$ = this.notificaciones.asReadonly();
  readonly noLeidas$ = this.noLeidas.asReadonly();
  
  // Métodos para obtener valores (para compatibilidad)
  getNotificaciones(): Notificacion[] {
    return this.notificaciones();
  }
  
  getNoLeidas(): number {
    return this.noLeidas();
  }

  constructor(
    private apiService: ApiService,
    private authService: AuthService
  ) {
    // Cargar notificaciones al inicializar
    this.cargarNotificaciones();
    
    // Actualizar cada 30 segundos (opcional, para tiempo real)
    interval(30000).subscribe(() => {
      if (this.authService.getRol() === 3) { // Solo para clientes
        this.cargarNotificaciones();
      }
    });
  }

  cargarNotificaciones(): void {
    const idCliente = this.authService.getIdUsuario();
    if (!idCliente || this.authService.getRol() !== 3) {
      return;
    }

    // Endpoint: GET /api/cliente/notificaciones/:idCliente
    this.apiService.get<Notificacion[] | { data: Notificacion[] }>(`/api/cliente/notificaciones/${idCliente}`)
      .subscribe({
        next: (response) => {
          const notifs = Array.isArray(response) ? response : ((response as { data: Notificacion[] })?.data || []);
          this.notificaciones.set(notifs);
          this.noLeidas.set(notifs.filter((n: Notificacion) => !n.leida).length);
        },
        error: (error) => {
          console.error('Error cargando notificaciones:', error);
          // Si el endpoint no existe aún, usar datos de ejemplo
          this.notificaciones.set([]);
          this.noLeidas.set(0);
        }
      });
  }

  marcarComoLeida(idNotificacion: number): void {
    // Endpoint: PUT /api/cliente/notificaciones/:idNotificacion/leer
    this.apiService.put(`/api/cliente/notificaciones/${idNotificacion}/leer`, {})
      .subscribe({
        next: () => {
          const notifs = this.notificaciones();
          const index = notifs.findIndex((n: Notificacion) => n.id_notificacion === idNotificacion);
          if (index !== -1) {
            notifs[index].leida = true;
            this.notificaciones.set([...notifs]);
            this.noLeidas.set(notifs.filter((n: Notificacion) => !n.leida).length);
          }
        },
        error: (error) => {
          console.error('Error marcando notificación como leída:', error);
        }
      });
  }

  marcarTodasComoLeidas(): void {
    const idCliente = this.authService.getIdUsuario();
    if (!idCliente) return;

    // Endpoint: PUT /api/cliente/notificaciones/:idCliente/leer-todas
    this.apiService.put(`/api/cliente/notificaciones/${idCliente}/leer-todas`, {})
      .subscribe({
        next: () => {
          const notifs = this.notificaciones().map(n => ({ ...n, leida: true }));
          this.notificaciones.set(notifs);
          this.noLeidas.set(0);
        },
        error: (error) => {
          console.error('Error marcando todas como leídas:', error);
        }
      });
  }
}

