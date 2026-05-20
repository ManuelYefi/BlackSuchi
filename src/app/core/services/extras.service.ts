import { Injectable } from '@angular/core';
import { ProductOption } from '../models/product.model';
import { EXTRA_OPTIONS } from '../data/menu-options';
import { AppStorageService } from './app-storage.service';

@Injectable({
  providedIn: 'root'
})
export class ExtrasService {
  constructor(private readonly storage: AppStorageService) {}

  getExtras(): ProductOption[] {
    return this.storage.getSection('extras') ?? EXTRA_OPTIONS;
  }

  saveExtras(extras: ProductOption[]) {
    this.storage.setSection('extras', extras);
  }

  updateExtra(updated: ProductOption) {
    const extras = this.getExtras().map(e =>
      e.id === updated.id ? updated : e
    );

    this.saveExtras(extras);
  }

  resetExtras() {
    this.storage.clearSection('extras');
  }
}
