import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { RouterModule } from '@angular/router';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { IconComponent } from '../../shared/components/icon/icon.component';

// Interfaz basada en la respuesta del backend
interface ClienteEmpresa {
  id_empresa: number;
  nombre: string;
  ciudad: string | null;
  pais: string | null;
  contacto: string; // Nombre del usuario cliente
  total_auditorias: number;
  activo: boolean;
}

@Component({
  selector: 'app-supervisor-clientes',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    LoadingSpinnerComponent, 
    EmptyStateComponent,
    IconComponent
  ],
  templateUrl: './clientes.components.html',
  styleUrls: ['./clientes.components.css']
})
export class ClientesComponent implements OnInit {
  private http = inject(HttpClient);

  clientes = signal<ClienteEmpresa[]>([]);
  loading = signal<boolean>(true);

  ngOnInit() {
    this.cargarClientes();
  }

  cargarClientes() {
    this.loading.set(true);
    const token = localStorage.getItem('auditcloud_token');

    if (!token) return;

    const headers = new HttpHeaders({ 'Authorization': `Bearer ${token}` });

    this.http.get<ClienteEmpresa[]>('http://localhost:3000/api/supervisor/clientes-con-auditorias', { headers })
      .subscribe({
        next: (data) => {
          this.clientes.set(data);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error cargando clientes', err);
          this.loading.set(false);
        }
      });
  }
}