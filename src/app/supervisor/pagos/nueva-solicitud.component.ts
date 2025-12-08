import { Component, Output, EventEmitter, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';

@Component({
  selector: 'app-supervisor-nueva-solicitud',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './nueva-solicitud.component.html',
  styleUrls: ['./nueva-solicitud.component.css']
})
export class NuevaSolicitudComponent implements OnInit {
  @Output() solicitudCreada = new EventEmitter<void>();
  
  // Datos del formulario
  id_empresa: number | null = null;
  id_cliente: number | null = null;
  monto: number | null = null;
  concepto = '';
  
  // Listas para los "Paneles" (Selects)
  listaEmpresas: any[] = [];
  listaUsuarios: any[] = [];

  loading = false;
  loadingData = false; // Para la carga de listas
  errorMsg = '';

  private api = inject(ApiService);

  ngOnInit() {
    this.cargarEmpresas();
  }

  // 1. Cargar lista de empresas al inicio
  cargarEmpresas() {
    this.loadingData = true;
    this.api.get<any[]>('/api/supervisor/empresas-clientes').subscribe({
      next: (data) => {
        this.listaEmpresas = data;
        this.loadingData = false;
      },
      error: () => this.loadingData = false
    });
  }

  // 2. Cuando selecciona una empresa, cargar sus usuarios
  onEmpresaChange() {
    this.id_cliente = null; // Resetear usuario seleccionado
    this.listaUsuarios = []; // Limpiar lista anterior
    
    if (this.id_empresa) {
      this.api.get<any[]>(`/api/supervisor/usuarios-empresa/${this.id_empresa}`).subscribe({
        next: (data) => this.listaUsuarios = data,
        error: (err) => console.error('Error cargando usuarios', err)
      });
    }
  }

  crear() {
    this.errorMsg = '';
    if (!this.monto || !this.concepto || !this.id_empresa) {
      this.errorMsg = 'Empresa, monto y concepto son obligatorios';
      return;
    }

    const payload: any = { 
      id_empresa: Number(this.id_empresa), // Asegurar número
      monto: this.monto, 
      concepto: this.concepto 
    };
    
    if (this.id_cliente) payload.id_cliente = Number(this.id_cliente);

    this.loading = true;
    this.api.post('/api/supervisor/solicitudes-pago', payload).subscribe({
      next: () => {
        this.reset();
        this.solicitudCreada.emit();
        this.loading = false;
        alert('Solicitud creada y notificada correctamente');
      },
      error: (err) => {
        console.error(err);
        this.errorMsg = err?.error?.message || 'Error creando solicitud';
        this.loading = false;
      }
    });
  }

  reset() {
    this.id_empresa = null;
    this.id_cliente = null;
    this.monto = null;
    this.concepto = '';
    this.listaUsuarios = [];
  }
}