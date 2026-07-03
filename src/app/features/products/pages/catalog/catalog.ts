import { CommonModule, CurrencyPipe } from '@angular/common';
import { Component, ElementRef, OnInit, ViewChild, computed, inject, signal } from '@angular/core';
import { ORDER_CHANNELS } from '../../../../core/data/order-channels';
import {
  ACEVICHADA_SAUCE_PRICE,
  EXTRA_SAUCE_PRICE,
  OrderItem,
  SAUCE_OPTIONS,
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

type CustomSinArrozPreset = {
  id: string;
  description: string;
  basePrice: number;
  extras: SelectedExtra[];
  count: number;
  lastOrderedAt: string;
};

type RepeatedRollPreset = {
  id: string;
  productId: string;
  productName: string;
  description: string;
  basePrice: number;
  extras: SelectedExtra[];
  count: number;
  lastOrderedAt: string;
};

@Component({
  selector: 'app-catalog',
  standalone: true,
  imports: [CommonModule, CurrencyPipe, ProductDetailModalComponent],
  templateUrl: './catalog.html',
  styleUrl: './catalog.scss'
})
export class CatalogComponent implements OnInit {
  private readonly orderService = inject(OrderService);
  private readonly historyService = inject(OrderHistoryService);
  private readonly receiptPrintService = inject(ReceiptPrintService);
  private readonly menuService = inject(MenuService);
  private readonly tablesService = inject(TablesService);

  @ViewChild('customerNameInput') private customerNameInput?: ElementRef<HTMLInputElement>;
  @ViewChild('chopsticksCountInput') private chopsticksCountInput?: ElementRef<HTMLInputElement>;

  protected readonly products = this.menuService.products;
  protected readonly menuLoading = this.menuService.loading;
  protected readonly menuError = this.menuService.error;
  protected readonly search = signal('');
  protected readonly selectedCategory = signal<string>('Promos Black');
  protected readonly orderType = signal<'local' | 'retiro' | 'delivery'>('local');
  protected readonly selectedProduct = signal<Product | null>(null);
  protected readonly editingItem = signal<OrderItem | null>(null);
  protected readonly prefillItem = signal<OrderItem | null>(null);

  protected readonly orderChannel = signal<
    'mesa' | 'retiro' | 'delivery' | 'uber_eats' | 'pedidos_ya' | 'rappi'
  >('mesa');

  protected readonly deliveryFee = signal(0);
  protected readonly chopsticksCount = signal<number | null>(null);
  protected readonly selectedSauces = signal<SelectedSauce[]>([]);
  protected readonly selectedTable = signal<number | null>(1);
  protected readonly customerName = signal('');
  protected readonly tables = this.tablesService.tables;
  protected readonly tablesLoading = this.tablesService.loading;
  protected readonly tablesError = this.tablesService.error;
  protected readonly channels = ORDER_CHANNELS;
  protected readonly availableSauces = SAUCE_OPTIONS;
  protected readonly historyOrders = this.historyService.orders;

  protected readonly categories = computed(() => {
    const unique = new Set(this.products().map((p) => p.category));
    return Array.from(unique);
  });

  protected readonly filteredProducts = computed(() => {
    const category = this.selectedCategory();
    const search = this.search().trim().toLowerCase();

    const products = this.products().filter(
      (p) =>
        p.active &&
        p.category === category &&
        (!search ||
          p.name.toLowerCase().includes(search) ||
          (p.description ?? '').toLowerCase().includes(search))
    );

    if (category !== 'Roll Sin Arroz') {
      return products;
    }

    return [...products].sort((a, b) => {
      const aRank = this.getSinArrozDisplayRank(a);
      const bRank = this.getSinArrozDisplayRank(b);

      if (aRank !== bRank) {
        return aRank - bRank;
      }

      return a.name.localeCompare(b.name, 'es');
    });
  });
  protected readonly frequentProducts = computed(() => {
    const salesMap = new Map<string, { product: Product; quantity: number }>();
    const activeProducts = this.products().filter((product) => product.active);
    const activeMap = new Map(activeProducts.map((product) => [product.id, product]));

    for (const order of this.historyOrders()) {
      for (const item of order.items) {
        const product = activeMap.get(item.productId);
        if (!product) continue;

        const current = salesMap.get(item.productId);
        if (current) {
          current.quantity += item.quantity;
        } else {
          salesMap.set(item.productId, { product, quantity: item.quantity });
        }
      }
    }

    const ranked = Array.from(salesMap.values())
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 6)
      .map((entry) => entry.product);

    if (ranked.length >= 4) {
      return ranked;
    }

    const fallback = activeProducts
      .filter((product) => !ranked.some((rankedProduct) => rankedProduct.id === product.id))
      .slice(0, 6 - ranked.length);

    return [...ranked, ...fallback];
  });
  protected readonly repeatedCustomSinArrozPresets = computed<CustomSinArrozPreset[]>(() => {
    const presets = new Map<string, CustomSinArrozPreset>();

    for (const order of this.historyOrders()) {
      for (const item of order.items) {
        if (item.productId !== 'sin-arroz-personalizable' || !item.description) {
          continue;
        }

        const extras = (item.extras ?? []).map((extra) => ({ ...extra }));
        const extrasTotal = extras.reduce((sum, extra) => sum + extra.price * extra.quantity, 0);
        const basePrice = Math.max(0, (item.baseUnitPrice ?? item.unitPrice) - extrasTotal);
        const extrasKey = extras
          .slice()
          .sort((a, b) => a.id.localeCompare(b.id))
          .map((extra) => `${extra.id}:${extra.quantity}`)
          .join('|');
        const key = `${item.description}::${basePrice}::${extrasKey}`;
        const current = presets.get(key);

        if (current) {
          current.count += item.quantity;

          if (new Date(order.createdAt).getTime() > new Date(current.lastOrderedAt).getTime()) {
            current.lastOrderedAt = order.createdAt;
          }
        } else {
          presets.set(key, {
            id: key,
            description: item.description,
            basePrice,
            extras,
            count: item.quantity,
            lastOrderedAt: order.createdAt
          });
        }
      }
    }

    return Array.from(presets.values())
      .sort((a, b) => {
        if (b.count !== a.count) {
          return b.count - a.count;
        }

        return new Date(b.lastOrderedAt).getTime() - new Date(a.lastOrderedAt).getTime();
      })
      .slice(0, 6);
  });
  protected readonly repeatedModifiedRollPresets = computed<RepeatedRollPreset[]>(() => {
    const category = this.selectedCategory();
    const productMap = new Map(this.products().map((product) => [product.id, product]));
    const presets = new Map<string, RepeatedRollPreset>();

    for (const order of this.historyOrders()) {
      for (const item of order.items) {
        const product = productMap.get(item.productId);

        if (
          !product ||
          product.category !== category ||
          product.id === 'sin-arroz-personalizable' ||
          !this.isRepeatedRollCandidate(product, item)
        ) {
          continue;
        }

        const extras = (item.extras ?? []).map((extra) => ({ ...extra }));
        const extrasTotal = extras.reduce((sum, extra) => sum + extra.price * extra.quantity, 0);
        const basePrice = Math.max(0, (item.baseUnitPrice ?? item.unitPrice) - extrasTotal);
        const extrasKey = extras
          .slice()
          .sort((a, b) => a.id.localeCompare(b.id))
          .map((extra) => `${extra.id}:${extra.quantity}`)
          .join('|');
        const key = `${item.productId}::${item.description ?? ''}::${basePrice}::${extrasKey}`;
        const current = presets.get(key);

        if (current) {
          current.count += item.quantity;

          if (new Date(order.createdAt).getTime() > new Date(current.lastOrderedAt).getTime()) {
            current.lastOrderedAt = order.createdAt;
          }
        } else {
          presets.set(key, {
            id: key,
            productId: item.productId,
            productName: item.name,
            description: item.description ?? product.description ?? '',
            basePrice,
            extras,
            count: item.quantity,
            lastOrderedAt: order.createdAt
          });
        }
      }
    }

    return Array.from(presets.values())
      .sort((a, b) => {
        if (b.count !== a.count) {
          return b.count - a.count;
        }

        return new Date(b.lastOrderedAt).getTime() - new Date(a.lastOrderedAt).getTime();
      })
      .slice(0, 6);
  });

  protected readonly cartItems = this.orderService.items;
  protected readonly cartTotal = this.orderService.total;
  protected readonly cartCount = this.orderService.totalItems;
  protected readonly sauceCharge = computed(() =>
    this.selectedSauces().reduce((sum, sauce) => {
      if (sauce.name === 'Acevichada') {
        return sum + sauce.quantity * ACEVICHADA_SAUCE_PRICE;
      }

      if (sauce.name === 'Extra salsa') {
        return sum + sauce.quantity * EXTRA_SAUCE_PRICE;
      }

      return sum;
    }, 0)
  );
  protected readonly hasCustomerName = computed(
    () => this.customerName().trim().length > 0
  );
  protected readonly hasChopsticksSelection = computed(
    () => this.chopsticksCount() !== null
  );
  protected readonly showCustomerNameError = signal(false);
  protected readonly showChopsticksError = signal(false);

  async ngOnInit(): Promise<void> {
    await Promise.all([
      this.menuService.loadProducts(),
      this.tablesService.loadTables(),
      this.historyService.loadOrders()
    ]);
  }

  selectCategory(category: string): void {
    this.selectedCategory.set(category);
  }

  openProductModal(product: Product): void {
    this.editingItem.set(null);
    this.prefillItem.set(null);
    this.selectedProduct.set(product);
  }

  openQuickCustomize(product: Product): void {
    this.openProductModal(product);
  }

  quickAddProduct(product: Product): void {
    if (this.requiresConfiguration(product)) {
      this.openProductModal(product);
      return;
    }

    this.orderService.addProduct(product);
  }

  editCartItem(item: OrderItem): void {
    const product =
      this.products().find((productItem) => productItem.id === item.productId) ?? null;

    if (!product) {
      return;
    }

    this.editingItem.set(item);
    this.prefillItem.set(null);
    this.selectedProduct.set(product);
  }

  repeatCustomSinArrozPreset(preset: CustomSinArrozPreset): void {
    const product = this.getCustomSinArrozProduct();

    if (!product) {
      return;
    }

    this.orderService.addProduct(
      product,
      undefined,
      preset.extras.map((extra) => ({ ...extra })),
      [],
      preset.description,
      preset.basePrice
    );
  }

  async createProductFromCustomSinArrozPreset(preset: CustomSinArrozPreset): Promise<void> {
    const sourceProduct = this.getCustomSinArrozProduct();

    if (!sourceProduct) {
      return;
    }

    const product: Product = {
      id: `custom-${crypto.randomUUID()}`,
      name: this.getUniqueDerivedProductName('Sin Arroz Favorito'),
      category: 'Roll Sin Arroz',
      description: preset.description,
      price: preset.basePrice,
      active: true,
      allowsNotes: true,
      allowsProteinChange: false,
      availableExtras: [...(sourceProduct.availableExtras ?? [])]
    };

    await this.menuService.createProduct(product);
    alert(`Se agregó "${product.name}" como producto nuevo en Roll Sin Arroz.`);
  }

  customizeCustomSinArrozPreset(preset: CustomSinArrozPreset): void {
    const product = this.getCustomSinArrozProduct();

    if (!product) {
      return;
    }

    const totalExtras = preset.extras.reduce((sum, extra) => sum + extra.price * extra.quantity, 0);

    this.editingItem.set(null);
    this.prefillItem.set({
      uid: `preset-${crypto.randomUUID()}`,
      productId: product.id,
      name: product.name,
      description: preset.description,
      quantity: 1,
      baseUnitPrice: preset.basePrice + totalExtras,
      unitPrice: preset.basePrice + totalExtras,
      sauceCharge: 0,
      subtotal: preset.basePrice + totalExtras,
      extras: preset.extras.map((extra) => ({ ...extra })),
      sauces: []
    });
    this.selectedProduct.set(product);
  }

  repeatModifiedRollPreset(preset: RepeatedRollPreset): void {
    const product = this.products().find((item) => item.id === preset.productId) ?? null;

    if (!product) {
      return;
    }

    this.orderService.addProduct(
      product,
      undefined,
      preset.extras.map((extra) => ({ ...extra })),
      [],
      preset.description,
      preset.basePrice
    );
  }

  async createProductFromModifiedRollPreset(preset: RepeatedRollPreset): Promise<void> {
    const sourceProduct = this.products().find((item) => item.id === preset.productId) ?? null;

    if (!sourceProduct) {
      return;
    }

    const product: Product = {
      id: `custom-${crypto.randomUUID()}`,
      name: this.getUniqueDerivedProductName(`${sourceProduct.name} Favorito`),
      category: sourceProduct.category,
      description: preset.description,
      price: preset.basePrice,
      active: true,
      allowsNotes: sourceProduct.allowsNotes,
      allowsProteinChange: sourceProduct.allowsProteinChange,
      availableExtras: [...(sourceProduct.availableExtras ?? [])]
    };

    await this.menuService.createProduct(product);
    alert(`Se agregó "${product.name}" como producto nuevo en ${product.category}.`);
  }

  customizeModifiedRollPreset(preset: RepeatedRollPreset): void {
    const product = this.products().find((item) => item.id === preset.productId) ?? null;

    if (!product) {
      return;
    }

    const totalExtras = preset.extras.reduce((sum, extra) => sum + extra.price * extra.quantity, 0);

    this.editingItem.set(null);
    this.prefillItem.set({
      uid: `preset-${crypto.randomUUID()}`,
      productId: product.id,
      name: product.name,
      description: preset.description,
      quantity: 1,
      baseUnitPrice: preset.basePrice + totalExtras,
      unitPrice: preset.basePrice + totalExtras,
      sauceCharge: 0,
      subtotal: preset.basePrice + totalExtras,
      extras: preset.extras.map((extra) => ({ ...extra })),
      sauces: []
    });
    this.selectedProduct.set(product);
  }

  closeProductModal(): void {
    this.selectedProduct.set(null);
    this.editingItem.set(null);
    this.prefillItem.set(null);
  }

  addToCartFromModal(payload: {
    notes?: string;
    extras: SelectedExtra[];
    sauces: SelectedSauce[];
    descriptionOverride?: string;
    basePriceOverride?: number;
  }): void {
    const product = this.selectedProduct();
    if (!product) return;

    const editingItem = this.editingItem();

    if (editingItem) {
      this.orderService.updateItemConfiguration(
        editingItem.uid,
        product,
        payload.notes,
        payload.extras,
        payload.sauces,
        payload.descriptionOverride,
        payload.basePriceOverride
      );
    } else {
      this.orderService.addProduct(
        product,
        payload.notes,
        payload.extras,
        payload.sauces,
        payload.descriptionOverride,
        payload.basePriceOverride
      );
    }

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
    this.selectedSauces.set([]);
  }

  increaseSauce(sauce: SauceOption): void {
    this.setSauceQuantity(sauce, this.getSauceQuantity(sauce) + 1);
  }

  decreaseSauce(sauce: SauceOption): void {
    this.setSauceQuantity(sauce, this.getSauceQuantity(sauce) - 1);
  }

  getSauceQuantity(sauce: SauceOption): number {
    return this.selectedSauces().find((item) => item.name === sauce)?.quantity ?? 0;
  }

  setSauceQuantity(sauce: SauceOption, quantity: number): void {
    const safeQuantity = Math.max(0, Math.floor(quantity));

    this.selectedSauces.update((current) => {
      const withoutSauce = current.filter((item) => item.name !== sauce);

      if (safeQuantity <= 0) {
        return withoutSauce;
      }

      return [...withoutSauce, { name: sauce, quantity: safeQuantity }];
    });
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

  updateChopsticksCount(value: string): void {
    const parsed = Number(value);
    if (!value.trim()) {
      this.chopsticksCount.set(null);
      return;
    }

    this.chopsticksCount.set(Number.isFinite(parsed) && parsed >= 0 ? Math.floor(parsed) : 0);
    this.showChopsticksError.set(false);
  }

  setChopsticksCount(value: number): void {
    this.chopsticksCount.set(Math.max(0, Math.floor(value)));
    this.showChopsticksError.set(false);
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

  isCustomPriceProduct(product: Product): boolean {
    return product.id === 'sin-arroz-personalizable';
  }

  requiresConfiguration(product: Product): boolean {
    return this.isCustomPriceProduct(product);
  }

  private getSinArrozDisplayRank(product: Product): number {
    const rankMap: Record<string, number> = {
      'sin-arroz-personalizable': 0,
      'sin-arroz-a-envuelto-palta': 1,
      'sin-arroz-b-envuelto-queso': 2,
      'sin-arroz-c-tempura': 3,
      'sin-arroz-c-envuelto-palta': 4,
      'sin-arroz-c-envuelto-queso': 5,
      'sin-arroz-d-tempura': 6
    };

    return rankMap[product.id] ?? 99;
  }

  private getCustomSinArrozProduct(): Product | null {
    return this.products().find((product) => product.id === 'sin-arroz-personalizable') ?? null;
  }

  private getUniqueDerivedProductName(baseName: string): string {
    const existingNames = new Set(this.products().map((product) => product.name.toLowerCase()));

    if (!existingNames.has(baseName.toLowerCase())) {
      return baseName;
    }

    let index = 2;
    let candidate = `${baseName} ${index}`;

    while (existingNames.has(candidate.toLowerCase())) {
      index += 1;
      candidate = `${baseName} ${index}`;
    }

    return candidate;
  }

  private isRepeatedRollCandidate(product: Product, item: OrderItem): boolean {
    if (!item.description || item.description === product.description) {
      return false;
    }

    const category = product.category.toLowerCase();
    const rollCategories = [
      'tempura',
      'panko',
      'envuelto',
      'envueltos',
      'sésamo',
      'sesamo',
      'salmón',
      'salmon'
    ];

    return rollCategories.some((entry) => category.includes(entry));
  }

  async confirmOrder(): Promise<void> {
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
    if (!this.hasChopsticksSelection()) {
      this.showChopsticksError.set(true);
      this.chopsticksCountInput?.nativeElement.focus();
      this.chopsticksCountInput?.nativeElement.scrollIntoView({
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
    const sauceCharge = this.sauceCharge();
    const delivery = orderType === 'delivery' ? this.deliveryFee() : 0;
    const sauces = this.selectedSauces().filter((sauce) => sauce.quantity > 0);

    const order: Order = {
      id: crypto.randomUUID(),
      items: this.cartItems(),
      total: productsTotal + sauceCharge + delivery,
      sauceCharge: sauceCharge > 0 ? sauceCharge : undefined,
      sauces: sauces.length ? sauces : undefined,
      deliveryFee: delivery > 0 ? delivery : undefined,
      chopsticksCount: this.chopsticksCount() ?? 0,
      orderType,
      orderChannel: channel,
      tableNumber: channel === 'mesa' ? this.selectedTable() ?? undefined : undefined,
      customerName: this.customerName().trim(),
      status: 'pendiente',
      createdAt: new Date().toISOString()
    };

    await this.historyService.saveOrder(order);
    this.receiptPrintService.printKitchenTicket(order);
    this.orderService.clear();
    this.customerName.set('');
    this.showCustomerNameError.set(false);
    this.deliveryFee.set(0);
    this.selectedSauces.set([]);
    this.chopsticksCount.set(null);
    this.showChopsticksError.set(false);

    if (channel === 'mesa') {
      const firstActive = this.tables().find((t) => t.active);
      this.selectedTable.set(firstActive?.id ?? null);
    }

    alert('Pedido guardado e impresión enviada');
  }
  
}
