import { Injectable, computed, signal } from '@angular/core';
import {
  OrderItem,
  SauceOption,
  SelectedExtra,
  SelectedSauce
} from '../models/order-item.model';
import { Product } from '../models/product.model';
import { AppStorageService } from './app-storage.service';

@Injectable({
  providedIn: 'root'
})
export class OrderService {
  private readonly _items = signal<OrderItem[]>([]);

  constructor(private readonly storage: AppStorageService) {
    this._items.set(this.loadInitialState());
  }

  readonly items = this._items.asReadonly();

  readonly total = computed(() =>
    this._items().reduce((acc, item) => acc + item.subtotal, 0)
  );

  readonly totalItems = computed(() =>
    this._items().reduce((acc, item) => acc + item.quantity, 0)
  );

  addProduct(
    product: Product,
    notes?: string,
    extras: SelectedExtra[] = [],
    sauces: SelectedSauce[] = []
  ): void {
    const normalizedNotes = notes?.trim() || '';
    const normalizedSauces = this.normalizeSauces(sauces);
    const saucesKey = JSON.stringify(
      [...normalizedSauces].sort((a, b) => a.name.localeCompare(b.name))
    );
    const extrasKey = JSON.stringify(
      [...extras].sort((a, b) => a.id.localeCompare(b.id))
    );

    const currentItems = [...this._items()];
    const existingIndex = currentItems.findIndex(
      (item) =>
        item.productId === product.id &&
        (item.notes ?? '') === normalizedNotes &&
        JSON.stringify(
          [...this.normalizeSauces(item.sauces ?? [])].sort((a, b) =>
            a.name.localeCompare(b.name)
          )
        ) === saucesKey &&
        JSON.stringify(
          [...(item.extras ?? [])].sort((a, b) => a.id.localeCompare(b.id))
        ) === extrasKey
    );

    const unitPrice =
    product.price + extras.reduce((acc, extra) => acc + extra.price * extra.quantity, 0);

    if (existingIndex >= 0) {
      currentItems[existingIndex] = {
        ...currentItems[existingIndex],
        quantity: currentItems[existingIndex].quantity + 1,
        subtotal:
          (currentItems[existingIndex].quantity + 1) *
          currentItems[existingIndex].unitPrice
      };
    } else {
      currentItems.push({
        uid: crypto.randomUUID(),
        productId: product.id,
        name: product.name,
        description: product.description,
        quantity: 1,
        unitPrice,
        subtotal: unitPrice,
        notes: normalizedNotes || undefined,
        extras: extras.length ? extras : undefined,
        sauces: normalizedSauces.length ? normalizedSauces : undefined
      });
    }

    this.updateState(currentItems);
  }

  increase(uid: string): void {
    const updated = this._items().map((item) =>
      item.uid === uid
        ? {
            ...item,
            quantity: item.quantity + 1,
            subtotal: (item.quantity + 1) * item.unitPrice
          }
        : item
    );

    this.updateState(updated);
  }

  decrease(uid: string): void {
    const updated = this._items()
      .map((item) =>
        item.uid === uid
          ? {
              ...item,
              quantity: item.quantity - 1,
              subtotal: (item.quantity - 1) * item.unitPrice
            }
          : item
      )
      .filter((item) => item.quantity > 0);

    this.updateState(updated);
  }

  remove(uid: string): void {
    const updated = this._items().filter((item) => item.uid !== uid);
    this.updateState(updated);
  }

  clear(): void {
    this.updateState([]);
  }

  private updateState(items: OrderItem[]): void {
    this._items.set(items);
    this.storage.setSection('cart', items);
  }

  private loadInitialState(): OrderItem[] {
    const items = this.storage.getSection('cart') ?? [];

    return items.map((item) => ({
      ...item,
      sauces: item.sauces ? this.normalizeSauces(item.sauces) : undefined
    }));
  }

  private normalizeSauces(sauces: Array<SelectedSauce | SauceOption>): SelectedSauce[] {
    return sauces
      .map((sauce) =>
        typeof sauce === 'string'
          ? { name: sauce, quantity: 1 }
          : { name: sauce.name, quantity: sauce.quantity }
      )
      .filter((sauce) => sauce.quantity > 0);
  }
}
