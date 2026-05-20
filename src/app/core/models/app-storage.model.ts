import { TableOption } from '../data/order-channels';
import { OrderItem } from './order-item.model';
import { Order } from './order.model';
import { Product, ProductOption } from './product.model';
import type { UserRole } from '../services/auth.service';

export interface AppStorageData {
  cart?: OrderItem[];
  orders?: Order[];
  ordersByMonth?: Record<string, Order[]>;
  products?: Product[];
  extras?: ProductOption[];
  tables?: TableOption[];
  role?: UserRole;
}
