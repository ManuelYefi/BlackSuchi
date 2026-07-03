import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

type HealthState = 'up' | 'down' | 'checking';

interface HealthResponse {
  ok: boolean;
  service: string;
  api: 'up' | 'down';
  database: 'up' | 'down';
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SystemHealthService {
  private readonly apiUrl = 'http://localhost:3001/api/health';
  private intervalId: ReturnType<typeof setInterval> | null = null;

  readonly apiStatus = signal<HealthState>('checking');
  readonly databaseStatus = signal<HealthState>('checking');
  readonly lastMessage = signal('Verificando servicios...');

  constructor(private readonly http: HttpClient) {}

  startMonitoring(): void {
    if (this.intervalId) {
      return;
    }

    void this.checkNow();
    this.intervalId = setInterval(() => {
      void this.checkNow();
    }, 10000);
  }

  stopMonitoring(): void {
    if (!this.intervalId) {
      return;
    }

    clearInterval(this.intervalId);
    this.intervalId = null;
  }

  async checkNow(): Promise<void> {
    try {
      const response = await firstValueFrom(this.http.get<HealthResponse>(this.apiUrl));
      this.apiStatus.set(response.api);
      this.databaseStatus.set(response.database);
      this.lastMessage.set(
        response.database === 'up' ? 'API y MySQL operativos' : 'API operativa, MySQL caido'
      );
    } catch {
      this.apiStatus.set('down');
      this.databaseStatus.set('down');
      this.lastMessage.set('API y MySQL sin conexion');
    }
  }
}
