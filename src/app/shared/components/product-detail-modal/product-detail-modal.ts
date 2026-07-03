import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, OnInit, Output, computed, signal } from '@angular/core';
import {
  EXTRA_OPTIONS,
  PROTEIN_CHANGE_OPTION
} from '../../../core/data/menu-options';
import {
  OrderItem,
  SelectedSauce,
  SelectedExtra
} from '../../../core/models/order-item.model';
import { Product, ProductOption } from '../../../core/models/product.model';

type PromoRollConfig = {
  id: string;
  cuts: string;
  wrap: string;
  originalWrap: string;
  protein: string;
  originalProtein: string;
  ingredients: string[];
  originalIngredients: string[];
};

@Component({
  selector: 'app-product-detail-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-detail-modal.html',
  styleUrl: './product-detail-modal.scss'
})
export class ProductDetailModalComponent implements OnInit {
  private readonly sinArrozProteinOptions = [
    'Salmón',
    'Camarón',
    'Kanikama',
    'Carne',
    'Pollo',
    'Atún',
    'Pulpo'
  ];
  private readonly sinArrozFillingOptions = [
    'Queso',
    'Cebollino',
    'Palta',
    'Palmito',
    'Pimentón',
    'Champiñón'
  ];
  private readonly sinArrozWrapOptions = [
    'Envuelto en palta',
    'Envuelto en queso',
    'Tempura',
    'Envuelto en salmón',
    'Envuelto en atún'
  ];
  private readonly promoProteinOptions = [
    'Pollo',
    'Kanikama',
    'Camarón',
    'Camarón apanado',
    'Salmón',
    'Carne',
    'Atún',
    'Pulpo'
  ];
  private readonly promoWrapOptions = [
    'Tempura',
    'Sésamo',
    'Envueltos en palta',
    'Envueltos en queso',
    'Envuelto en palta',
    'Envuelto en queso',
    'Envuelto en salmón',
    'Handroll',
    'Envuelto en nori'
  ];
  private readonly promoIngredientOptions = [
    'Queso',
    'Queso crema',
    'Cebollín',
    'Cebollino',
    'Palta',
    'Pimentón',
    'Champiñón',
    'Palmito',
    'Aceitunas',
    'Choclillo'
  ];

  @Input({ required: true }) product!: Product;
  @Input() existingItem: OrderItem | null = null;
  @Output() closeModal = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<{
    notes?: string;
    extras: SelectedExtra[];
    sauces: SelectedSauce[];
    descriptionOverride?: string;
    basePriceOverride?: number;
  }>();

  protected readonly notes = signal('');
  protected readonly selectedExtras = signal<SelectedExtra[]>([]);
  protected readonly selectedSinArrozWrap = signal('');
  protected readonly selectedSinArrozProteins = signal<string[]>([]);
  protected readonly selectedSinArrozFillings = signal<string[]>([]);
  protected readonly editableRoll = signal<PromoRollConfig | null>(null);
  protected readonly promoRolls = signal<PromoRollConfig[]>([]);
  protected readonly customSinArrozPrice = signal('');
  protected readonly availableExtras = EXTRA_OPTIONS;
  protected readonly PROTEIN_CHANGE_OPTION = PROTEIN_CHANGE_OPTION;
  protected readonly isSinArrozProduct = computed(
    () => this.product.category === 'Roll Sin Arroz'
  );
  protected readonly isSinArrozCustomProduct = computed(
    () => this.product.id === 'sin-arroz-personalizable'
  );
  protected readonly isPromoProduct = computed(() => this.isPromoCandidate());
  protected readonly isEditableRollProduct = computed(() => this.isEditableRollCandidate());
  protected readonly sinArrozConfig = computed(() => this.getSinArrozConfig());
  protected readonly sinArrozWrapLabel = computed(() => this.selectedSinArrozWrap());
  protected readonly sinArrozSummary = computed(() => {
    const proteins = this.selectedSinArrozProteins();
    const fillings = this.selectedSinArrozFillings();
    const pieces = [this.sinArrozWrapLabel(), [...proteins, ...fillings].join(', ')]
      .filter(Boolean);

    return pieces.join('. ');
  });
  protected readonly totalExtras = computed(() =>
    [...this.selectedExtras(), ...this.promoAddonExtras()].reduce(
      (sum, extra) => sum + extra.price * extra.quantity,
      0
    )
  );
  protected readonly totalAddons = computed(() => this.totalExtras());
  protected readonly canConfirmSinArroz = computed(() => {
    const config = this.sinArrozConfig();
    const hasRequiredProteins = config.requiredProteins.every((protein) =>
      this.selectedSinArrozProteins().includes(protein)
    );
    const hasWrap = this.selectedSinArrozWrap().trim().length > 0;
    const hasAtLeastOneProtein = this.selectedSinArrozProteins().length > 0;
    const withinAdditionalLimit =
      this.selectedSinArrozProteins().length <=
      config.requiredProteins.length + config.optionalProteinLimit;
    const hasCustomPrice =
      !this.isSinArrozCustomProduct() || Number(this.customSinArrozPrice()) > 0;

    return hasWrap && hasAtLeastOneProtein && hasRequiredProteins && withinAdditionalLimit && hasCustomPrice;
  });
  protected readonly sinArrozBasePricePreview = computed(() => {
    if (!this.isSinArrozCustomProduct()) {
      return this.product.price;
    }

    return Number(this.customSinArrozPrice()) || 0;
  });

