import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-chat',
  standalone: true,
  imports: [CommonModule],
  template: '<div class="page"><h2>Chat</h2><p>Conversación...</p></div>',
  styles: ['.page { padding: 2rem; }']
})
export class ChatComponent {}




