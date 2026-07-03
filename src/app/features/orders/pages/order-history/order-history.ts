import {
  CommonModule,
  CurrencyPipe,
  DatePipe,
  TitleCasePipe
} from '@angular/common';
import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Order } from '../../../../core/models/order.model';
import { OrderHistoryService } from '../../../../core/services/order-history.service';
import { ReceiptPrintService } from '../../../../core/services/receipt-print.service';

type StatusFilter =
  | 'todos'
  | 'pendiente'
  | 'en_preparacion'
  | 'listo'
  | 'entregado';

type HistoryViewMode = 'today' | 'all' | 'grouped';

type GroupedOrders = {
  label: string;
  dateKey: string;
  orders: Order[];
};

@Component({
  selector: 'app-order-history',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyPipe, DatePipe, TitleCasePipe],
  templateUrl: './order-history.html',
  styleUrl: './order-history.scss'
})
export class OrderHistoryComponent implements OnInit {
  private readonly historyService = inject(OrderHistoryService);
  private readonly receiptPrintService = inject(ReceiptPrintService);

  protected readonly orders = this.historyService.orders;
  protected readonly loading = this.historyService.loading;
  protected readonly error = this.historyService.error;
  protected readonly search = signal('');
  protected readonly statusFilter = signal<StatusFilter>('todos');
  protected readonly viewMode = signal<HistoryViewMode>('today');

  async ngOnInit(): Promise<void> {
    await this.historyService.loadOrders();
  }

  protected readonly filteredOrders = computed(() => {
    const term = this.search().trim().toLowerCase();
    const status = this.statusFilter();

    return this.orders()
      .filter((order) => {
        if (status !== 'todos' && order.status !== status) {
          return false;
        }

        if (!term) {
          return true;
        }

        const orderId = order.id.toLowerCase();
        const channel = order.orderChannel.toLowerCase();
        const orderType = order.orderType.toLowerCase();
        const customerName = (order.customerName ?? '').toLowerCase();
        const tableText = order.tableNumber ? `mesa ${order.tableNumber}` : '';
        const productsText = order.items.map((x) => x.name.toLowerCase()).join(' ');
        const saucesText = [
          ...(order.sauces ?? []),
          ...order.items
          .flatMap((x) => x.sauces ?? [])
        ]
          .map((x) => x.name.toLowerCase())
          .join(' ');

        return (
          orderId.includes(term) ||
          channel.includes(term) ||
          orderType.includes(term) ||
          customerName.includes(term) ||
          tableText.includes(term) ||
          productsText.includes(term) ||
          saucesText.includes(term)
        );
      })
      .sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
  });

  protected readonly todayOrders = computed(() => {
    const now = new Date();

    return this.filteredOrders().filter((order) =>
      this.isSameDay(new Date(order.createdAt), now)
    );
  });

  protected readonly groupedOrders = computed<GroupedOrders[]>(() => {
    const groups = new Map<string, Order[]>();

    for (const order of this.filteredOrders()) {
      const date = new Date(order.createdAt);
      const dateKey = this.getDateKey(date);

      if (!groups.has(dateKey)) {
        groups.set(dateKey, []);
      }

      groups.get(dateKey)!.push(order);
    }

    return Array.from(groups.entries()).map(([dateKey, orders]) => ({
      dateKey,
      label: this.getDateLabel(new Date(orders[0].createdAt)),
      orders
    }));
  });

  setStatusFilter(status: StatusFilter): void {
    this.statusFilter.set(status);
  }

  setViewMode(mode: HistoryViewMode): void {
    this.viewMode.set(mode);
  }

  updateSearch(value: string): void {
    this.search.set(value);
  }

  async refreshOrders(): Promise<void> {
    await this.historyService.loadOrders();
  }

  canDeleteOrder(order: Order): boolean {
    return order.status !== 'entregado';
  }

  async deleteOrder(order: Order): Promise<void> {
    if (!this.canDeleteOrder(order)) {
      return;
    }

    const confirmed = window.confirm(
      `¿Eliminar el pedido #${order.id.slice(-6)} de ${order.customerName ?? 'cliente sin nombre'}?`
    );

    if (!confirmed) {
      return;
    }

    await this.historyService.deleteOrder(order.id);
  }

  printOrder(order: Order): void {
    this.receiptPrintService.printKitchenTicket(order);
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

  private getDateKey(date: Date): string {
    return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
  }

  private getDateLabel(date: Date): string {
    const now = new Date();
    const yesterday = new Date();
    yesterday.setDate(now.getDate() - 1);

    if (this.isSameDay(date, now)) {
      return 'Hoy';
    }

    if (this.isSameDay(date, yesterday)) {
      return 'Ayer';
    }

    return date.toLocaleDateString('es-CL');
  }

  private isSameDay(a: Date, b: Date): boolean {
    return (
      a.getFullYear() === b.getFullYear() &&
      a.getMonth() === b.getMonth() &&
      a.getDate() === b.getDate()
    );
  }
}
