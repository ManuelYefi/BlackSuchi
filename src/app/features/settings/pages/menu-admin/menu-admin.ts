import { CommonModule } from '@angular/common';
import { Component, inject, signal } from '@angular/core';
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
export class MenuAdminComponent {
  private readonly menuService = inject(MenuService);

  protected readonly products = signal<Product[]>(this.menuService.getProducts());

  saveProduct(product: Product): void {
    this.menuService.updateProduct(product);
    this.products.set(this.menuService.getProducts());
  }

  toggleActive(product: Product): void {
    const updated: Product = {
      ...product,
      active: !product.active
    };

    this.saveProduct(updated);
  }

  updatePrice(product: Product, value: string): void {
    const updated: Product = {
      ...product,
      price: Number(value)
    };

    this.saveProduct(updated);
  }

  resetMenu(): void {
    this.menuService.resetProducts();
    this.products.set(this.menuService.getProducts());
  }
}