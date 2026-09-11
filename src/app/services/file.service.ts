import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class FileService {
  constructor(private http: HttpClient) {}

  open(url: string | undefined | null, fileName?: string): void {
    try {
      this.fetchBlob(url).subscribe({
        next: (blob) => this.openPreview(blob, fileName || this.getFileName(url) || 'archivo'),
        error: (error) => alert(this.getFileErrorMessage(error, 'abrir')),
      });
    } catch (error) {
      alert(this.getFileErrorMessage(error, 'abrir'));
    }
  }

  download(url: string | undefined | null, fileName?: string): void {
    try {
      this.fetchBlob(url).subscribe({
        next: (blob) => this.downloadBlob(blob, fileName || this.getFileName(url) || 'archivo'),
        error: (error) => alert(this.getFileErrorMessage(error, 'descargar')),
      });
    } catch (error) {
      alert(this.getFileErrorMessage(error, 'descargar'));
    }
  }

  openEndpoint(endpoint: string, fileName?: string): void {
    this.open(endpoint, fileName);
  }

  downloadEndpoint(endpoint: string, fileName?: string): void {
    this.download(endpoint, fileName);
  }

  private fetchBlob(url: string | undefined | null) {
    const normalizedUrl = this.normalizeUrl(url);
    const token = localStorage.getItem('auditcloud_token');
    const headers = token ? new HttpHeaders({ Authorization: `Bearer ${token}` }) : undefined;

    return this.http.get(normalizedUrl, {
      headers,
      responseType: 'blob',
    });
  }

  private normalizeUrl(url: string | undefined | null): string {
    if (!url || !url.trim()) {
      throw new Error('Archivo no disponible');
    }

    const rawUrl = url.trim();

    if (rawUrl.startsWith('/')) {
      return `${environment.apiUrl}${rawUrl}`;
    }

    try {
      const parsed = new URL(rawUrl);
      if (parsed.pathname.startsWith('/uploads') || parsed.pathname.startsWith('/api')) {
        return `${environment.apiUrl}${parsed.pathname}${parsed.search}`;
      }
      return rawUrl;
    } catch {
      return `${environment.apiUrl}/${rawUrl.replace(/^\/+/, '')}`;
    }
  }

  private openPreview(blob: Blob, fileName: string): void {
    const objectUrl = window.URL.createObjectURL(blob);
    const isPdf = blob.type === 'application/pdf' || /\.pdf$/i.test(fileName);
    const overlay = document.createElement('div');
    overlay.className = 'audit-file-preview-overlay';
    overlay.innerHTML = `
      <div class="audit-file-preview-dialog" role="dialog" aria-modal="true" aria-label="Vista previa de ${this.escapeHtml(fileName)}">
        <div class="audit-file-preview-header">
          <strong>${this.escapeHtml(fileName)}</strong>
          <button type="button" class="audit-file-preview-close" aria-label="Cerrar">×</button>
        </div>
        <div class="audit-file-preview-body"></div>
        <div class="audit-file-preview-actions">
          <button type="button" class="btn btn-secondary audit-file-preview-close-action">Cerrar</button>
          <button type="button" class="btn btn-primary audit-file-preview-download">Descargar</button>
        </div>
      </div>`;
    const body = overlay.querySelector('.audit-file-preview-body') as HTMLElement;
    if (isPdf) {
      const frame = document.createElement('iframe');
      frame.src = objectUrl;
      frame.title = `Vista previa de ${fileName}`;
      body.appendChild(frame);
    } else {
      const image = document.createElement('img');
      image.src = objectUrl;
      image.alt = fileName;
      body.appendChild(image);
    }
    const close = () => {
      window.URL.revokeObjectURL(objectUrl);
      overlay.remove();
      document.removeEventListener('keydown', onKeyDown);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') close();
    };
    overlay
      .querySelectorAll('.audit-file-preview-close, .audit-file-preview-close-action')
      .forEach((button) => button.addEventListener('click', close));
    overlay
      .querySelector('.audit-file-preview-download')
      ?.addEventListener('click', () => this.downloadBlob(blob, fileName));
    overlay.addEventListener('click', (event) => {
      if (event.target === overlay) close();
    });
    document.addEventListener('keydown', onKeyDown);
    document.body.appendChild(overlay);
  }

  private escapeHtml(value: string): string {
    return value.replace(
      /[&<>"']/g,
      (character) =>
        ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[character] ||
        character,
    );
  }

  private downloadBlob(blob: Blob, fileName: string): void {
    const blobUrl = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = blobUrl;
    link.download = this.sanitizeFileName(fileName);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(blobUrl);
  }

  private getFileName(url: string | undefined | null): string | null {
    if (!url) {
      return null;
    }

    try {
      const parsed = new URL(url, new URL(environment.apiUrl || '/', window.location.origin));
      return decodeURIComponent(parsed.pathname.split('/').pop() || '');
    } catch {
      return url.split('/').pop() || null;
    }
  }

  private sanitizeFileName(fileName: string): string {
    return fileName.replace(/[\\/:*?"<>|]+/g, '_').trim() || 'archivo';
  }

  private getFileErrorMessage(error: unknown, action: 'abrir' | 'descargar'): string {
    if (error instanceof Error && error.message === 'Archivo no disponible') {
      return 'No se pudo abrir el archivo.';
    }

    if (error instanceof HttpErrorResponse) {
      if (error.status === 0) {
        return 'No se pudo conectar con el servidor.';
      }
      if (error.status === 404) {
        return 'Archivo no encontrado.';
      }
      if (error.status === 401 || error.status === 403) {
        return 'Sesión expirada, inicia sesión nuevamente.';
      }
    }

    return `No se pudo ${action} el archivo.`;
  }
}
