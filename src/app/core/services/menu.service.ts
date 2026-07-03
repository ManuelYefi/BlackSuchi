import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Product } from '../models/product.model';
import { PRODUCTS } from '../data/products';

@Injectable({
  providedIn: 'root'
})
export class MenuService {
  private readonly apiUrl = 'http://localhost:3001/api/menu';

  readonly products = signal<Product[]>(PRODUCTS);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  constructor(private readonly http: HttpClient) {}

  getProducts(): Product[] {
    return this.products();
  }

  async loadProducts(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const products = await firstValueFrom(this.http.get<Product[]>(`${this.apiUrl}/products`));
      this.products.set(products);
    } catch (error) {
      console.error('[menu-service] fallback to local products', error);
      this.products.set(PRODUCTS);
      this.error.set(
        'No fue posible conectar con MySQL local. Se mostro el menu base mientras tanto.'
      );
    } finally {
      this.loading.set(false);
    }
  }

  async updateProduct(updatedProduct: Product): Promise<void> {
    await firstValueFrom(
      this.http.put<Product>(`${this.apiUrl}/products/${updatedProduct.id}`, updatedProduct)
    );

    const products = this.products().map((product) =>
      product.id === updatedProduct.id ? updatedProduct : product
    );

    this.products.set(products);
  }

  async createProduct(product: Product): Promise<void> {
    const created = await firstValueFrom(
      this.http.post<Product>(`${this.apiUrl}/products`, product)
    );

    this.products.set(
      [...this.products(), created].sort((a, b) =>
        a.category === b.category
          ? a.name.localeCompare(b.name, 'es')
          : a.category.localeCompare(b.category, 'es')
      )
    );
  }

  async resetProducts(): Promise<void> {
    const products = await firstValueFrom(this.http.post<Product[]>(`${this.apiUrl}/reset`, {}));
    this.products.set(products);
    this.error.set(null);
  }
}
