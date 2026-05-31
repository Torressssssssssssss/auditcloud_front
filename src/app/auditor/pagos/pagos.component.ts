import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient, HttpHeaders } from '@angular/common/http'; 
import { environment } from '../../../environments/environment';
import { NuevaSolicitudComponent } from './nueva-solicitud.component';
import { SolicitudPago } from '../../models/pago.model';

@Component({
  selector: 'app-auditor-pagos',
  standalone: true,
  imports: [CommonModule, NuevaSolicitudComponent], 
  templateUrl: './pagos.component.html',
  styleUrls: ['./pagos.component.css']
})
export class PagosComponent implements OnInit {
  private http = inject(HttpClient);
  
  solicitudes = signal<SolicitudPago[]>([]);
  mostrarFormulario = signal(false); 
  cargando = signal(false);

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

    this.http.get<any[]>(`${environment.apiUrl}/api/auditor/solicitudes-pago`, { headers })
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

  onSolicitudCreada() {
    this.mostrarFormulario.set(false);
    this.cargarSolicitudes();
    alert('Solicitud de cobro creada exitosamente.');
  }
}