  ngOnInit(): void {
    this.notes.set(this.existingItem?.notes ?? '');
    this.selectedExtras.set(
      [...(this.existingItem?.extras ?? [])].filter(
        (extra) => !extra.id.includes('-promo-roll-')
      )
    );

    if (this.isSinArrozProduct()) {
      this.initializeSinArrozBuilder();
    }

    if (this.isPromoProduct()) {
      this.initializePromoBuilder();
    }

    if (this.isEditableRollProduct()) {
      this.initializeEditableRollBuilder();
    }
  }

  increaseExtra(option: ProductOption): void {
    const current = [...this.selectedExtras()];
    const index = current.findIndex((x) => x.id === option.id);

    if (index >= 0) {
      current[index] = {
        ...current[index],
        quantity: current[index].quantity + 1
      };
    } else {
      current.push({
        id: option.id,
        name: option.name,
        price: option.price,
        type: option.type,
        quantity: 1
      });
    }

    this.selectedExtras.set(current);
  }

  decreaseExtra(option: ProductOption): void {
    const current = [...this.selectedExtras()];
    const index = current.findIndex((x) => x.id === option.id);

    if (index < 0) return;

    const updatedQuantity = current[index].quantity - 1;

    if (updatedQuantity <= 0) {
      this.selectedExtras.set(current.filter((x) => x.id !== option.id));
      return;
    }

    current[index] = {
      ...current[index],
      quantity: updatedQuantity
    };

    this.selectedExtras.set(current);
  }

  increaseProteinChange(): void {
    this.increaseExtra(PROTEIN_CHANGE_OPTION);
  }

  decreaseProteinChange(): void {
    this.decreaseExtra(PROTEIN_CHANGE_OPTION);
  }

  getExtraQuantity(optionId: string): number {
    return this.selectedExtras().find((x) => x.id === optionId)?.quantity ?? 0;
  }

  toggleSinArrozProtein(option: string): void {
    if (this.isSinArrozProteinLocked(option)) {
      return;
    }

    this.selectedSinArrozProteins.update((current) => {
      if (current.includes(option)) {
        return current.filter((item) => item !== option);
      }

      const maxProteins =
        this.sinArrozConfig().requiredProteins.length + this.sinArrozConfig().optionalProteinLimit;

      if (current.length >= maxProteins) {
        return current;
      }

      return [...current, option];
    });
  }

  toggleSinArrozFilling(option: string): void {
    this.selectedSinArrozFillings.update((current) => {
      if (current.includes(option)) {
        return current.filter((item) => item !== option);
      }

      return [...current, option];
    });
  }

