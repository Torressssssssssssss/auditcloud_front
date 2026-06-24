import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface SolicitudPagoPayload {
  id_empresa: number;
  id_cliente?: number;
  monto: number;
  concepto: string;
}

export interface SolicitudPagoItem {
  id_solicitud: number;
  id_empresa?: number;
  id_empresa_auditora?: number;
  id_empresa_cliente?: number;
  id_cliente?: number;
  monto: number;
  concepto: string;
  id_estado: number;
  creado_en: string;
  pagada_en?: string;
  nombre_empresa_cliente?: string;
  es_mio?: boolean;
}

export interface SolicitudesPagoResponse {
  total: number;
  page: number;
  limit: number;
  data: SolicitudPagoItem[];
}

export interface AuditorDisponible {
  id_usuario: number;
  nombre: string;
  correo?: string;
}

export interface CarteraClienteItem {
  id_empresa: number;
  nombre: string;
  ciudad?: string | null;
  pais?: string | null;
  contacto?: string;
  activo?: boolean;
  id_cliente: number;
  id_solicitud: number;
  id_solicitud_pago: number;
  concepto?: string;
  monto?: number;
  id_estado_pago?: number;
  pagada_en?: string | null;
  id_auditoria?: number | null;
  id_estado_auditoria?: number | null;
  total_auditorias?: number;
  estado_operativo: string;
  pendiente_asignar_auditor: boolean;
  auditor_asignado?: AuditorDisponible | null;
}

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly baseUrl = environment.apiUrl;

  constructor(
    private http: HttpClient
  ) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auditcloud_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      ...(token ? { 'Authorization': `Bearer ${token}` } : {})
    });
  }

  get<T>(endpoint: string, params?: any, options?: { responseType?: 'blob' | 'json' }): Observable<T> {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach(key => {
        if (params[key] !== null && params[key] !== undefined) {
          httpParams = httpParams.set(key, params[key].toString());
        }
      });
    }
    
    const baseOptions = {
      headers: this.getHeaders(),
      params: httpParams
    };
    
    if (options?.responseType === 'blob') {
      // Cuando responseType es 'blob', especificamos observe: 'body' para obtener solo el cuerpo
      // y usamos un cast explícito porque TypeScript no puede inferir el tipo correctamente
      return this.http.get(`${this.baseUrl}${endpoint}`, {
        ...baseOptions,
        responseType: 'blob',
        observe: 'body'
      }) as unknown as Observable<T>;
    }
    
    return this.http.get<T>(`${this.baseUrl}${endpoint}`, baseOptions);
  }

  post<T>(endpoint: string, body: any): Observable<T> {
    return this.http.post<T>(`${this.baseUrl}${endpoint}`, body, {
      headers: this.getHeaders()
    });
  }

  listSupervisorSolicitudesPago(params?: { page?: number; limit?: number }) {
    return this.get<SolicitudesPagoResponse>('/api/supervisor/solicitudes-pago', params);
  }

  createSupervisorSolicitudPago(payload: SolicitudPagoPayload) {
    return this.post('/api/supervisor/solicitudes-pago', payload);
  }

  listSupervisorCarteraClientes() {
    return this.get<CarteraClienteItem[]>('/api/supervisor/clientes-cartera');
  }

  listSupervisorAuditores(idEmpresa: number) {
    return this.get<{ total: number; page: number; limit: number; data: AuditorDisponible[] }>(`/api/supervisor/auditores/${idEmpresa}`, { page: 1, limit: 100 });
  }

  assignSupervisorAuditorToSolicitud(idSolicitud: number, idAuditor: number) {
    return this.post(`/api/supervisor/solicitudes-pago/${idSolicitud}/asignar-auditor`, { id_auditor: idAuditor });
  }

  assignSupervisorAuditorToAuditoria(idAuditoria: number, idAuditor: number) {
    return this.post(`/api/supervisor/auditorias/${idAuditoria}/asignar`, { id_auditor: idAuditor });
  }

  changeSupervisorAuditorToAuditoria(idAuditoria: number, idAuditor: number) {
    return this.put(`/api/supervisor/auditorias/${idAuditoria}/asignar`, { id_auditor: idAuditor });
  }

  removeSupervisorAuditorFromAuditoria(idAuditoria: number) {
    return this.delete(`/api/supervisor/auditorias/${idAuditoria}/asignar`);
  }

  put<T>(endpoint: string, body: any): Observable<T> {
    return this.http.put<T>(`${this.baseUrl}${endpoint}`, body, {
      headers: this.getHeaders()
    });
  }
  
  patch<T>(endpoint: string, body: any): Observable<T> {
    return this.http.patch<T>(`${this.baseUrl}${endpoint}`, body, {
      headers: this.getHeaders()
    });
  }

  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(`${this.baseUrl}${endpoint}`, {
      headers: this.getHeaders()
    });
  }
}








