import { PagoPaypalComponent } from '../../pago-paypal-component/pago-paypal-component';
import { Router } from '@angular/router';
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http'; 
import { NuevaSolicitudComponent } from './nueva-solicitud.component';
import { SolicitudPago } from '../../models/pago.model';
// 👇 2. ACTUALIZAR LA INTERFAZ (Para que no marque error con id_cliente)


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
    this.cargando.set(true);

    const token = localStorage.getItem('auditcloud_token');
    
    if (!token) {
      console.error('No hay token de sesión');
      this.cargando.set(false);
      return;
    }

    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    // Llamamos al nuevo endpoint GET que creamos en auditor.routes.js
    this.http.get<any[]>('http://localhost:3000/api/auditor/solicitudes-pago', { headers })
      .subscribe({
        next: (data) => {
          this.solicitudes.set(data);
          this.cargando.set(false);
        },
        error: (err) => {
          console.error('Error cargando historial de cobros:', err);
          this.cargando.set(false);
        }
      });
  }

  // 👇 5. DEFINIR LA FUNCIÓN DEL EVENTO (Soluciona TS2339)
  onSolicitudCreada() {
    this.mostrarFormulario.set(false); // Cierra el formulario
    this.cargarSolicitudes(); // Recarga la lista
    alert('Solicitud de cobro creada exitosamente.');
  }
}