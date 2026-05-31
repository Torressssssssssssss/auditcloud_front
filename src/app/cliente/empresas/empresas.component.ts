import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';
import { IconComponent } from '../../shared/components/icon/icon.component';

@Component({
  selector: 'app-empresas',
  standalone: true,
  imports: [
    CommonModule, 
    RouterModule, 
    LoadingSpinnerComponent, 
    EmptyStateComponent,
    IconComponent
  ],
  templateUrl: './empresas.component.html',
  styleUrls: ['./empresas.component.css']
})
export class EmpresasComponent implements OnInit {
  private api = inject(ApiService);
  private router = inject(Router);

  empresas = signal<any[]>([]);
  loading = signal<boolean>(true);

  ngOnInit() {
    this.cargarEmpresas();
  }

  cargarEmpresas() {
    this.loading.set(true);
    this.api.get<any[]>('/api/cliente/empresas-auditoras').subscribe({
      next: (data) => {
        this.empresas.set(data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error cargando empresas', err);
        this.loading.set(false);
      }
    });
  }

  contactar(empresa: any) {
    // Redirige al chat pasando datos para iniciar la conversación (virtual o real)
    this.router.navigate(['/cliente/mensajes'], {
      queryParams: { 
        empresa: empresa.id_empresa,
        nombre: empresa.nombre 
      }
    });
  }

  getModuloNombre(id: number): string {
    const nombres: Record<number, string> = { 1: 'Agua', 2: 'Residuos', 3: 'Energía' };
    return nombres[id] || `Módulo ${id}`;
  }
}