  isSinArrozProteinSelected(option: string): boolean {
    return this.selectedSinArrozProteins().includes(option);
  }

  isSinArrozFillingSelected(option: string): boolean {
    return this.selectedSinArrozFillings().includes(option);
  }

  selectSinArrozWrap(option: string): void {
    this.selectedSinArrozWrap.set(option);
  }

  getSinArrozProteinOptions(): string[] {
    return this.sinArrozProteinOptions;
  }

  getSinArrozFillingOptions(): string[] {
    return this.sinArrozFillingOptions;
  }

  getSinArrozWrapOptions(): string[] {
    return this.sinArrozWrapOptions;
  }

  isSinArrozProteinLocked(option: string): boolean {
    return this.sinArrozConfig().requiredProteins.includes(option);
  }

  updateCustomSinArrozPrice(value: string): void {
    const sanitized = value.replace(/[^\d]/g, '');
    this.customSinArrozPrice.set(sanitized);
  }

  getPromoProteinOptions(): string[] {
    return this.promoProteinOptions;
  }

  getPromoWrapOptions(): string[] {
    return this.promoWrapOptions;
  }

  getPromoIngredientOptions(): string[] {
    return this.promoIngredientOptions;
  }

  setEditableRollProtein(protein: string): void {
    this.updateEditableRoll((roll) => ({
      ...roll,
      protein
    }));
  }

  setEditableRollWrap(wrap: string): void {
    this.updateEditableRoll((roll) => ({
      ...roll,
      wrap
    }));
  }

  toggleEditableRollIngredient(ingredient: string): void {
    this.updateEditableRoll((roll) => {
      const exists = roll.ingredients.some((item) => this.sameText(item, ingredient));

      return {
        ...roll,
        ingredients: exists
          ? roll.ingredients.filter((item) => !this.sameText(item, ingredient))
          : [...roll.ingredients, ingredient]
      };
    });
  }

  isEditableRollIngredientSelected(ingredient: string): boolean {
    const roll = this.editableRoll();
    return roll?.ingredients.some((item) => this.sameText(item, ingredient)) ?? false;
  }

  isEditableRollOriginalIngredient(ingredient: string): boolean {
    const roll = this.editableRoll();
    return roll?.originalIngredients.some((item) => this.sameText(item, ingredient)) ?? false;
  }

  formatEditableRollResult(): string {
    const roll = this.editableRoll();
    return roll ? this.formatSingleRoll(roll) : '';
  }

  setPromoRollProtein(rollId: string, protein: string): void {
    this.updatePromoRoll(rollId, (roll) => ({
      ...roll,
      protein
    }));
  }

  setPromoRollWrap(rollId: string, wrap: string): void {
    this.updatePromoRoll(rollId, (roll) => ({
      ...roll,
      wrap
    }));
  }

  togglePromoRollIngredient(rollId: string, ingredient: string): void {
    this.updatePromoRoll(rollId, (roll) => {
      const exists = roll.ingredients.some((item) => this.sameText(item, ingredient));

      return {
        ...roll,
        ingredients: exists
          ? roll.ingredients.filter((item) => !this.sameText(item, ingredient))
          : [...roll.ingredients, ingredient]
      };
    });
  }

  isPromoRollIngredientSelected(roll: PromoRollConfig, ingredient: string): boolean {
    return roll.ingredients.some((item) => this.sameText(item, ingredient));
  }

  isPromoRollOriginalIngredient(roll: PromoRollConfig, ingredient: string): boolean {
    return roll.originalIngredients.some((item) => this.sameText(item, ingredient));
  }

  formatPromoRollResult(roll: PromoRollConfig): string {
    return this.formatPromoRoll(roll);
  }

  getPromoSummary(): string {
    return this.promoRolls().map((roll) => this.formatPromoRoll(roll)).join(' + ');
  }

