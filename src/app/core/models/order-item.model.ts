export interface SelectedExtra {
  id: string;
  name: string;
  price: number;
  type: 'extra' | 'proteinChange';
  quantity: number;
}

export const SAUCE_OPTIONS = ['Soya', 'Agridulce', 'Acevichada', 'Extra salsa'] as const;
export const ACEVICHADA_SAUCE_PRICE = 700;
export const EXTRA_SAUCE_PRICE = 500;

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
  baseUnitPrice: number;
  unitPrice: number;
  sauceCharge: number;
  subtotal: number;
  notes?: string;
  extras?: SelectedExtra[];
  sauces?: SelectedSauce[];
}
