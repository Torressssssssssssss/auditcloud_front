import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, from, switchMap, throwError } from 'rxjs';

export const interceptorPerfilEmpresa: HttpInterceptorFn = (solicitud, siguiente) =>
{
  return siguiente(solicitud).pipe(catchError((error: HttpErrorResponse) =>
  {
    // Las descargas de PDF también entregan los errores JSON como Blob.
    const contenido = error.error instanceof Blob
      ? error.error.text().then((texto: string) =>
        {
          try
          {
            return JSON.parse(texto);
          }
          catch
          {
            return null;
          }
        })
      : Promise.resolve(error.error);
    return from(contenido).pipe(switchMap((datos) =>
    {
      if(error.status === 403 && datos?.code === 'PERFIL_EMPRESA_INCOMPLETO')
      {
        window.alert(datos.message);
      }
      return throwError(() => error);
    }));
  }));
};
