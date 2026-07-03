import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { TABLES, TableOption } from '../data/order-channels';

@Injectable({
  providedIn: 'root'
})
export class TablesService {
  private readonly apiUrl = 'http://localhost:3001/api/tables';

  readonly tables = signal<TableOption[]>(TABLES);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  constructor(private readonly http: HttpClient) {}

  getTables(): TableOption[] {
    return this.tables();
  }

  async loadTables(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const tables = await firstValueFrom(this.http.get<TableOption[]>(this.apiUrl));
      this.tables.set(tables);
    } catch (error) {
      console.error('[tables-service] fallback to local tables', error);
      this.tables.set(TABLES);
      this.error.set(
        'No fue posible conectar con MySQL para las mesas. Se mostraron los datos base.'
      );
    } finally {
      this.loading.set(false);
    }
  }

  async updateTable(updated: TableOption): Promise<void> {
    const table = await firstValueFrom(
      this.http.put<TableOption>(`${this.apiUrl}/${updated.id}`, updated)
    );

    const tables = this.tables().map((item) => (item.id === table.id ? table : item));
    this.tables.set(tables);
  }

  async resetTables(): Promise<void> {
    const tables = await firstValueFrom(
      this.http.post<TableOption[]>(`${this.apiUrl}/reset`, {})
    );
    this.tables.set(tables);
    this.error.set(null);
  }
}
