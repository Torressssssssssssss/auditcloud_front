import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse, HttpHeaders } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FileService {
  constructor(private http: HttpClient) {}

  open(url: string | undefined | null, fileName?: string): void {
    try {
      this.fetchBlob(url).subscribe({
        next: (blob) => this.openBlob(blob),
        error: (error) => alert(this.getFileErrorMessage(error, "abrir"))
      });
    } catch (error) {
      alert(this.getFileErrorMessage(error, "abrir"));
    }
  }

  download(url: string | undefined | null, fileName?: string): void {
    try {
      this.fetchBlob(url).subscribe({
        next: (blob) => this.downloadBlob(blob, fileName || this.getFileName(url) || "archivo"),
        error: (error) => alert(this.getFileErrorMessage(error, "descargar"))
      });
    } catch (error) {
      alert(this.getFileErrorMessage(error, "descargar"));
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
      responseType: 'blob'
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

  private openBlob(blob: Blob): void {
    const blobUrl = window.URL.createObjectURL(blob);
    const opened = window.open(blobUrl, '_blank', 'noopener,noreferrer');

    if (!opened) {
      this.downloadBlob(blob, 'archivo');
    }

    window.setTimeout(() => window.URL.revokeObjectURL(blobUrl), 60000);
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
      const parsed = new URL(url, environment.apiUrl);
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
