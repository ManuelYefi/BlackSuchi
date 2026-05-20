import { ProductOption } from '../models/product.model';

export const EXTRA_OPTIONS: ProductOption[] = [
  { id: 'extra-aceitunas', name: 'Aceitunas', price: 500, type: 'extra' },
  { id: 'extra-champignon', name: 'Champiñón', price: 500, type: 'extra' },
  { id: 'extra-palmito', name: 'Palmito', price: 500, type: 'extra' },
  { id: 'extra-carne', name: 'Carne', price: 1000, type: 'extra' },
  { id: 'extra-choclillo', name: 'Choclillo', price: 500, type: 'extra' },
  { id: 'extrra-Palta', name: 'Palta', price: 500, type: 'extra' }
];

export const PROTEIN_CHANGE_OPTION: ProductOption = {
  id: 'protein-change',
  name: 'Cambio de proteína',
  price: 1000,
  type: 'proteinChange'
};