import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { TableOption } from '../../../../core/data/order-channels';
import { TablesService } from '../../../../core/services/tables.service';

@Component({
  selector: 'app-tables-admin',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './tables-admin.html',
  styleUrl: './tables-admin.scss'
})
export class TablesAdminComponent implements OnInit {
  private readonly tablesService = inject(TablesService);

  protected readonly tables = this.tablesService.tables;
  protected readonly loading = this.tablesService.loading;
  protected readonly error = this.tablesService.error;

  async ngOnInit(): Promise<void> {
    await this.tablesService.loadTables();
  }

  async toggleTable(table: TableOption): Promise<void> {
    await this.tablesService.updateTable({
      ...table,
      active: !table.active
    });
  }

  async resetTables(): Promise<void> {
    await this.tablesService.resetTables();
  }
}
