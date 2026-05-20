import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, ElementRef, ViewChild, computed, inject, signal } from '@angular/core';
import { ORDER_CHANNELS } from '../../../../core/data/order-channels';
import {
  SauceOption,
  SelectedSauce,
  SelectedExtra
} from '../../../../core/models/order-item.model';
import { Order } from '../../../../core/models/order.model';
import { Product } from '../../../../core/models/product.model';
import { MenuService } from '../../../../core/services/menu.service';
import { OrderHistoryService } from '../../../../core/services/order-history.service';
import { OrderService } from '../../../../core/services/order.service';
import { ReceiptPrintService } from '../../../../core/services/receipt-print.service';
import { TablesService } from '../../../../core/services/tables.service';
import { ProductDetailModalComponent } from '../../../../shared/components/product-detail-modal/product-detail-modal';

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, ProductDetailModalComponent],
  templateUrl: './catalog.html',
  styleUrl: './catalog.scss'
})
export class CatalogComponent {
  private readonly orderService = inject(OrderService);
  private readonly historyService = inject(OrderHistoryService);
  private readonly receiptPrintService = inject(ReceiptPrintService);
  private readonly menuService = inject(MenuService);
  private readonly tablesService = inject(TablesService);

  @ViewChild('customerNameInput') private customerNameInput?: ElementRef<HTMLInputElement>;

  protected readonly products = signal<Product[]>(this.menuService.getProducts());
  protected readonly search = signal('');
  protected readonly selectedCategory = signal<string>('Promos Black');
  protected readonly orderType = signal<'local' | 'retiro' | 'delivery'>('local');
  protected readonly selectedProduct = signal<Product | null>(null);

  protected readonly orderChannel = signal<
    'mesa' | 'retiro' | 'delivery' | 'uber_eats' | 'pedidos_ya' | 'rappi'
  >('mesa');

  protected readonly deliveryFee = signal(0);
  protected readonly selectedTable = signal<number | null>(1);
  protected readonly customerName = signal('');
  protected readonly tables = signal(this.tablesService.getTables());
  protected readonly channels = ORDER_CHANNELS;

  protected readonly categories = computed(() => {
    const unique = new Set(this.products().map((p) => p.category));
    return Array.from(unique);
  });

  protected readonly filteredProducts = computed(() => {
    const category = this.selectedCategory();
    const search = this.search().trim().toLowerCase();

    return this.products().filter(
      (p) =>
        p.active &&
        p.category === category &&
        (!search ||
          p.name.toLowerCase().includes(search) ||
          (p.description ?? '').toLowerCase().includes(search))
    );
  });

  protected readonly cartItems = this.orderService.items;
  protected readonly cartTotal = this.orderService.total;
  protected readonly cartCount = this.orderService.totalItems;
  protected readonly hasCustomerName = computed(
    () => this.customerName().trim().length > 0
  );
  protected readonly showCustomerNameError = signal(false);

  selectCategory(category: string): void {
    this.selectedCategory.set(category);
  }

  openProductModal(product: Product): void {
    this.selectedProduct.set(product);
  }

  closeProductModal(): void {
    this.selectedProduct.set(null);
  }

  addToCartFromModal(payload: {
    notes?: string;
    extras: SelectedExtra[];
    sauces: SelectedSauce[];
  }): void {
    const product = this.selectedProduct();
    if (!product) return;

    this.orderService.addProduct(product, payload.notes, payload.extras, payload.sauces);
    this.closeProductModal();
  }

  increase(uid: string): void {
    this.orderService.increase(uid);
  }

  decrease(uid: string): void {
    this.orderService.decrease(uid);
  }

  remove(uid: string): void {
    this.orderService.remove(uid);
  }

  clearCart(): void {
    this.orderService.clear();
  }

  isDelivery(): boolean {
    return this.orderType() === 'delivery';
  }

  setOrderType(type: 'local' | 'retiro' | 'delivery'): void {
    this.orderType.set(type);

    if (type !== 'delivery') {
      this.deliveryFee.set(0);
    }
  }

  setOrderChannel(
    channel: 'mesa' | 'retiro' | 'delivery' | 'uber_eats' | 'pedidos_ya' | 'rappi'
  ): void {
    this.orderChannel.set(channel);

    if (channel !== 'mesa') {
      this.selectedTable.set(null);
    } else if (this.selectedTable() === null) {
      const firstActive = this.tables().find((t) => t.active);
      this.selectedTable.set(firstActive?.id ?? null);
    }

    // sincroniza tipo de pedido con el canal
    if (channel === 'mesa') {
      this.setOrderType('local');
    } else if (channel === 'retiro') {
      this.setOrderType('retiro');
    } else {
      this.setOrderType('delivery');
    }
  }

  setSelectedTable(value: string): void {
    this.selectedTable.set(value ? Number(value) : null);
  }

  updateCustomerName(value: string): void {
    this.customerName.set(value);

    if (value.trim()) {
      this.showCustomerNameError.set(false);
    }
  }

  getDescriptionItems(description?: string): string[] {
    if (!description) {
      return [];
    }

    return description
      .split(' + ')
      .map((item) => item.trim())
      .filter(Boolean);
  }

  confirmOrder(): void {
    if (this.cartItems().length === 0) return;
    if (!this.hasCustomerName()) {
      this.showCustomerNameError.set(true);
      this.customerNameInput?.nativeElement.focus();
      this.customerNameInput?.nativeElement.scrollIntoView({
        behavior: 'smooth',
        block: 'center'
      });
      return;
    }

    const channel = this.orderChannel();

    let orderType: Order['orderType'];

    if (channel === 'mesa') {
      orderType = 'local';
    } else if (channel === 'retiro') {
      orderType = 'retiro';
    } else {
      orderType = 'delivery';
    }

    const productsTotal = this.cartTotal();
    const delivery = orderType === 'delivery' ? this.deliveryFee() : 0;

    const order: Order = {
      id: crypto.randomUUID(),
      items: this.cartItems(),
      total: productsTotal + delivery,
      deliveryFee: delivery > 0 ? delivery : undefined,
      orderType,
      orderChannel: channel,
      tableNumber: channel === 'mesa' ? this.selectedTable() ?? undefined : undefined,
      customerName: this.customerName().trim(),
      status: 'pendiente',
      createdAt: new Date().toISOString()
    };

    this.historyService.saveOrder(order);
    this.receiptPrintService.printKitchenTicket(order);
    this.orderService.clear();
    this.customerName.set('');
    this.showCustomerNameError.set(false);
    this.deliveryFee.set(0);

    if (channel === 'mesa') {
      const firstActive = this.tables().find((t) => t.active);
      this.selectedTable.set(firstActive?.id ?? null);
    }

    alert('Pedido guardado e impresión enviada');
  }
  
}
