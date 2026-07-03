import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { Order } from '../models/order.model';

@Injectable({
  providedIn: 'root'
})
export class OrderHistoryService {
  private readonly apiUrl = 'http://localhost:3001/api/orders';

  readonly orders = signal<Order[]>([]);
  readonly loading = signal(false);
  readonly error = signal<string | null>(null);

  constructor(private readonly http: HttpClient) {}

  getOrders(): Order[] {
    const grouped = this.getMonthlyOrderBuckets();
    return Object.entries(grouped)
      .sort(([a], [b]) => b.localeCompare(a))
      .flatMap(([, orders]) =>
        [...orders].sort(
          (a, b) =>
            new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        )
      );
  }

  async loadOrders(): Promise<void> {
    this.loading.set(true);
    this.error.set(null);

    try {
      const orders = await firstValueFrom(this.http.get<Order[]>(this.apiUrl));
      this.orders.set(orders);
    } catch (error) {
      console.error('[order-history-service] failed to load orders', error);
      this.error.set('No fue posible cargar el historial desde MySQL.');
      this.orders.set([]);
    } finally {
      this.loading.set(false);
    }
  }

  async saveOrder(order: Order): Promise<void> {
    const savedOrder = await firstValueFrom(this.http.post<Order>(this.apiUrl, order));
    this.orders.set([savedOrder, ...this.orders()].sort(
      (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    ));
  }

  async updateOrderStatus(orderId: string, status: Order['status']): Promise<void> {
    const updated = await firstValueFrom(
      this.http.patch<Order>(`${this.apiUrl}/${orderId}/status`, { status })
    );

    this.orders.set(
      this.orders().map((order) => (order.id === orderId ? updated : order))
    );
  }

  async deleteOrder(orderId: string): Promise<void> {
    await firstValueFrom(this.http.delete<void>(`${this.apiUrl}/${orderId}`));
    this.orders.set(this.orders().filter((order) => order.id !== orderId));
  }

  async clearCurrentMonthOrders(): Promise<void> {
    const now = new Date();
    const monthKey = this.getMonthKey(now);
    const orders = await firstValueFrom(
      this.http.post<Order[]>(`${this.apiUrl}/clear-month`, { monthKey })
    );
    this.orders.set(orders);
  }

  async clearOrders(): Promise<void> {
    const orders = this.orders();
    await Promise.all(
      orders.map((order) =>
        firstValueFrom(this.http.delete<void>(`${this.apiUrl}/${order.id}`))
      )
    );
    this.orders.set([]);
  }

  getMonthlyOrderBuckets(): Record<string, Order[]> {
    return this.orders().reduce<Record<string, Order[]>>((acc, order) => {
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
