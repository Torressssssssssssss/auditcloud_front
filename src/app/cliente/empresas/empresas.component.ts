import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { ApiService } from '../../services/api.service';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../shared/components/empty-state/empty-state.component';

interface EmpresaAuditora {
  id_empresa: number;
  nombre: string;
  pais?: string;
  estado?: string;
  modulos?: number[];
}

@Component({
  selector: 'app-empresas',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LoadingSpinnerComponent,
    EmptyStateComponent
  ],
  templateUrl: './empresas.component.html',
  styleUrl: './empresas.component.css'
})
export class EmpresasComponent implements OnInit {
  loading = signal<boolean>(true);
  empresas = signal<EmpresaAuditora[]>([]);
  filtroPais = signal<string>('');
  modulosSeleccionados = signal<number[]>([]);

  constructor(private apiService: ApiService) {}

  ngOnInit(): void {
    this.loadEmpresas();
  }

  loadEmpresas(): void {
    this.loading.set(true);
    // Nota: Ajustar endpoint según tu backend
    this.apiService.get<any>('/api/cliente/empresas-auditoras')
      .subscribe({
        next: (response) => {
          const empresas = Array.isArray(response) ? response : (response?.data || []);
          this.empresas.set(empresas);
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error cargando empresas:', error);
          this.loading.set(false);
        }
      });
  }

  toggleModulo(modulo: number): void {
    const actuales = this.modulosSeleccionados();
    if (actuales.includes(modulo)) {
      this.modulosSeleccionados.set(actuales.filter(m => m !== modulo));
    } else {
      this.modulosSeleccionados.set([...actuales, modulo]);
    }
  }

  get empresasFiltradas(): EmpresaAuditora[] {
    let result = this.empresas();
    
    if (this.filtroPais()) {
      const search = this.filtroPais().toLowerCase();
      result = result.filter(e => 
        e.pais?.toLowerCase().includes(search) ||
        e.estado?.toLowerCase().includes(search)
      );
    }
    
    if (this.modulosSeleccionados().length > 0) {
      result = result.filter(e => 
        e.modulos?.some(m => this.modulosSeleccionados().includes(m))
      );
    }
    
    return result;
  }

  getModulosTexto(modulos: number[] | undefined): string {
    if (!modulos || modulos.length === 0) return 'No especificado';
    const nombres: Record<number, string> = { 1: 'Agua', 2: 'Residuos', 3: 'Energía' };
    return modulos.map(m => nombres[m] || m.toString()).join(', ');
  }

  contactar(idEmpresa: number): void {
    // Redirigir a mensajes con esta empresa
    window.location.href = `/cliente/mensajes?empresa=${idEmpresa}`;
  }
}
