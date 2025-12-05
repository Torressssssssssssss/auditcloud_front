export interface Mensaje {
  id_mensaje: number;
  id_conversacion: number;
  id_usuario: number;
  contenido: string;
  fecha_envio: string;
  tipo?: 'TEXTO' | 'SOLICITUD_PAGO' | 'SISTEMA';
  usuario?: {
    nombre: string;
  };
}

export interface Conversacion {
  id_conversacion: number;
  id_cliente: number;
  id_empresa_auditora: number;
  asunto: string;
  fecha_creacion: string;
  ultimo_mensaje?: Mensaje;
  cliente?: {
    nombre: string;
    nombre_empresa?: string;
  };
  empresa?: {
    nombre: string;
  };
}








