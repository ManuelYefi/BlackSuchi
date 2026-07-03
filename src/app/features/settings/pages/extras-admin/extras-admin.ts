import { CommonModule } from '@angular/common';
import { Component, OnInit, computed, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ExtrasService } from '../../../../core/services/extras.service';
import { ProductOption } from '../../../../core/models/product.model';

type ExtraGroup = {
  id: string;
  title: string;
  description: string;
  accent: 'base' | 'premium';
  extras: ProductOption[];
};

@Component({
  selector: 'app-extras-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './extras-admin.html',
  styleUrl: './extras-admin.scss'
})
export class ExtrasAdminComponent implements OnInit {
  private readonly extrasService = inject(ExtrasService);

  protected readonly extras = this.extrasService.extras;
  protected readonly loading = this.extrasService.loading;
  protected readonly error = this.extrasService.error;
  protected readonly totalExtras = computed(() => this.extras().length);
  protected readonly averagePrice = computed(() => {
    const extras = this.extras();
    if (!extras.length) return 0;

    const total = extras.reduce((sum, extra) => sum + extra.price, 0);
    return total / extras.length;
  });
  protected readonly currencyFormatter = new Intl.NumberFormat('es-CL');
  protected readonly groupedExtras = computed<ExtraGroup[]>(() => {
    const extras = [...this.extras()].sort((a, b) => a.name.localeCompare(b.name));
    const baseExtras = extras.filter((extra) => extra.price < 1000);
    const premiumExtras = extras.filter((extra) => extra.price >= 1000);

    const groups: ExtraGroup[] = [
      {
        id: 'base',
        title: 'Extras Base',
        description: 'Complementos de rotacion alta y ticket ligero.',
        accent: 'base',
        extras: baseExtras
      },
      {
        id: 'premium',
        title: 'Extras Premium',
        description: 'Opciones de mayor valor para ventas de mayor margen.',
        accent: 'premium',
        extras: premiumExtras
      }
    ];

    return groups.filter((group) => group.extras.length > 0);
  });

  async ngOnInit(): Promise<void> {
    await this.extrasService.loadExtras();
  }

  async updatePrice(extra: ProductOption, value: string): Promise<void> {
    const updated = { ...extra, price: Number(value) };
    await this.extrasService.updateExtra(updated);
  }

  async resetExtras(): Promise<void> {
    await this.extrasService.resetExtras();
  }

  formatPrice(value: number): string {
    return `CLP ${this.currencyFormatter.format(value)}`;
  }
}
