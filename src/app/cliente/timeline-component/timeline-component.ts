import { Component, OnInit, Input, signal, inject, SimpleChanges, OnChanges } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ApiService } from '../../services/api.service';
import { AuthService } from '../../services/auth.service';
import { IconComponent, IconName } from '../../shared/components/icon/icon.component';

// Interfaz del ítem individual (Evidencia o Comentario)
interface TimelineItem {
  id: string;
  tipo: 'EVIDENCIA' | 'COMENTARIO';
  subtipo?: string; 
  descripcion: string;
  url?: string;
  nombre_archivo?: string;
  autor: string;
  fecha: string;
}

// Nueva Interfaz para el Grupo (La Auditoría)
interface AuditoriaGroup {
  id_auditoria: number;
  fecha_creacion: string;
  estado: number;
  items: TimelineItem[];
  expanded: boolean; // Controla si el acordeón está abierto
}

@Component({
  selector: 'app-timeline',
  standalone: true,
  imports: [CommonModule, FormsModule, IconComponent, DatePipe],
  templateUrl: './timeline-component.html',
  styleUrls: ['./timeline-component.css']
})
export class TimelineComponent implements OnInit, OnChanges {
  @Input() idEmpresa?: number; // 👈 Ahora es opcional
  @Input() readOnly: boolean = true; 

  private api = inject(ApiService);
  private auth = inject(AuthService);

  // Lista de Auditorías (cada una con sus items dentro)
  grupos = signal<AuditoriaGroup[]>([]);
  loading = signal(false);
  
  // Variables para nuevo comentario (se asigna a la auditoría expandida o seleccionada)
  nuevoComentario = '';
  enviando = signal(false);

  ngOnChanges(changes: SimpleChanges) {
    if (changes['idEmpresa'] && this.idEmpresa) {
      this.cargarHistorialCompleto();
    }
  }

  ngOnInit() {
    console.log('TimelineComponent initialized with idEmpresa:', this.idEmpresa);
    if (!this.idEmpresa) {
      // Si entra por la ruta /auditorias/timeline, toma la empresa del usuario logueado
      const user = this.auth.getUsuarioActual();
      if (user?.id_empresa) {
        this.idEmpresa = user.id_empresa;
        this.cargarHistorialCompleto();
      }
    }
  }

  cargarHistorialCompleto() {
    this.loading.set(true);
    this.api.get<AuditoriaGroup[]>(`/api/timeline/empresa/${this.idEmpresa}`)
      .subscribe({
        next: (data) => {
          // Inicializamos 'expanded' en false para todas, o true para la primera
          const procesado = data.map((grupo, index) => ({
            ...grupo,
            expanded: index === 0 // La más reciente aparece expandida por defecto
          }));
          this.grupos.set(procesado);
          this.loading.set(false);
        },
        error: (err) => {
          console.error(err);
          this.loading.set(false);
        }
      });
  }

  toggleGrupo(idAuditoria: number) {
    this.grupos.update(lista => 
      lista.map(g => {
        if (g.id_auditoria === idAuditoria) {
          return { ...g, expanded: !g.expanded };
        }
        // Opcional: Si quieres modo "Acordeón estricto" (solo uno abierto a la vez):
        // return { ...g, expanded: false }; 
        return g;
      })
    );
  }

  publicarComentario(idAuditoria: number) {
    if (!this.nuevoComentario.trim()) return;

    this.enviando.set(true);
    const payload = {
      id_auditoria: idAuditoria,
      mensaje: this.nuevoComentario
    };

    this.api.post('/api/timeline/comentarios', payload)
      .subscribe({
        next: () => {
          this.nuevoComentario = '';
          this.enviando.set(false);
          this.cargarHistorialCompleto(); // Recargar para ver el cambio
        },
        error: () => this.enviando.set(false)
      });
  }

  getIcono(tipo: string, subtipo?: string): IconName {
    if (tipo === 'COMENTARIO') return 'message-square';
    if (subtipo === 'FOTO') return 'camera';
    if (subtipo === 'DOC') return 'file-text';
    return 'activity';
  }

  getEstadoNombre(id: number): string {
    const estados: any = { 1: 'Creada', 2: 'En Proceso', 3: 'Finalizada' };
    return estados[id] || 'Desconocido';
  }
}