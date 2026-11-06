import { Injectable, inject } from '@angular/core';
import { Title } from '@angular/platform-browser';
import { RouterStateSnapshot, TitleStrategy } from '@angular/router';

@Injectable()
export class EstrategiaTituloPagina extends TitleStrategy
{
  private readonly titulo = inject(Title);

  override updateTitle(estado: RouterStateSnapshot): void
  {
    const pagina = this.buildTitle(estado);
    this.titulo.setTitle(pagina ? `AuditCloud - ${pagina}` : 'AuditCloud');
  }
}
