import { Injectable, computed, signal } from '@angular/core';
import {
  OrderItem,
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
    _sauces: SelectedSauce[] = [],
    descriptionOverride?: string,
    basePriceOverride?: number
  ): void {
    const normalizedNotes = notes?.trim() || '';
    const effectiveDescription = descriptionOverride ?? product.description;
    const effectiveBasePrice = basePriceOverride ?? product.price;
    const extrasKey = JSON.stringify(
      [...extras].sort((a, b) => a.id.localeCompare(b.id))
    );

    const currentItems = [...this._items()];
    const existingIndex = currentItems.findIndex(
      (item) =>
        item.productId === product.id &&
        (item.description ?? '') === (effectiveDescription ?? '') &&
        (item.baseUnitPrice ?? item.unitPrice) ===
          (effectiveBasePrice +
            extras.reduce((acc, extra) => acc + extra.price * extra.quantity, 0)) &&
        (item.notes ?? '') === normalizedNotes &&
        JSON.stringify(
          [...(item.extras ?? [])].sort((a, b) => a.id.localeCompare(b.id))
        ) === extrasKey
    );

    const baseUnitPrice =
      effectiveBasePrice + extras.reduce((acc, extra) => acc + extra.price * extra.quantity, 0);

    if (existingIndex >= 0) {
      const nextQuantity = currentItems[existingIndex].quantity + 1;
      currentItems[existingIndex] = {
        ...currentItems[existingIndex],
        quantity: nextQuantity,
        sauceCharge: 0,
        subtotal: this.calculateSubtotal(
          currentItems[existingIndex].baseUnitPrice ?? currentItems[existingIndex].unitPrice,
          nextQuantity,
          0
        )
      };
    } else {
      currentItems.push({
        uid: crypto.randomUUID(),
        productId: product.id,
        name: product.name,
        description: effectiveDescription,
        quantity: 1,
        baseUnitPrice,
        unitPrice: baseUnitPrice,
        sauceCharge: 0,
        subtotal: this.calculateSubtotal(baseUnitPrice, 1, 0),
        notes: normalizedNotes || undefined,
        extras: extras.length ? extras : undefined
      });
    }

    this.updateState(currentItems);
  }

  updateItemConfiguration(
    uid: string,
    product: Product,
    notes?: string,
    extras: SelectedExtra[] = [],
    _sauces: SelectedSauce[] = [],
    descriptionOverride?: string,
    basePriceOverride?: number
  ): void {
    const currentItems = [...this._items()];
    const itemIndex = currentItems.findIndex((item) => item.uid === uid);

    if (itemIndex < 0) {
      return;
    }

    const originalItem = currentItems[itemIndex];
    const normalizedNotes = notes?.trim() || '';
    const effectiveDescription = descriptionOverride ?? product.description;
    const effectiveBasePrice = basePriceOverride ?? product.price;
    const normalizedExtras = extras.filter((extra) => extra.quantity > 0);
    const baseUnitPrice =
      effectiveBasePrice +
      normalizedExtras.reduce(
        (acc, extra) => acc + extra.price * extra.quantity,
        0
      );

    const updatedItem: OrderItem = {
      ...originalItem,
      productId: product.id,
      name: product.name,
      description: effectiveDescription,
      baseUnitPrice,
      unitPrice: baseUnitPrice,
      sauceCharge: 0,
      subtotal: this.calculateSubtotal(baseUnitPrice, originalItem.quantity, 0),
      notes: normalizedNotes || undefined,
      extras: normalizedExtras.length ? normalizedExtras : undefined,
      sauces: undefined
    };

    const withoutEdited = currentItems.filter((item) => item.uid !== uid);
    const mergeIndex = withoutEdited.findIndex(
      (item) =>
        item.productId === updatedItem.productId &&
        (item.description ?? '') === (updatedItem.description ?? '') &&
        (item.baseUnitPrice ?? item.unitPrice) === updatedItem.baseUnitPrice &&
        (item.notes ?? '') === (updatedItem.notes ?? '') &&
        this.getExtrasKey(item.extras ?? []) === this.getExtrasKey(updatedItem.extras ?? [])
    );

    if (mergeIndex >= 0) {
      const mergedQuantity = withoutEdited[mergeIndex].quantity + updatedItem.quantity;
      withoutEdited[mergeIndex] = {
        ...withoutEdited[mergeIndex],
        quantity: mergedQuantity,
        sauceCharge: 0,
        subtotal: this.calculateSubtotal(
          withoutEdited[mergeIndex].baseUnitPrice ?? withoutEdited[mergeIndex].unitPrice,
          mergedQuantity,
          0
        )
      };

      this.updateState(withoutEdited);
      return;
    }

    withoutEdited.splice(itemIndex, 0, updatedItem);
    this.updateState(withoutEdited);
  }

  increase(uid: string): void {
    const updated = this._items().map((item) =>
      item.uid === uid
        ? (() => {
            const nextQuantity = item.quantity + 1;

            return {
              ...item,
              quantity: nextQuantity,
              sauceCharge: 0,
              subtotal: this.calculateSubtotal(
                item.baseUnitPrice ?? item.unitPrice,
                nextQuantity,
                0
              )
            };
          })()
        : item
    );

    this.updateState(updated);
  }

  decrease(uid: string): void {
    const updated = this._items()
      .map((item) => {
        if (item.uid !== uid) {
          return item;
        }

        const nextQuantity = item.quantity - 1;

        return {
          ...item,
          quantity: nextQuantity,
          sauceCharge: 0,
          subtotal: this.calculateSubtotal(
            item.baseUnitPrice ?? item.unitPrice,
            nextQuantity,
            0
          )
        };
      })
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
      baseUnitPrice: item.baseUnitPrice ?? item.unitPrice,
      sauceCharge: 0,
      sauces: undefined
    })).map((item) => ({
      ...item,
      subtotal: this.calculateSubtotal(item.baseUnitPrice, item.quantity, 0)
    }));
  }

  private getExtrasKey(extras: SelectedExtra[]): string {
    return JSON.stringify([...extras].sort((a, b) => a.id.localeCompare(b.id)));
  }

  private calculateSubtotal(baseUnitPrice: number, quantity: number, sauceCharge: number): number {
    return baseUnitPrice * quantity + sauceCharge;
  }
}
