export interface Evidencia {
  id_evidencia: number;
  id_auditoria: number;
  id_modulo: number;
  id_auditor: number;
  
  // 👇 1. Agrega 'COMENTARIO' a los tipos permitidos
  tipo: 'FOTO' | 'DOC' | 'VIDEO' | 'COMENTARIO';
  
  descripcion: string;
  url?: string;
  nombre_archivo?: string;
  
  // 👇 2. Agrega el campo creado_en (que usa el backend)
  creado_en: string;
  
  // Campos opcionales para visualización (joins)
  nombre_auditor?: string;
  nombre_modulo?: string;
  
  // Si tenías fecha_subida antes, puedes dejarla opcional para compatibilidad
  fecha_subida?: string; 
}