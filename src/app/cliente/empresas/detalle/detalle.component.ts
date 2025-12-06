import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { ApiService } from '../../../services/api.service';
import { AuthService } from '../../../services/auth.service';
import { LoadingSpinnerComponent } from '../../../shared/components/loading-spinner/loading-spinner.component';
import { EmptyStateComponent } from '../../../shared/components/empty-state/empty-state.component';
import { IconComponent } from '../../../shared/components/icon/icon.component';

interface EmpresaAuditora {
  id_empresa: number;
  nombre: string;
  rfc?: string;
  direccion?: string;
  telefono?: string;
  pais?: string;
  estado?: string;
  modulos?: number[];
  descripcion?: string;
}

@Component({
  selector: 'app-empresa-detalle',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    LoadingSpinnerComponent,
    EmptyStateComponent,
    IconComponent
  ],
  templateUrl: './detalle.component.html',
  styleUrl: './detalle.component.css'
})
export class EmpresaDetalleComponent implements OnInit {
  loading = signal<boolean>(true);
  empresa = signal<EmpresaAuditora | null>(null);
  yaContactada = signal<boolean>(false);

  constructor(
    private route: ActivatedRoute,
    public router: Router,
    private apiService: ApiService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadEmpresa(+id);
    }
  }

  loadEmpresa(id: number): void {
    this.loading.set(true);
    // Nota: Ajustar endpoint según tu backend
    this.apiService.get<EmpresaAuditora>(`/api/cliente/empresas-auditoras/${id}`)
      .subscribe({
        next: (empresa) => {
          this.empresa.set(empresa);
          this.verificarConversacionExistente(empresa.id_empresa);
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error cargando empresa:', error);
          this.loading.set(false);
        }
      });
  }

  private verificarConversacionExistente(idEmpresa: number): void {
    const idCliente = this.authService.getIdUsuario();
    if (!idCliente) { this.yaContactada.set(false); return; }
    this.apiService.get<any>(`/api/cliente/conversaciones/${idCliente}`).subscribe({
      next: (resp) => {
        const convs = Array.isArray(resp) ? resp : (resp?.data || []);
        this.yaContactada.set(convs.some((c: any) => c.id_empresa_auditora === idEmpresa));
      },
      error: () => this.yaContactada.set(false)
    });
  }

  getModulosTexto(modulos: number[] | undefined): string {
    if (!modulos || modulos.length === 0) return 'No especificado';
    const nombres: Record<number, string> = { 1: 'Agua', 2: 'Residuos', 3: 'Energía' };
    return modulos.map(m => nombres[m] || m.toString()).join(', ');
  }

  contactar(): void {
    if (!this.empresa()) return;
    this.router.navigate(['/cliente/mensajes'], { queryParams: { empresa: this.empresa()!.id_empresa } });
  }
}
