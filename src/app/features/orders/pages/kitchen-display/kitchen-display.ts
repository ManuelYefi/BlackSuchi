import { CommonModule, DatePipe, TitleCasePipe } from '@angular/common';
import { Component, OnDestroy, OnInit, computed, inject, signal } from '@angular/core';
import { Order } from '../../../../core/models/order.model';
import { OrderHistoryService } from '../../../../core/services/order-history.service';

@Component({
  selector: 'app-kitchen-display',
  standalone: true,
  imports: [CommonModule, DatePipe, TitleCasePipe],
  templateUrl: './kitchen-display.html',
  styleUrl: './kitchen-display.scss'
})
export class KitchenDisplayComponent implements OnInit, OnDestroy {
  private readonly historyService = inject(OrderHistoryService);
  private refreshIntervalId: ReturnType<typeof setInterval> | null = null;

  protected readonly orders = signal<Order[]>([]);
  protected readonly showPreviousOrders = signal(false);
  protected readonly now = signal(new Date());
  protected readonly nextOrder = computed(() => {
    const orders = this.activeTodayOrders();
    return orders.length ? orders[0] : null;
  });
  protected readonly activeTodayOrders = computed(() => {
    const today = new Date();

    return this.orders()
      .filter((order) => {
        const orderDate = new Date(order.createdAt);
        return (
          this.isSameDay(orderDate, today) &&
          (order.status === 'pendiente' || order.status === 'en_preparacion')
        );
      })
      .sort((a, b) => {
        const statusWeight = (status: Order['status']) => {
          if (status === 'pendiente') return 0;
          if (status === 'en_preparacion') return 1;
          return 99;
        };

        const weightDiff = statusWeight(a.status) - statusWeight(b.status);
        if (weightDiff !== 0) return weightDiff;

        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      });
  });

  protected readonly readyTodayOrders = computed(() => {
    const today = new Date();

    return this.orders()
      .filter((order) => {
        const orderDate = new Date(order.createdAt);
        return this.isSameDay(orderDate, today) && order.status === 'listo';
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  });

  protected readonly previousOrders = computed(() => {
    const today = new Date();

    return this.orders()
      .filter((order) => !this.isSameDay(new Date(order.createdAt), today))
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  });

  ngOnInit(): void {
    this.loadOrders();

    this.refreshIntervalId = setInterval(() => {
      this.loadOrders();
    }, 5000);
    setInterval(() => {
      this.now.set(new Date());
    }, 1000);
    
  }

  ngOnDestroy(): void {
    if (this.refreshIntervalId) {
      clearInterval(this.refreshIntervalId);
    }
  }

  loadOrders(): void {
    this.orders.set(this.historyService.getOrders());
  }

  updateStatus(orderId: string, status: Order['status']): void {
    const updated = this.orders().map((order) =>
      order.id === orderId ? { ...order, status } : order
    );

    this.orders.set(updated);
    this.historyService.updateOrders(updated);
  }

  togglePreviousOrders(): void {
    this.showPreviousOrders.set(!this.showPreviousOrders());
  }

  getChannelLabel(channel: Order['orderChannel']): string {
    const labelMap: Record<Order['orderChannel'], string> = {
      mesa: 'Mesa',
      retiro: 'Retiro',
      delivery: 'Delivery',
      uber_eats: 'Uber Eats',
      pedidos_ya: 'PedidosYa',
      rappi: 'Rappi'
    };

    return labelMap[channel];
  }

  getSauceLines(order: Order): string[] {
    return order.items
      .filter((item) => (item.sauces?.length ?? 0) > 0)
      .map(
        (item) =>
          `${item.quantity}x ${item.name}: ${(item.sauces ?? [])
            .map((sauce) => `${sauce.name}${sauce.quantity > 1 ? ` x${sauce.quantity}` : ''}`)
            .join(', ')}`
      );
  }

  private isSameDay(a: Date, b: Date): boolean {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }
  getElapsedMinutes(date: string): number {
    const diff = this.now().getTime() - new Date(date).getTime();
    return Math.floor(diff / 60000);
  }
  
  getElapsedLabel(date: string): string {
    const minutes = this.getElapsedMinutes(date);
  
    if (minutes < 1) return 'Ahora';
    if (minutes < 60) return `${minutes} min`;
  
    const hours = Math.floor(minutes / 60);
    const rest = minutes % 60;
  
    return `${hours}h ${rest}m`;
  }
}
