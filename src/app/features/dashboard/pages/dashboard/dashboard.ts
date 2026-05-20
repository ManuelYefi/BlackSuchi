import { CommonModule, CurrencyPipe, DatePipe } from '@angular/common';
import { Component, computed, inject, signal } from '@angular/core';
import { Order } from '../../../../core/models/order.model';
import { OrderHistoryService } from '../../../../core/services/order-history.service';

type ChannelSummary = {
  channel: Order['orderChannel'];
  label: string;
  ordersCount: number;
  totalSales: number;
};

type ProductSummary = {
  productId: string;
  name: string;
  quantity: number;
  totalSales: number;
};

type TrendPoint = {
  label: string;
  totalSales: number;
  ordersCount: number;
};

type MonthlySnapshot = {
  monthKey: string;
  label: string;
  totalSales: number;
  ordersCount: number;
};

type RangeFilter = 'today' | 'yesterday' | 'last7days' | 'thisMonth';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, DatePipe],
  templateUrl: './dashboard.html',
  styleUrl: './dashboard.scss'
})
export class DashboardComponent {
  private readonly historyService = inject(OrderHistoryService);

  protected readonly orders = signal<Order[]>(this.historyService.getOrders());
  protected readonly selectedRange = signal<RangeFilter>('today');
  protected readonly monthlyBuckets = signal<Record<string, Order[]>>(
    this.historyService.getMonthlyOrderBuckets()
  );

  protected readonly filteredOrders = computed(() => {
    const range = this.selectedRange();
    const now = new Date();

    return this.orders().filter((order) => {
      const date = new Date(order.createdAt);

      if (range === 'today') {
        return this.isSameDay(date, now);
      }

      if (range === 'yesterday') {
        const yesterday = new Date(now);
        yesterday.setDate(now.getDate() - 1);
        return this.isSameDay(date, yesterday);
      }

      if (range === 'last7days') {
        const start = new Date(now);
        start.setDate(now.getDate() - 6);
        start.setHours(0, 0, 0, 0);
        return date >= start && date <= now;
      }

      if (range === 'thisMonth') {
        return (
          date.getFullYear() === now.getFullYear() &&
          date.getMonth() === now.getMonth()
        );
      }

      return true;
    });
  });

  protected readonly totalSales = computed(() =>
    this.filteredOrders().reduce((sum, order) => sum + order.total, 0)
  );

  protected readonly averageTicket = computed(() =>
    this.filteredOrders().length > 0
      ? this.totalSales() / this.filteredOrders().length
      : 0
  );

  protected readonly channelSummary = computed<ChannelSummary[]>(() => {
    const labelMap: Record<Order['orderChannel'], string> = {
      mesa: 'Mesa',
      retiro: 'Retiro',
      delivery: 'Delivery',
      uber_eats: 'Uber Eats',
      pedidos_ya: 'PedidosYa',
      rappi: 'Rappi'
    };

    const base: Record<Order['orderChannel'], ChannelSummary> = {
      mesa: { channel: 'mesa', label: 'Mesa', ordersCount: 0, totalSales: 0 },
      retiro: { channel: 'retiro', label: 'Retiro', ordersCount: 0, totalSales: 0 },
      delivery: { channel: 'delivery', label: 'Delivery', ordersCount: 0, totalSales: 0 },
      uber_eats: { channel: 'uber_eats', label: 'Uber Eats', ordersCount: 0, totalSales: 0 },
      pedidos_ya: { channel: 'pedidos_ya', label: 'PedidosYa', ordersCount: 0, totalSales: 0 },
      rappi: { channel: 'rappi', label: 'Rappi', ordersCount: 0, totalSales: 0 }
    };

    for (const order of this.filteredOrders()) {
      base[order.orderChannel].ordersCount += 1;
      base[order.orderChannel].totalSales += order.total;
    }

    return Object.values(base).sort((a, b) => b.totalSales - a.totalSales);
  });

