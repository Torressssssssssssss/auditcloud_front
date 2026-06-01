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

  getModulos(empresa: any): Array<{ key: string; label: string }> {
    const modulos = Array.isArray(empresa?.modulos) ? empresa.modulos : [];

    return modulos.map((modulo: any, index: number) => ({
      key: String(modulo?.id_modulo ?? modulo?.id ?? modulo?.nombre ?? index),
      label: this.getModuloNombre(modulo)
    }));
  }

  getModuloNombre(modulo: any): string {
    if (modulo === null || modulo === undefined) {
      return 'SIN MÓDULO';
    }

    if (typeof modulo === 'number' || typeof modulo === 'string') {
      const nombres: Record<string, string> = {
        '1': 'AGUA',
        '2': 'RESIDUOS',
        '3': 'ENERGIA'
      };
      return nombres[String(modulo)] || `MÓDULO ${modulo}`;
    }

    const nombre = modulo.nombre || modulo.nombre_modulo || modulo.titulo || modulo.label || modulo.descripcion;
    if (nombre) {
      return String(nombre).toUpperCase();
    }

    const id = modulo.id_modulo || modulo.id || modulo.modulo_id;
    if (id) {
      return this.getModuloNombre(id);
    }

    return 'MÓDULO';
  }
}