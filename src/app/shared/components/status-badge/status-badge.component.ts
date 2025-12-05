import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EstadoAuditoria, EstadoPago } from '../../../models/usuario.model';

@Component({
  selector: 'app-status-badge',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './status-badge.component.html',
  styleUrl: './status-badge.component.css'
})
export class StatusBadgeComponent {
  @Input() estado!: number | string;
  @Input() tipo: 'auditoria' | 'pago' = 'auditoria';

  getEstadoInfo(): { texto: string; clase: string } {
    if (this.tipo === 'auditoria') {
      return this.getAuditoriaEstado(this.estado as number);
    } else {
      return this.getPagoEstado(this.estado as number);
    }
  }

  private getAuditoriaEstado(estado: number): { texto: string; clase: string } {
    const estados: Record<number, { texto: string; clase: string }> = {
      1: { texto: 'CREADA', clase: 'estado-creada' },
      2: { texto: 'EN_PROCESO', clase: 'estado-proceso' },
      3: { texto: 'FINALIZADA', clase: 'estado-finalizada' }
    };
    return estados[estado] || { texto: 'DESCONOCIDO', clase: 'estado-desconocido' };
  }

  private getPagoEstado(estado: number): { texto: string; clase: string } {
    const estados: Record<number, { texto: string; clase: string }> = {
      1: { texto: 'PENDIENTE', clase: 'estado-pendiente' },
      2: { texto: 'PAGADA', clase: 'estado-pagada' }
    };
    return estados[estado] || { texto: 'DESCONOCIDO', clase: 'estado-desconocido' };
  }
}