  protected readonly productSummary = computed<ProductSummary[]>(() => {
    const map = new Map<string, ProductSummary>();

    for (const order of this.filteredOrders()) {
      for (const item of order.items) {
        const current = map.get(item.productId);

        if (current) {
          current.quantity += item.quantity;
          current.totalSales += item.subtotal;
        } else {
          map.set(item.productId, {
            productId: item.productId,
            name: item.name,
            quantity: item.quantity,
            totalSales: item.subtotal
          });
        }
      }
    }

    return Array.from(map.values()).sort((a, b) => b.quantity - a.quantity);
  });

  protected readonly topChannel = computed(() => {
    const summary = this.channelSummary().filter((x) => x.ordersCount > 0);
    return summary.length ? summary[0] : null;
  });

  protected readonly topProduct = computed(() => {
    const summary = this.productSummary();
    return summary.length ? summary[0] : null;
  });

  protected readonly salesTrend = computed<TrendPoint[]>(() => {
    const orders = this.filteredOrders();
    const range = this.selectedRange();
    const map = new Map<string, TrendPoint>();

    for (const order of orders) {
      const date = new Date(order.createdAt);
      const key = `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
      const label =
        range === 'today'
          ? date.toLocaleTimeString('es-CL', {
              hour: '2-digit',
              minute: '2-digit'
            })
          : date.toLocaleDateString('es-CL', {
              day: '2-digit',
              month: '2-digit'
            });

      const current = map.get(key);
      if (current) {
        current.totalSales += order.total;
        current.ordersCount += 1;
      } else {
        map.set(key, {
          label,
          totalSales: order.total,
          ordersCount: 1
        });
      }
    }

    return Array.from(map.values()).sort((a, b) => a.label.localeCompare(b.label));
  });

  protected readonly maxTrendSales = computed(() =>
    Math.max(...this.salesTrend().map((item) => item.totalSales), 0)
  );

  protected readonly monthlySnapshots = computed<MonthlySnapshot[]>(() => {
    return Object.entries(this.monthlyBuckets())
      .map(([monthKey, orders]) => ({
        monthKey,
        label: this.getMonthLabel(monthKey),
        totalSales: orders.reduce((sum, order) => sum + order.total, 0),
        ordersCount: orders.length
      }))
      .sort((a, b) => b.monthKey.localeCompare(a.monthKey));
  });

  protected readonly currentMonthSnapshot = computed(() => {
    const currentKey = this.getMonthKey(new Date());
    return this.monthlySnapshots().find((item) => item.monthKey === currentKey) ?? null;
  });

  setRange(range: RangeFilter): void {
    this.selectedRange.set(range);
  }

  refreshDashboard(): void {
    this.orders.set(this.historyService.getOrders());
    this.monthlyBuckets.set(this.historyService.getMonthlyOrderBuckets());
  }

  resetCurrentMonthData(): void {
    const confirmed = window.confirm(
      'Se reiniciara a cero la data del mes en curso. Esta accion no se puede deshacer. Deseas continuar?'
    );

    if (!confirmed) {
      return;
    }

    this.historyService.clearCurrentMonthOrders();
    this.refreshDashboard();
    this.selectedRange.set('thisMonth');
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

  getRangeLabel(): string {
    const labels: Record<RangeFilter, string> = {
      today: 'Hoy',
      yesterday: 'Ayer',
      last7days: 'Últimos 7 días',
      thisMonth: 'Este mes'
    };

    return labels[this.selectedRange()];
  }

  getTrendWidth(totalSales: number): number {
    const max = this.maxTrendSales();
    return max > 0 ? (totalSales / max) * 100 : 0;
  }

  private isSameDay(a: Date, b: Date): boolean {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }

  private getMonthLabel(monthKey: string): string {
    const [year, month] = monthKey.split('-').map(Number);
    const date = new Date(year, month - 1, 1);

    return date.toLocaleDateString('es-CL', {
      month: 'long',
      year: 'numeric'
    });
  }

  private getMonthKey(date: Date): string {
    const month = `${date.getMonth() + 1}`.padStart(2, '0');
    return `${date.getFullYear()}-${month}`;
  }
}
