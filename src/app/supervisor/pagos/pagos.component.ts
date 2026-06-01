import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { SolicitudPagoItem, SolicitudesPagoResponse } from '../../services/api.service';

@Component({
  selector: 'app-supervisor-pagos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './pagos.component.html',
  styleUrls: ['./pagos.component.css']
})
export class PagosComponent implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);

  pagos: SolicitudPagoItem[] = [];
  loading = signal(true);
  page = 1;
  limit = 20;
  total = 0;

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.loading.set(true);
    this.api.listSupervisorSolicitudesPago({ page: this.page, limit: this.limit }).subscribe({
      next: (res) => {
        const response = res as SolicitudesPagoResponse;
        this.pagos = response?.data || [];
        this.total = response?.total || this.pagos.length;
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

  crearDesdeConversacion(): void {
    this.router.navigate(['/supervisor/mensajes']);
  }
}
