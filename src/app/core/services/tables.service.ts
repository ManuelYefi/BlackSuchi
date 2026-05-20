import { Injectable } from '@angular/core';
import { TABLES, TableOption } from '../data/order-channels';
import { AppStorageService } from './app-storage.service';

@Injectable({
  providedIn: 'root'
})
export class TablesService {
  constructor(private readonly storage: AppStorageService) {}

  getTables(): TableOption[] {
    return this.storage.getSection('tables') ?? TABLES;
  }

  saveTables(tables: TableOption[]): void {
    this.storage.setSection('tables', tables);
  }

  updateTable(updated: TableOption): void {
    const tables = this.getTables().map((table) =>
      table.id === updated.id ? updated : table
    );

    this.saveTables(tables);
  }

  resetTables(): void {
    this.storage.clearSection('tables');
  }
}
