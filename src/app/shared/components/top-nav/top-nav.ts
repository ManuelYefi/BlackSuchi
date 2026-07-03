import { CommonModule } from '@angular/common';
import { Component, OnDestroy, OnInit, inject } from '@angular/core';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { SystemHealthService } from '../../../core/services/system-health.service';

@Component({
  selector: 'app-top-nav',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './top-nav.html',
  styleUrl: './top-nav.scss'
})
export class TopNavComponent {
  private readonly authService = inject(AuthService);
  private readonly systemHealthService = inject(SystemHealthService);

  protected readonly role = this.authService.getRole();
  protected readonly apiStatus = this.systemHealthService.apiStatus;
  protected readonly databaseStatus = this.systemHealthService.databaseStatus;
  protected readonly lastMessage = this.systemHealthService.lastMessage;

  ngOnInit(): void {
    this.systemHealthService.startMonitoring();
  }

  ngOnDestroy(): void {
    this.systemHealthService.stopMonitoring();
  }
}
