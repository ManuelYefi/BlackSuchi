import { OrderItem } from './order-item.model';

export type OrderType = 'local' | 'retiro' | 'delivery';
export type OrderChannel =
  | 'mesa'
  | 'retiro'
  | 'delivery'
  | 'uber_eats'
  | 'pedidos_ya'
  | 'rappi';

  export interface Order {
    id: string;
    items: OrderItem[];
    total: number;
  
    orderType: OrderType;
    orderChannel: OrderChannel;
  
    deliveryFee?: number; // 🔥 NUEVO
  
    tableNumber?: number;
    customerName?: string;
  
    status: 'pendiente' | 'en_preparacion' | 'listo' | 'entregado';
    createdAt: string;
  }