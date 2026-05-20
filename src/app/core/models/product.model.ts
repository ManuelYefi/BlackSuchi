export interface ProductOption {
  id: string;
  name: string;
  price: number;
  type: 'extra' | 'proteinChange';
}

export interface Product {
  id: string;
  name: string;
  category: string;
  description?: string;
  price: number;
  active: boolean;
  ingredients?: string[];
  allowsNotes?: boolean;
  allowsProteinChange?: boolean;
  availableExtras?: string[];
}