export interface Auditoria {
  id_auditoria: number;
  id_empresa_auditora: number;
  id_cliente: number;
  id_estado: number;
  
  // Campos opcionales enriquecidos por el backend
  fecha_creacion?: string;
  fecha_inicio?: string;
  fecha_fin?: string;
  objetivo?: string;
  monto?: number;
  
  // IDs de relaciones
  modulos?: number[];

  // Objetos anidados (vitales para tus errores)
  empresa?: { // Para la vista del Cliente (quién me audita)
    id_empresa: number;
    nombre: string;
  };
  
  cliente?: { // Para la vista del Supervisor (a quién audito)
    id_usuario?: number;
    nombre?: string;
    nombre_empresa?: string;
  };
}