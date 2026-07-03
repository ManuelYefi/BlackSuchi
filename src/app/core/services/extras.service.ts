import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ProductOption } from '../models/product.model';
import { EXTRA_OPTIONS } from '../data/menu-options';

@Injectable({
  providedIn: 'root'
})
export class ExtrasService {
  private readonly apiUrl = 'http://localhost:3001/api/extras';

  readonly extras = signal<ProductOption[]>(EXTRA_OPTIONS);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  constructor(private readonly http: HttpClient) {}

  getExtras(): ProductOption[] {
    return this.extras();
  }

  async loadExtras(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const extras = await firstValueFrom(this.http.get<ProductOption[]>(this.apiUrl));
      this.extras.set(extras);
    } catch (error) {
      console.error('[extras-service] fallback to local extras', error);
      this.extras.set(EXTRA_OPTIONS);
      this.error.set(
        'No fue posible conectar con MySQL para los extras. Se mostraron los datos base.'
      );
    } finally {
      this.loading.set(false);
    }
  }

  async updateExtra(updated: ProductOption): Promise<void> {
    const extra = await firstValueFrom(
      this.http.put<ProductOption>(`${this.apiUrl}/${updated.id}`, updated)
    );

    const extras = this.extras().map((item) => (item.id === extra.id ? extra : item));
    this.extras.set(extras);
  }

  async resetExtras(): Promise<void> {
    const extras = await firstValueFrom(
      this.http.post<ProductOption[]>(`${this.apiUrl}/reset`, {})
    );
    this.extras.set(extras);
    this.error.set(null);
  }
}
