import { PagoPaypalComponent } from '../../pago-paypal-component/pago-paypal-component';
import { Router } from '@angular/router';
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
// 👇 1. IMPORTAR EL COMPONENTE HIJO
import { NuevaSolicitudComponent } from './nueva-solicitud.component';

// 👇 2. ACTUALIZAR LA INTERFAZ (Para que no marque error con id_cliente)
interface SolicitudPago {
  id_solicitud: number;
  monto: number;
  concepto: string;
  id_estado: number;
  creado_en: string;
  id_cliente?: number;      // Agregado
  id_empresa?: number;      // Agregado
}

@Component({
  selector: 'app-auditor-pagos',
  standalone: true,
  // 👇 3. AGREGARLO A IMPORTS (Soluciona NG8001)
  imports: [CommonModule, NuevaSolicitudComponent], 
  templateUrl: './pagos.component.html',
  styleUrls: ['./pagos.component.css']
})
export class PagosComponent implements OnInit {
  private http = inject(HttpClient);
  
  solicitudes = signal<SolicitudPago[]>([]);
  // 👇 4. DEFINIR LA SEÑAL DEL FORMULARIO (Soluciona TS2339)
  mostrarFormulario = signal(false); 
  cargando = signal(false);

  // Datos del auditor logueado
  usuarioLogueado = JSON.parse(localStorage.getItem('auditcloud_user') || '{}');

  ngOnInit() {
    this.cargarSolicitudes();
  }

  cargarSolicitudes() {
    // Lógica para cargar solicitudes (opcional si el auditor necesita ver historial)
    console.log('Cargando solicitudes...');
  }

  // 👇 5. DEFINIR LA FUNCIÓN DEL EVENTO (Soluciona TS2339)
  onSolicitudCreada() {
    this.mostrarFormulario.set(false); // Cierra el formulario
    this.cargarSolicitudes(); // Recarga la lista
    alert('Solicitud de cobro creada exitosamente.');
  }
}