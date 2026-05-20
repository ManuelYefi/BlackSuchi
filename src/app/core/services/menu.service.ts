import { Injectable } from '@angular/core';
import { Product } from '../models/product.model';
import { PRODUCTS } from '../data/products';
import { AppStorageService } from './app-storage.service';

@Injectable({
  providedIn: 'root'
})
export class MenuService {
  constructor(private readonly storage: AppStorageService) {}

  getProducts(): Product[] {
    return this.storage.getSection('products') ?? PRODUCTS;
  }

  saveProducts(products: Product[]): void {
    this.storage.setSection('products', products);
  }

  updateProduct(updatedProduct: Product): void {
    const products = this.getProducts().map((product) =>
      product.id === updatedProduct.id ? updatedProduct : product
    );

    this.saveProducts(products);
  }

  resetProducts(): void {
    this.storage.clearSection('products');
  }
}
