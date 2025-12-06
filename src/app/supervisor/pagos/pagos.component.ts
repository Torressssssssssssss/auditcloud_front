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
  loading = signal(true);
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
    this.loading.set(true);
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
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error cargando pagos', err);
        this.pagos = [];
        this.total = 0;
        this.loading.set(false);
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

  // Callback cuando solicitud se crea exitosamente
  onSolicitudCreada(): void {
    this.mostrarFormulario.set(false);
    this.load();
  }
}
