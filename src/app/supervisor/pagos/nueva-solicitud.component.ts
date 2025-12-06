import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

// Servicio local para gestionar creación rápida desde este componente
class PaymentServiceLocal {
  constructor(private api: ApiService) {}
  create(payload: any) { return this.api.post<any>('/api/supervisor/solicitudes-pago', payload); }
}

@Component({
  selector: 'app-supervisor-nueva-solicitud',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './nueva-solicitud.component.html',
  styleUrls: ['./nueva-solicitud.component.css']
})
export class NuevaSolicitudComponent {
  id_empresa: number | null = null;
  id_cliente: number | null = null;
  monto: number | null = null;
  concepto = '';
  loading = false;

  private svc: PaymentServiceLocal;

  constructor(private api: ApiService) {
    this.svc = new PaymentServiceLocal(api);
  }

  crear() {
    if (!this.monto || !this.concepto) {
      alert('monto y concepto son obligatorios');
      return;
    }
    const payload: any = { monto: this.monto, concepto: this.concepto };
    if (this.id_empresa) payload.id_empresa = this.id_empresa;
    if (this.id_cliente) payload.id_cliente = this.id_cliente;

    this.loading = true;
    this.svc.create(payload).subscribe({
      next: (res) => {
        alert(res?.message || 'Solicitud creada');
        this.reset();
        this.loading = false;
      },
      error: (err) => {
        console.error(err);
        alert(err?.error?.message || 'Error creando solicitud');
        this.loading = false;
      }
    });
  }

  reset() {
    this.id_empresa = null;
    this.id_cliente = null;
    this.monto = null;
    this.concepto = '';
  }
}
