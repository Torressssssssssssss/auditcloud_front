import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './status-badge.component.html',
  styleUrl: './status-badge.component.css'
})
export class StatusBadgeComponent {
  @Input() estado!: number | string;
  @Input() tipo: 'auditoria' | 'pago' | 'general' = 'auditoria';

  getEstadoInfo(): { texto: string; clase: string } {
    if (this.tipo === 'pago') {
      return this.getPagoEstado(this.estado);
    }

    if (this.tipo === 'auditoria') {
      return this.getAuditoriaEstado(this.estado);
    }

    return this.getGeneralEstado(this.estado);
  }

  formatEstado(estado: number | string): string {
    const raw = String(estado || 'Desconocido').trim().replace(/_/g, ' ').replace(/\s+/g, ' ');
    const normalizado = raw.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');
    const especiales: Record<string, string> = {
      'en proceso': 'En proceso',
      'pendiente asignar auditor': 'Pendiente de asignar auditor',
      'pendiente de asignar auditor': 'Pendiente de asignar auditor',
      'auditor asignado': 'Auditor asignado'
    };

    if (especiales[normalizado]) return especiales[normalizado];
    return raw.charAt(0).toUpperCase() + raw.slice(1).toLowerCase();
  }

  private getAuditoriaEstado(estado: number | string): { texto: string; clase: string } {
    const valor = Number(estado);
    const estados: Record<number, { texto: string; clase: string }> = {
      1: { texto: 'Creada', clase: 'estado-en-revision' },
      2: { texto: 'En proceso', clase: 'estado-proceso' },
      3: { texto: 'Finalizada', clase: 'estado-finalizada' }
    };

    return estados[valor] || this.getGeneralEstado(estado);
  }

  private getPagoEstado(estado: number | string): { texto: string; clase: string } {
    const valor = Number(estado);
    const estados: Record<number, { texto: string; clase: string }> = {
      1: { texto: 'Pendiente', clase: 'estado-pendiente' },
      2: { texto: 'Pagado', clase: 'estado-pagada' }
    };

    return estados[valor] || this.getGeneralEstado(estado);
  }

  private getGeneralEstado(estado: number | string): { texto: string; clase: string } {
    const texto = this.formatEstado(estado);
    const normalizado = texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '');

    if (['pagado', 'pagada', 'aprobado', 'aprobada', 'completado', 'completada', 'finalizado', 'finalizada'].includes(normalizado)) {
      return { texto, clase: 'estado-pagada' };
    }

    if (['pendiente', 'pendiente de pago', 'pendiente de asignar auditor'].includes(normalizado)) {
      return { texto, clase: 'estado-pendiente' };
    }

    if (normalizado === 'auditor asignado') {
      return { texto, clase: 'estado-asignado' };
    }

    if (['rechazado', 'rechazada', 'cancelado', 'cancelada', 'error'].includes(normalizado)) {
      return { texto, clase: 'estado-error' };
    }

    if (['en proceso', 'proceso', 'procesando'].includes(normalizado)) {
      return { texto, clase: 'estado-proceso' };
    }

    if (['en revision', 'revision', 'creada'].includes(normalizado)) {
      return { texto, clase: 'estado-en-revision' };
    }

    return { texto, clase: 'estado-desconocido' };
  }
}
