import { Component, EventEmitter, Output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Component({
  selector: 'app-nueva-solicitud',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './nueva-solicitud.component.html',
  styleUrls: ['./nueva-solicitud.component.css']
})
export class NuevaSolicitudComponent {
  @Output() solicitudCreada = new EventEmitter<void>();
  @Output() cerrar = new EventEmitter<void>();

  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  
  enviando = signal(false);
  errorMsg = signal('');
  successMsg = signal('');

  form: FormGroup = this.fb.group({
    id_empresa: [null, [Validators.required, Validators.min(1)]], // Antes era id_cliente
    concepto: ['', [Validators.required, Validators.minLength(5)]],
    monto: [null, [Validators.required, Validators.min(1)]]
  });

  onSubmit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    this.enviando.set(true);
    this.errorMsg.set('');
    this.successMsg.set('');

    // Payload solo con los datos del formulario
    // El backend sabrá qué empresa es basándose en el Token del Auditor
    const payload = {
      id_empresa: this.form.value.id_empresa, // Enviamos id_empresa
      monto: this.form.value.monto,
      concepto: this.form.value.concepto
    };

    // 1. Obtener token
    const token = localStorage.getItem('auditcloud_token');
    
    // Validar antes de enviar para evitar error 401 innecesario
    if (!token) {
      this.errorMsg.set('No hay sesión activa. Por favor inicia sesión nuevamente.');
      this.enviando.set(false);
      return;
    }

    // 2. Configurar Headers Correctamente
    const headers = new HttpHeaders({
      'Authorization': `Bearer ${token}`
    });

    // 3. Enviar petición a la ruta de AUDITOR
this.http.post('http://localhost:3000/api/auditor/solicitudes-pago', payload, { headers }) 
     .subscribe({
        next: () => {
          this.enviando.set(false);
          this.form.reset();
          this.successMsg.set('Solicitud de cobro enviada al cliente.');
          this.solicitudCreada.emit();
          setTimeout(() => this.successMsg.set(''), 3000);
        },
        error: (err) => {
          console.error(err);
          this.enviando.set(false);
          if (err.status === 401) {
             this.errorMsg.set('Sesión expirada o inválida (401). Sal y entra de nuevo.');
          } else {
             this.errorMsg.set(err.error?.message || 'Error al conectar con el servidor');
          }
        }
      });
  }

  cancelar() {
    this.cerrar.emit();
  }
}