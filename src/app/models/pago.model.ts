export interface SolicitudPago {
  id_solicitud: number;
  monto: number;
  concepto: string;
  id_estado: number;
  creado_en: string;
  id_cliente?: number;
  id_empresa?: number;
  id_empresa_cliente?: number; 
  nombre_empresa_cliente?: string; 
  pagada_en?: string;
  empresa_auditora?: number;
  nombre_empresa_auditora?: string;
  es_mio?: boolean;                // Flag opcional que agregamos en el backend
}