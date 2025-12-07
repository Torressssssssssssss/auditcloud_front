import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { NotificacionesService, Notificacion } from '../../../services/notificaciones.service';
import { IconComponent, IconName } from '../icon/icon.component';

@Component({
  selector: 'app-notificaciones',
  standalone: true,
  imports: [CommonModule, DatePipe, RouterModule, IconComponent],
  templateUrl: './notificaciones.component.html',
  styleUrl: './notificaciones.component.css'
})
export class NotificacionesComponent implements OnInit {
  mostrarDropdown = signal<boolean>(false);
  
  // Usar computed para obtener los valores reactivos del servicio
  notificaciones = computed(() => this.notificacionesService.getNotificaciones());
  noLeidas = computed(() => this.notificacionesService.getNoLeidas());

  constructor(
    private notificacionesService: NotificacionesService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.notificacionesService.cargarNotificaciones();
  }

  toggleDropdown(): void {
    this.mostrarDropdown.update(v => !v);
  }

  cerrarDropdown(): void {
    this.mostrarDropdown.set(false);
  }

  marcarComoLeida(notificacion: Notificacion, event: Event): void {
    event.stopPropagation();
    if (!notificacion.leida) {
      this.notificacionesService.marcarComoLeida(notificacion.id_notificacion);
    }
  }

  marcarTodasComoLeidas(): void {
    this.notificacionesService.marcarTodasComoLeidas();
  }

  getIconoTipo(tipo: string): IconName {
    const iconos: Record<string, IconName> = {
      'evidencia_subida': 'file',
      'estado_cambiado': 'refresh',
      'reporte_subido': 'document',
      'mensaje_nuevo': 'chat'
    };
    return iconos[tipo] || 'bell';
  }

  getColorTipo(tipo: string): string {
    const colores: Record<string, string> = {
      'evidencia_subida': 'var(--color-info)',
      'estado_cambiado': 'var(--color-warning)',
      'reporte_subido': 'var(--color-success)',
      'mensaje_nuevo': 'var(--color-primary)'
    };
    return colores[tipo] || 'var(--text-secondary)';
  }

  getRutaNotificacion(notificacion: Notificacion): string | null {
    // Si es mensaje nuevo, redirigir a mensajes con query param de conversación o empresa
    if (notificacion.tipo === 'mensaje_nuevo') {
      // Si la notificación tiene id_conversacion o id_empresa, usarlo
      const idConversacion = (notificacion as any).id_conversacion;
      const idEmpresa = (notificacion as any).id_empresa_auditora;
      
      if (idConversacion) {
        return `/cliente/mensajes?conversacion=${idConversacion}`;
      } else if (idEmpresa) {
        return `/cliente/mensajes?empresa=${idEmpresa}`;
      } else {
        return '/cliente/mensajes';
      }
    }
    
    if (notificacion.id_auditoria) {
      return `/cliente/auditorias/${notificacion.id_auditoria}`;
    }
    
    return '/cliente/dashboard';
  }

  navegarANotificacion(notificacion: Notificacion): void {
    const ruta = this.getRutaNotificacion(notificacion);
    if (ruta) {
      this.router.navigateByUrl(ruta);
      this.cerrarDropdown();
    }
  }
}

