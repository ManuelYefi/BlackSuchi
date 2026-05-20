import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
import { TableOption } from '../../../../core/data/order-channels';
import { TablesService } from '../../../../core/services/tables.service';

@Component({
  selector: 'app-tables-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tables-admin.html',
  styleUrl: './tables-admin.scss'
})
export class TablesAdminComponent {
  private readonly tablesService = inject(TablesService);

  protected readonly tables = signal<TableOption[]>(this.tablesService.getTables());

  toggleTable(table: TableOption): void {
    this.tablesService.updateTable({
      ...table,
      active: !table.active
    });

    this.tables.set(this.tablesService.getTables());
  }

  resetTables(): void {
    this.tablesService.resetTables();
    this.tables.set(this.tablesService.getTables());
  }
}