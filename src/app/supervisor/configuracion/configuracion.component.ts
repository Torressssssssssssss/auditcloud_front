import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { LoadingSpinnerComponent } from '../../shared/components/loading-spinner/loading-spinner.component';

interface EmpresaConfig {
  id_empresa: number;
  nombre: string;
  rfc?: string;
  direccion?: string;
  telefono?: string;
  modulos?: number[];
}

@Component({
  selector: 'app-configuracion',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    LoadingSpinnerComponent
  ],
  templateUrl: './configuracion.component.html',
  styleUrl: './configuracion.component.css'
})
export class ConfiguracionComponent implements OnInit {
  loading = signal<boolean>(true);
  configForm: FormGroup;
  modulosSeleccionados = signal<number[]>([]);
  errorMessage = signal<string>('');
  successMessage = signal<string>('');

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.configForm = this.fb.group({
      nombre: ['', Validators.required],
      rfc: [''],
      direccion: [''],
      telefono: ['']
    });
  }

  ngOnInit(): void {
    this.loadConfiguracion();
  }

  loadConfiguracion(): void {
    this.loading.set(true);
    const idEmpresa = this.authService.getIdEmpresa();
    
    if (!idEmpresa) {
      this.loading.set(false);
      return;
    }

    // Nota: Ajustar endpoint según tu backend
    this.apiService.get<EmpresaConfig>(`/api/supervisor/empresa/${idEmpresa}`)
      .subscribe({
        next: (empresa) => {
          this.configForm.patchValue({
            nombre: empresa.nombre,
            rfc: empresa.rfc || '',
            direccion: empresa.direccion || '',
            telefono: empresa.telefono || ''
          });
          this.modulosSeleccionados.set(empresa.modulos || []);
          this.loading.set(false);
        },
        error: (error) => {
          console.error('Error cargando configuración:', error);
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

  guardar(): void {
    if (this.configForm.invalid) return;

    const idEmpresa = this.authService.getIdEmpresa();
    if (!idEmpresa) return;

    const datos = {
      ...this.configForm.value,
      modulos: this.modulosSeleccionados()
    };

    // Nota: Ajustar endpoint según tu backend
    this.apiService.put<EmpresaConfig>(`/api/supervisor/empresa/${idEmpresa}`, datos)
      .subscribe({
        next: () => {
          this.successMessage.set('Configuración guardada exitosamente');
          this.errorMessage.set('');
          setTimeout(() => this.successMessage.set(''), 3000);
        },
        error: (error) => {
          this.errorMessage.set('Error al guardar la configuración');
          this.successMessage.set('');
          console.error(error);
        }
      });
  }

  get nombre() { return this.configForm.get('nombre'); }
}
