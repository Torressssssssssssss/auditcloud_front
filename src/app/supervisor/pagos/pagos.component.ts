import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { NuevaSolicitudComponent } from './nueva-solicitud.component';

// Service local para manejar llamadas relacionadas con pagos (está definido aquí por petición)
class PaymentService {
  constructor(private api: ApiService) {}

  // Obtener listados paginados de solicitudes asociadas a la empresa auditora
  list(params?: { page?: number; limit?: number }) {
    const q: any = {};
    if (params?.page) q.page = params.page;
    if (params?.limit) q.limit = params.limit;
    return this.api.get<any>('/api/supervisor/solicitudes-pago', q);
  }

  // Crear solicitud por parte del supervisor
  create(payload: any) {
    return this.api.post<any>('/api/supervisor/solicitudes-pago', payload);
  }
}

@Component({
  selector: 'app-supervisor-pagos',
  standalone: true,
  imports: [CommonModule, FormsModule, NuevaSolicitudComponent],
  templateUrl: './pagos.component.html',
  styleUrls: ['./pagos.component.css']
})
export class PagosComponent implements OnInit {
  pagos: any[] = [];
  loading = false;
  page = 1;
  limit = 20;
  total = 0;
  mostrarFormulario = signal(false);
  private paymentService: PaymentService;

  constructor(private api: ApiService, private auth: AuthService) {
    this.paymentService = new PaymentService(api);
  }

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading = true;
    this.paymentService.list({ page: this.page, limit: this.limit }).subscribe({
      next: (res) => {
        // El backend devuelve { total, page, limit, data }
        if (res && res.data) {
          this.pagos = res.data;
          this.total = res.total || res.data.length;
        } else if (Array.isArray(res)) {
          // Fallback si la ruta devuelve un array
          this.pagos = res;
          this.total = res.length;
        } else {
          this.pagos = [];
          this.total = 0;
        }
        this.loading = false;
      },
      error: (err) => {
        console.error('Error cargando pagos', err);
        this.loading = false;
      }
    });
  }

  nextPage(): void {
    if ((this.page * this.limit) < this.total) {
      this.page++;
      this.load();
    }
  }

  prevPage(): void {
    if (this.page > 1) {
      this.page--;
      this.load();
    }
  }

  // Abre el formulario de crear — para simplicidad, vamos a mostrar prompt
  crearSolicitud(): void {
    const idEmpresa = prompt('ID de la empresa cliente (id_empresa)');
    const idCliente = prompt('ID del usuario cliente (opcional, deja vacío para usar usuario principal)');
    const monto = prompt('Monto');
    const concepto = prompt('Concepto');
    if (!monto || !concepto) {
      alert('monto y concepto son obligatorios');
      return;
    }

    const payload: any = { monto: Number(monto), concepto };
    if (idEmpresa) payload.id_empresa = Number(idEmpresa);
    if (idCliente) payload.id_cliente = Number(idCliente);

    this.paymentService.create(payload).subscribe({
      next: (res) => {
        alert(res?.message || 'Solicitud creada');
        this.load();
      },
      error: (err) => {
        console.error('Error creando solicitud', err);
        alert(err?.error?.message || 'Error creando solicitud');
      }
    });
  }
}
