export interface SelectedExtra {
  id: string;
  name: string;
  price: number;
  type: 'extra' | 'proteinChange';
  quantity: number;
}

export const SAUCE_OPTIONS = ['Soya', 'Agridulce', 'Acevichada'] as const;

export type SauceOption = (typeof SAUCE_OPTIONS)[number];

export interface SelectedSauce {
  name: SauceOption;
  quantity: number;
}

export interface OrderItem {
  uid: string;
  productId: string;
  name: string;
  description?: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
  notes?: string;
  extras?: SelectedExtra[];
  sauces?: SelectedSauce[];
}