  confirmSelection(): void {
    const descriptionOverride = this.isSinArrozProduct()
      ? this.sinArrozSummary()
      : this.isPromoProduct() && this.promoRolls().length > 0
        ? this.getPromoSummary()
        : this.isEditableRollProduct() && this.editableRoll()
          ? this.formatSingleRoll(this.editableRoll()!)
          : undefined;
    const basePriceOverride =
      this.isSinArrozCustomProduct() && Number(this.customSinArrozPrice()) > 0
        ? Number(this.customSinArrozPrice())
        : undefined;

    this.confirm.emit({
      notes: this.notes().trim() || undefined,
      extras: [
        ...this.selectedExtras().filter((x) => x.quantity > 0),
        ...this.rollAddonExtras(),
        ...this.promoAddonExtras()
      ],
      sauces: [],
      descriptionOverride,
      basePriceOverride
    });
  }

  close(): void {
    this.closeModal.emit();
  }

  private initializeSinArrozBuilder(): void {
    const description = this.existingItem?.description ?? this.product.description ?? '';
    const config = this.getSinArrozConfig();
    const ingredientsPart = description.includes('.')
      ? description.split('.').slice(1).join('.').trim()
      : description;
    const selectedIngredients = ingredientsPart
      .split(',')
      .map((item) => item.trim())
      .filter(Boolean);
    const parsedProteins = selectedIngredients.filter((ingredient) =>
      this.sinArrozProteinOptions.includes(ingredient)
    );
    const parsedFillings = selectedIngredients.filter((ingredient) =>
      this.sinArrozFillingOptions.includes(ingredient)
    );

    this.selectedSinArrozWrap.set(
      this.getSinArrozWrapLabel(description) || config.wrap
    );
    this.selectedSinArrozProteins.set(
      parsedProteins.length ? parsedProteins : [...config.requiredProteins]
    );
    this.selectedSinArrozFillings.set(
      parsedFillings.length ? parsedFillings : [...config.defaultFillings]
    );

    if (this.isSinArrozCustomProduct()) {
      this.customSinArrozPrice.set(
        `${this.existingItem?.baseUnitPrice ?? this.existingItem?.unitPrice ?? ''}`.replace(
          /^0$/,
          ''
        )
      );
    }
  }

  private initializePromoBuilder(): void {
    const baseRolls = this.parsePromoRolls(this.product.description ?? '');
    const currentRolls = this.parsePromoRolls(this.existingItem?.description ?? this.product.description ?? '');

    this.promoRolls.set(
      currentRolls.map((roll, index) => {
        const baseRoll = baseRolls[index] ?? roll;

        return {
          ...roll,
          originalWrap: baseRoll.wrap,
          originalProtein: baseRoll.protein,
          originalIngredients: [...baseRoll.ingredients]
        };
      })
    );
  }

  private initializeEditableRollBuilder(): void {
    const baseRoll = this.parseSingleRoll(
      this.product.description ?? '',
      this.getDefaultWrapForProduct()
    );
    const currentRoll = this.parseSingleRoll(
      this.existingItem?.description ?? this.product.description ?? '',
      baseRoll.wrap
    );

    this.editableRoll.set({
      ...currentRoll,
      originalWrap: baseRoll.wrap,
      originalProtein: baseRoll.protein,
      originalIngredients: [...baseRoll.ingredients]
    });
  }

  private parsePromoRolls(description: string): PromoRollConfig[] {
    return description
      .split(' + ')
      .map((part, index) => {
        const trimmed = part.trim();
        const match = trimmed.match(
          /^(\d+\s+(?:cortes?|piezas?|rolls?))\s+(.+?)\s*\((.*)\)$/i
        );

        if (!match) {
          return null;
        }

        const ingredients = match[3]
          .split(',')
          .map((item) => this.titleIngredient(item.trim()))
          .filter(Boolean);
        const protein = ingredients[0] ?? '';
        const wrap = this.titleWrap(match[2].trim());

        return {
          id: `promo-roll-${index}`,
          cuts: match[1],
          wrap,
          originalWrap: wrap,
          protein,
          originalProtein: protein,
          ingredients: ingredients.slice(1),
          originalIngredients: ingredients.slice(1)
        };
      })
      .filter((roll): roll is PromoRollConfig => roll !== null);
  }

