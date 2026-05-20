export interface TableOption {
    id: number;
    name: string;
    active: boolean;
  }
  
  export const TABLES: TableOption[] = [
    { id: 1, name: 'Mesa 1', active: true },
    { id: 2, name: 'Mesa 2', active: true },
    { id: 3, name: 'Mesa 3', active: true },
    { id: 4, name: 'Mesa 4', active: true },
    { id: 5, name: 'Mesa 5', active: true },
    { id: 6, name: 'Mesa 6', active: true }
  ];
  
  export const ORDER_CHANNELS = [
    { id: 'mesa', label: 'Mesa' },
    { id: 'retiro', label: 'Retiro' },
    { id: 'delivery', label: 'Delivery' },
    { id: 'uber_eats', label: 'Uber Eats' },
    { id: 'pedidos_ya', label: 'PedidosYa' },
    { id: 'rappi', label: 'Rappi' }
  ] as const;