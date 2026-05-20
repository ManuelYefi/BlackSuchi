import { CommonModule } from '@angular/common';
import { Component, EventEmitter, Input, Output, computed, signal } from '@angular/core';
import {
  EXTRA_OPTIONS,
  PROTEIN_CHANGE_OPTION
} from '../../../core/data/menu-options';
import {
  SAUCE_OPTIONS,
  SauceOption,
  SelectedSauce,
  SelectedExtra
} from '../../../core/models/order-item.model';
import { Product, ProductOption } from '../../../core/models/product.model';

@Component({
  selector: 'app-product-detail-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './product-detail-modal.html',
  styleUrl: './product-detail-modal.scss'
})
export class ProductDetailModalComponent {
  @Input({ required: true }) product!: Product;
  @Output() closeModal = new EventEmitter<void>();
  @Output() confirm = new EventEmitter<{
    notes?: string;
    extras: SelectedExtra[];
    sauces: SelectedSauce[];
  }>();

  protected readonly notes = signal('');
  protected readonly selectedExtras = signal<SelectedExtra[]>([]);
  protected readonly selectedSauces = signal<SelectedSauce[]>([]);
  protected readonly availableExtras = EXTRA_OPTIONS;
  protected readonly availableSauces = SAUCE_OPTIONS;
  protected readonly PROTEIN_CHANGE_OPTION = PROTEIN_CHANGE_OPTION;

  protected readonly totalExtras = computed(() =>
    this.selectedExtras().reduce((sum, extra) => sum + extra.price * extra.quantity, 0)
  );

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

  increaseSauce(sauce: SauceOption): void {
    const current = [...this.selectedSauces()];
    const index = current.findIndex((item) => item.name === sauce);

    if (index >= 0) {
      current[index] = {
        ...current[index],
        quantity: current[index].quantity + 1
      };
    } else {
      current.push({
        name: sauce,
        quantity: 1
      });
    }

    this.selectedSauces.set(current);
  }

  decreaseSauce(sauce: SauceOption): void {
    const current = [...this.selectedSauces()];
    const index = current.findIndex((item) => item.name === sauce);

    if (index < 0) {
      return;
    }

    const updatedQuantity = current[index].quantity - 1;

    if (updatedQuantity <= 0) {
      this.selectedSauces.set(current.filter((item) => item.name !== sauce));
      return;
    }

    current[index] = {
      ...current[index],
      quantity: updatedQuantity
    };

    this.selectedSauces.set(current);
  }

  getSauceQuantity(sauce: SauceOption): number {
    return this.selectedSauces().find((item) => item.name === sauce)?.quantity ?? 0;
  }

  confirmSelection(): void {
    this.confirm.emit({
      notes: this.notes().trim() || undefined,
      extras: this.selectedExtras().filter((x) => x.quantity > 0),
      sauces: this.selectedSauces().filter((x) => x.quantity > 0)
    });
  }

  close(): void {
    this.closeModal.emit();
  }
}