  private isPromoCandidate(): boolean {
    const haystack = [
      this.product.id,
      this.product.name,
      this.product.category,
      this.product.description ?? ''
    ]
      .join(' ')
      .toLowerCase();

    return (
      haystack.includes('promo') ||
      haystack.includes('promocion') ||
      haystack.includes('promoción') ||
      this.parsePromoRolls(this.product.description ?? '').length > 1
    );
  }

  private updatePromoRoll(
    rollId: string,
    updater: (roll: PromoRollConfig) => PromoRollConfig
  ): void {
    this.promoRolls.update((rolls) =>
      rolls.map((roll) => (roll.id === rollId ? updater(roll) : roll))
    );
  }

  private updateEditableRoll(updater: (roll: PromoRollConfig) => PromoRollConfig): void {
    this.editableRoll.update((roll) => (roll ? updater(roll) : roll));
  }

  private rollAddonExtras(): SelectedExtra[] {
    const roll = this.editableRoll();

    if (!roll || !this.isEditableRollProduct()) {
      return [];
    }

    return this.getRollAddonExtras(roll);
  }

  private promoAddonExtras(): SelectedExtra[] {
    if (!this.isPromoProduct()) {
      return [];
    }

    return this.promoRolls().flatMap((roll) => this.getRollAddonExtras(roll));
  }

  private formatPromoRoll(roll: PromoRollConfig): string {
    return `${roll.cuts} ${roll.wrap} (${[roll.protein, ...roll.ingredients].filter(Boolean).join(', ')})`;
  }

  private formatSingleRoll(roll: PromoRollConfig): string {
    const ingredients = [roll.protein, ...roll.ingredients].filter(Boolean).join(', ');
    return `${roll.wrap}. ${ingredients}`;
  }

  private getRollAddonExtras(roll: PromoRollConfig): SelectedExtra[] {
    const extras: SelectedExtra[] = [];

    if (!this.sameText(roll.protein, roll.originalProtein)) {
      extras.push({
        id: `${PROTEIN_CHANGE_OPTION.id}-${roll.id}`,
        name: `${PROTEIN_CHANGE_OPTION.name} ${roll.cuts}`,
        price: PROTEIN_CHANGE_OPTION.price,
        type: PROTEIN_CHANGE_OPTION.type,
        quantity: 1
      });
    }

    for (const ingredient of roll.ingredients) {
      const wasIncluded = roll.originalIngredients.some((item) =>
        this.sameText(item, ingredient)
      );

      if (wasIncluded) {
        continue;
      }

      const extraOption = EXTRA_OPTIONS.find((option) =>
        this.sameText(option.name, ingredient)
      );

      if (!extraOption) {
        continue;
      }

      extras.push({
        id: `${extraOption.id}-${roll.id}`,
        name: `${extraOption.name} ${roll.cuts}`,
        price: extraOption.price,
        type: extraOption.type,
        quantity: 1
      });
    }

    return extras;
  }

  private parseSingleRoll(description: string, fallbackWrap: string): PromoRollConfig {
    const normalizedDescription = description.trim();
    const dotParts = normalizedDescription.split('.');
    const hasExplicitWrap = dotParts.length > 1;
    const wrap = hasExplicitWrap
      ? this.titleWrap(dotParts[0].trim())
      : fallbackWrap;
    const ingredientsText = (hasExplicitWrap
      ? dotParts.slice(1).join('.').trim()
      : normalizedDescription).replace(/\s+-\s+handroll$/i, '');
    const ingredients = ingredientsText
      .split(',')
      .map((item) => this.titleIngredient(item.trim()))
      .filter(Boolean);

    return {
      id: 'editable-roll',
      cuts: 'Roll',
      wrap,
      originalWrap: wrap,
      protein: ingredients[0] ?? '',
      originalProtein: ingredients[0] ?? '',
      ingredients: ingredients.slice(1),
      originalIngredients: ingredients.slice(1)
    };
  }

