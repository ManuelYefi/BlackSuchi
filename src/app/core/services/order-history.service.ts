import { Injectable } from '@angular/core';
import { Order } from '../models/order.model';
import { AppStorageService } from './app-storage.service';

@Injectable({
  providedIn: 'root'
})
export class OrderHistoryService {
  constructor(private readonly storage: AppStorageService) {}

  getOrders(): Order[] {
    const grouped = this.getOrderBuckets();
    return Object.entries(grouped)
      .sort(([a], [b]) => b.localeCompare(a))
      .flatMap(([, orders]) =>
        [...orders].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      );
  }

  saveOrder(order: Order): void {
    const buckets = this.getOrderBuckets();
    const monthKey = this.getMonthKey(new Date(order.createdAt));
    const monthOrders = buckets[monthKey] ?? [];

    buckets[monthKey] = [order, ...monthOrders].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    this.saveOrderBuckets(buckets);
  }

  updateOrders(orders: Order[]): void {
    this.saveOrderBuckets(this.groupOrdersByMonth(orders));
  }

  clearCurrentMonthOrders(): void {
    const now = new Date();
    const monthKey = this.getMonthKey(now);
    const buckets = this.getOrderBuckets();
    delete buckets[monthKey];
    this.saveOrderBuckets(buckets);
  }

  clearOrders(): void {
    this.storage.clearSection('ordersByMonth');
    this.storage.clearSection('orders');
  }

  getMonthlyOrderBuckets(): Record<string, Order[]> {
    return this.getOrderBuckets();
  }

  private getOrderBuckets(): Record<string, Order[]> {
    const grouped = this.storage.getSection('ordersByMonth');
    if (grouped && Object.keys(grouped).length > 0) {
      return structuredClone(grouped);
    }

    const legacyOrders = this.storage.getSection('orders') ?? [];
    if (legacyOrders.length > 0) {
      const migrated = this.groupOrdersByMonth(legacyOrders);
      this.saveOrderBuckets(migrated);
      this.storage.clearSection('orders');
      return migrated;
    }

    return {};
  }

  private saveOrderBuckets(buckets: Record<string, Order[]>): void {
    this.storage.setSection('ordersByMonth', buckets);
  }

  private groupOrdersByMonth(orders: Order[]): Record<string, Order[]> {
    return orders.reduce<Record<string, Order[]>>((acc, order) => {
      const monthKey = this.getMonthKey(new Date(order.createdAt));
      acc[monthKey] ??= [];
      acc[monthKey].push(order);
      return acc;
    }, {});
  }

  private getMonthKey(date: Date): string {
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    return `${date.getFullYear()}-${month}`;
  }
}
