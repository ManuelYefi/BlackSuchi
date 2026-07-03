import { CommonModule } from '@angular/common';
import { Component, OnInit, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Product } from '../../../../core/models/product.model';
import { MenuService } from '../../../../core/services/menu.service';

@Component({
  selector: 'app-menu-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './menu-admin.html',
  styleUrl: './menu-admin.scss'
})
export class MenuAdminComponent implements OnInit {
  private readonly menuService = inject(MenuService);

  protected readonly products = this.menuService.products;
  protected readonly loading = this.menuService.loading;
  protected readonly error = this.menuService.error;

  async ngOnInit(): Promise<void> {
    await this.menuService.loadProducts();
  }

  async saveProduct(product: Product): Promise<void> {
    await this.menuService.updateProduct(product);
  }

  async toggleActive(product: Product): Promise<void> {
    const updated: Product = {
      ...product,
      active: !product.active
    };

    await this.saveProduct(updated);
  }

  async updatePrice(product: Product, value: string): Promise<void> {
    const updated: Product = {
      ...product,
      price: Number(value)
    };

    await this.saveProduct(updated);
  }

  async resetMenu(): Promise<void> {
    await this.menuService.resetProducts();
  }
}