  private getDefaultWrapForProduct(): string {
    const text = `${this.product.category} ${this.product.name}`.toLowerCase();

    if (text.includes('tempura') || text.includes('panko')) {
      return 'Tempura';
    }

    if (text.includes('palta')) {
      return 'Envuelto en palta';
    }

    if (text.includes('queso')) {
      return 'Envuelto en queso';
    }

    if (text.includes('sésamo') || text.includes('sesamo')) {
      return 'Sésamo';
    }

    if (text.includes('salmón') || text.includes('salmon')) {
      return 'Envuelto en salmón';
    }

    return 'Roll';
  }

  private isEditableRollCandidate(): boolean {
    if (this.isSinArrozProduct() || this.isPromoProduct()) {
      return false;
    }

    const category = this.product.category.toLowerCase();
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

    return (
      this.product.allowsProteinChange === true &&
      rollCategories.some((item) => category.includes(item)) &&
      (this.product.description ?? '').includes(',')
    );
  }

  private titleIngredient(value: string): string {
    const normalized = value.toLowerCase();
    const option = [...this.promoProteinOptions, ...this.promoIngredientOptions].find((item) =>
      this.sameText(item, normalized)
    );

    return option ?? this.titleText(value);
  }

  private titleWrap(value: string): string {
    const option = this.promoWrapOptions.find((item) => this.sameText(item, value));
    return option ?? this.titleText(value);
  }

  private titleText(value: string): string {
    return value
      .split(' ')
      .map((part) => part.charAt(0).toUpperCase() + part.slice(1).toLowerCase())
      .join(' ');
  }

  private sameText(a: string, b: string): boolean {
    return a.localeCompare(b, 'es', { sensitivity: 'base' }) === 0;
  }

  private getSinArrozWrapLabel(description: string): string {
    const normalized = description.toLowerCase();

    if (normalized.includes('envuelto en palta')) {
      return 'Envuelto en palta';
    }

    if (normalized.includes('envuelto en queso')) {
      return 'Envuelto en queso';
    }

    if (normalized.includes('tempura')) {
      return 'Tempura';
    }

    if (normalized.includes('envuelto en salmón')) {
      return 'Envuelto en salmón';
    }

    if (normalized.includes('envuelto en atún')) {
      return 'Envuelto en atún';
    }

    return '';
  }

  private getSinArrozConfig(): {
    wrap: string;
    requiredProteins: string[];
    optionalProteinLimit: number;
    defaultFillings: string[];
  } {
    const productId = this.product.id;

    if (productId === 'sin-arroz-personalizable') {
      return {
        wrap: '',
        requiredProteins: [],
        optionalProteinLimit: 3,
        defaultFillings: []
      };
    }

    if (
      productId === 'sin-arroz-a-envuelto-palta' ||
      productId === 'sin-arroz-b-envuelto-queso'
    ) {
      return {
        wrap:
          productId === 'sin-arroz-a-envuelto-palta'
            ? 'Envuelto en palta'
            : 'Envuelto en queso',
        requiredProteins: ['Salmón'],
        optionalProteinLimit: 1,
        defaultFillings: ['Queso', 'Cebollino']
      };
    }

    if (
      productId === 'sin-arroz-c-tempura' ||
      productId === 'sin-arroz-c-envuelto-palta' ||
      productId === 'sin-arroz-c-envuelto-queso'
    ) {
      return {
        wrap:
          productId === 'sin-arroz-c-tempura'
            ? 'Tempura'
            : productId === 'sin-arroz-c-envuelto-palta'
              ? 'Envuelto en palta'
              : 'Envuelto en queso',
        requiredProteins: ['Carne'],
        optionalProteinLimit: 0,
        defaultFillings: ['Pimentón', 'Queso', 'Cebollino']
      };
    }

    return {
      wrap: 'Tempura',
      requiredProteins: ['Pollo'],
      optionalProteinLimit: 0,
      defaultFillings: ['Champiñón', 'Queso', 'Cebollino']
    };
  }
}
