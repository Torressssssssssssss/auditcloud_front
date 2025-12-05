import { Component, signal, OnInit } from '@angular/core';
import { RouterOutlet, Router } from '@angular/router';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet],
  templateUrl: './app.html',
  styleUrl: './app.css'
})
export class App implements OnInit {
  protected readonly title = signal('auditcloud_front');

  constructor(private router: Router) {}

  ngOnInit(): void {
    console.log('App component initialized');
    console.log('Current route:', this.router.url);
  }
}
