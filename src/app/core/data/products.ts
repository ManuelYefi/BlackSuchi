import { Product } from '../models/product.model';

export const PRODUCTS: Product[] = [
  // =========================
  // PROMOS BLACK
  // =========================
  {
    id: 'promo-20-black-mix',
    name: '20 Black Mix',
    category: 'Promos Black',
    description:
      '10 cortes tempura (pollo, queso, cebollín) + 10 cortes sésamo (kanikama, queso, cebollín)',
    price: 8000,
    active: true,
    allowsNotes: true,
    allowsProteinChange: false,
    availableExtras: []
  },
  {
    id: 'promo-30-black-mix',
    name: '30 Black Mix',
    category: 'Promos Black',
    description:
      '10 cortes tempura (pollo, queso, cebollín) + 10 cortes sésamo (kanikama, queso, cebollín) + 10 cortes envueltos en palta (pollo, queso, pimentón)',
    price: 10500,
    active: true,
    allowsNotes: true,
    allowsProteinChange: false,
    availableExtras: []
  },
  {
    id: 'promo-40-black-mix',
    name: '40 Black Mix',
    category: 'Promos Black',
    description:
      '10 cortes tempura (pollo, queso, cebollín) + 10 cortes sésamo (camarón, queso, palta) + 10 cortes envueltos en palta (salmón, queso, pimentón) + 10 cortes envueltos en nori (kanikama, queso, palta)',
    price: 13500,
    active: true,
    allowsNotes: true,
    allowsProteinChange: false,
    availableExtras: []
  },
  {
    id: 'promo-50-black-mix',
    name: '50 Black Mix',
    category: 'Promos Black',
    description:
      '10 cortes envueltos en queso (pollo, queso, palta) + 10 cortes envueltos en palta (camarón, queso, cebollín) + 10 cortes tempura (salmón, queso, pimentón) + 10 cortes envueltos en nori (kanikama, queso, palta) + 10 cortes sésamo (pollo, queso, palta)',
    price: 16000,
    active: true,
    allowsNotes: true,
    allowsProteinChange: false,
    availableExtras: []
  },
  {
    id: 'promo-60-black-mix',
    name: '60 Black Mix',
    category: 'Promos Black',
    description:
      '10 cortes envueltos en queso (pollo, queso, palta) + 10 cortes envueltos en palta (camarón, queso, cebollín) + 10 cortes tempura (salmón, queso, pimentón) + 10 cortes envueltos en nori (kanikama, queso, palta) + 10 cortes sésamo (pollo, queso, palta) + 10 cortes tempura (pollo, queso, cebollín)',
    price: 18000,
    active: true,
    allowsNotes: true,
    allowsProteinChange: false,
    availableExtras: []
  },

  // =========================
  // ROLL SIN ARROZ
  // =========================
  {
    id: 'sin-arroz-a-envuelto-palta',
    name: 'Envuelto - Palta',
    category: 'Roll Sin Arroz',
    description: 'Envuelto en palta. Salmón, camarón, queso, cebollino',
    price: 6500,
    active: true,
    allowsNotes: true,
    allowsProteinChange: false,
    availableExtras: ['extra-aceitunas', 'extra-champignon', 'extra-palmito']
  },
  {
    id: 'sin-arroz-b-envuelto-queso',
    name: 'Envuelto - Queso',
    category: 'Roll Sin Arroz',
    description: 'Envuelto en queso. Salmón, camarón, queso, cebollino',
    price: 6500,
    active: true,
    allowsNotes: true,
    allowsProteinChange: false,
    availableExtras: ['extra-aceitunas', 'extra-champignon', 'extra-palmito']
  },
  {
    id: 'sin-arroz-c-tempura',
    name: 'Tempura - Carne',
    category: 'Roll Sin Arroz',
    description: 'Tempura. Carne, pimentón, queso, cebollino',
    price: 6000,
    active: true,
    allowsNotes: true,
    allowsProteinChange: false,
    availableExtras: ['extra-aceitunas', 'extra-champignon', 'extra-palmito']
  },
  {
    id: 'sin-arroz-c-envuelto-palta',
    name: 'Envuelto - Palta Carne',
    category: 'Roll Sin Arroz',
    description: 'Envuelto en palta. Carne, pimentón, queso, cebollino',
    price: 6000,
    active: true,
    allowsNotes: true,
    allowsProteinChange: false,
    availableExtras: ['extra-aceitunas', 'extra-champignon', 'extra-palmito']
  },
  {
    id: 'sin-arroz-c-envuelto-queso',
    name: 'Envuelto - Queso Carne',
    category: 'Roll Sin Arroz',
    description: 'Envuelto en queso. Carne, pimentón, queso, cebollino',
    price: 6000,
    active: true,
    allowsNotes: true,
    allowsProteinChange: false,
    availableExtras: ['extra-aceitunas', 'extra-champignon', 'extra-palmito']
  },
  {
    id: 'sin-arroz-d-tempura',
    name: 'Tempura - Pollo',
    category: 'Roll Sin Arroz',
    description: 'Tempura. Pollo, champiñón, queso, cebollín',
    price: 5500,
    active: true,
    allowsNotes: true,
    allowsProteinChange: false,
    availableExtras: ['extra-aceitunas', 'extra-champignon', 'extra-palmito']
  },
  {
    id: 'sin-arroz-personalizable',
    name: 'Sin Arroz Personalizable',
    category: 'Roll Sin Arroz',
    description: 'Arma un roll sin arroz con cobertura, proteínas, complementos y precio manual.',
    price: 0,
    active: true,
    allowsNotes: true,
    allowsProteinChange: false,
    availableExtras: ['extra-aceitunas', 'extra-champignon', 'extra-palmito']
  },

  // =========================
  // BLACKROLLS CORTES - TEMPURAS (PANKO)
  // =========================
  {
    id: 'tempura-handroll-pollo-queso-cebollin',
    name: 'Tempura Handroll Pollo',
    category: 'Tempuras (Panko)',
    description: 'Pollo, queso crema, cebollín - Handroll',
    price: 3000,
    active: true,
    allowsNotes: true,
    allowsProteinChange: true,
    availableExtras: ['extra-aceitunas', 'extra-champignon', 'extra-palmito']
  },
  {
    id: 'tempura-pollo-queso-cebollin',
    name: 'Tempura Pollo',
    category: 'Tempuras (Panko)',
    description: 'Pollo, queso crema, cebollín',
    price: 3500,
    active: true,
    allowsNotes: true,
    allowsProteinChange: true,
    availableExtras: ['extra-aceitunas', 'extra-champignon', 'extra-palmito']
  },
  {
    id: 'tempura-kanikama-queso-cebollin',
    name: 'Tempura Kanikama',
    category: 'Tempuras (Panko)',
    description: 'Kanikama, queso crema, cebollín',
    price: 3500,
    active: true,
    allowsNotes: true,
    allowsProteinChange: true,
    availableExtras: ['extra-aceitunas', 'extra-champignon', 'extra-palmito']
  },
  {
    id: 'tempura-salmon-queso-cebollin',
    name: 'Tempura Salmón',
    category: 'Tempuras (Panko)',
    description: 'Salmón, queso crema, cebollín',
    price: 4000,
    active: true,
    allowsNotes: true,
    allowsProteinChange: true,
    availableExtras: ['extra-aceitunas', 'extra-champignon', 'extra-palmito']
  },
  {
    id: 'tempura-camaron-queso-cebollin',
    name: 'Tempura Camarón',
    category: 'Tempuras (Panko)',
    description: 'Camarón, queso crema, cebollín',
    price: 3500,
    active: true,
    allowsNotes: true,
    allowsProteinChange: true,
    availableExtras: ['extra-aceitunas', 'extra-champignon', 'extra-palmito']
  },
  {
    id: 'tempura-camaron-apanado-queso-cebollin',
    name: 'Tempura Camarón Apanado',
    category: 'Tempuras (Panko)',
    description: 'Camarón apanado, queso crema, cebollín',
    price: 3800,
    active: true,
    allowsNotes: true,
    allowsProteinChange: true,
    availableExtras: ['extra-aceitunas', 'extra-champignon', 'extra-palmito']
  },
  {
    id: 'tempura-pollo-camaron-queso-cebollin',
    name: 'Tempura Pollo Camarón',
    category: 'Tempuras (Panko)',
    description: 'Pollo, camarón, queso crema, cebollín',
    price: 4500,
    active: true,
    allowsNotes: true,
    allowsProteinChange: true,
    availableExtras: ['extra-aceitunas', 'extra-champignon', 'extra-palmito']
  },
  {
    id: 'tempura-camaron-salmon-queso-cebollin',
    name: 'Tempura Camarón Salmón',
    category: 'Tempuras (Panko)',
    description: 'Camarón, salmón, queso crema, cebollín',
    price: 5000,
    active: true,
    allowsNotes: true,
    allowsProteinChange: true,
    availableExtras: ['extra-aceitunas', 'extra-champignon', 'extra-palmito']
  },

  // =========================
  // BLACKROLLS CORTES - ENVUELTOS EN PALTA
  // =========================
  {
    id: 'palta-pollo-queso-cebollin',
    name: 'Envuelto en Palta Pollo',
    category: 'Envueltos en Palta',
    description: 'Pollo, queso crema, cebollín',
    price: 4000,
    active: true,
    allowsNotes: true,
    allowsProteinChange: true,
    availableExtras: ['extra-aceitunas', 'extra-champignon', 'extra-palmito']
  },
  {
    id: 'palta-kanikama-queso-cebollin',
    name: 'Envuelto en Palta Kanikama',
    category: 'Envueltos en Palta',
    description: 'Kanikama, queso crema, cebollín',
    price: 4000,
    active: true,
    allowsNotes: true,
    allowsProteinChange: true,
    availableExtras: ['extra-aceitunas', 'extra-champignon', 'extra-palmito']
  },
  {
    id: 'palta-salmon-queso-cebollin',
    name: 'Envuelto en Palta Salmón',
    category: 'Envueltos en Palta',
    description: 'Salmón, queso crema, cebollín',
    price: 4500,
    active: true,
    allowsNotes: true,
    allowsProteinChange: true,
    availableExtras: ['extra-aceitunas', 'extra-champignon', 'extra-palmito']
  },
  {
    id: 'palta-camaron-queso-cebollin',
    name: 'Envuelto en Palta Camarón',
    category: 'Envueltos en Palta',
    description: 'Camarón, queso crema, cebollín',
    price: 4300,
    active: true,
    allowsNotes: true,
    allowsProteinChange: true,
    availableExtras: ['extra-aceitunas', 'extra-champignon', 'extra-palmito']
  },
  {
    id: 'palta-camaron-apanado-queso-cebollin',
    name: 'Envuelto en Palta Camarón Apanado',
    category: 'Envueltos en Palta',
    description: 'Camarón apanado, queso crema, cebollín',
    price: 4500,
    active: true,
    allowsNotes: true,
    allowsProteinChange: true,
    availableExtras: ['extra-aceitunas', 'extra-champignon', 'extra-palmito']
  },
  {
    id: 'palta-pollo-camaron-queso-cebollin',
    name: 'Envuelto en Palta Pollo Camarón',
    category: 'Envueltos en Palta',
    description: 'Pollo, camarón, queso crema, cebollín',
    price: 5000,
    active: true,
    allowsNotes: true,
    allowsProteinChange: true,
    availableExtras: ['extra-aceitunas', 'extra-champignon', 'extra-palmito']
  },
  {
    id: 'palta-camaron-salmon-queso-cebollin',
    name: 'Envuelto en Palta Camarón Salmón',
    category: 'Envueltos en Palta',
    description: 'Camarón, salmón, queso crema, cebollín',
    price: 5500,
    active: true,
    allowsNotes: true,
    allowsProteinChange: true,
    availableExtras: ['extra-aceitunas', 'extra-champignon', 'extra-palmito']
  },

  // =========================
  // BLACKROLLS CORTES - ENVUELTOS EN QUESO CREMA
  // =========================
  {
    id: 'queso-pollo-palta',
    name: 'Envuelto en Queso Crema Pollo',
    category: 'Envueltos en Queso Crema',
    description: 'Pollo, palta',
    price: 3500,
    active: true,
    allowsNotes: true,
    allowsProteinChange: true,
    availableExtras: ['extra-aceitunas', 'extra-champignon', 'extra-palmito']
  },
  {
    id: 'queso-kanikama-palta',
    name: 'Envuelto en Queso Crema Kanikama',
    category: 'Envueltos en Queso Crema',
    description: 'Kanikama, palta',
    price: 3500,
    active: true,
    allowsNotes: true,
    allowsProteinChange: true,
    availableExtras: ['extra-aceitunas', 'extra-champignon', 'extra-palmito']
  },
  {
    id: 'queso-salmon-palta',
    name: 'Envuelto en Queso Crema Salmón',
    category: 'Envueltos en Queso Crema',
    description: 'Salmón, palta',
    price: 4000,
    active: true,
    allowsNotes: true,
    allowsProteinChange: true,
    availableExtras: ['extra-aceitunas', 'extra-champignon', 'extra-palmito']
  },
  {
    id: 'queso-camaron-palta',
    name: 'Envuelto en Queso Crema Camarón',
    category: 'Envueltos en Queso Crema',
    description: 'Camarón, palta',
    price: 3800,
    active: true,
    allowsNotes: true,
    allowsProteinChange: true,
    availableExtras: ['extra-aceitunas', 'extra-champignon', 'extra-palmito']
  },
  {
    id: 'queso-camaron-apanado-palta',
    name: 'Envuelto en Queso Crema Camarón Apanado',
    category: 'Envueltos en Queso Crema',
    description: 'Camarón apanado, palta',
    price: 4000,
    active: true,
    allowsNotes: true,
    allowsProteinChange: true,
    availableExtras: ['extra-aceitunas', 'extra-champignon', 'extra-palmito']
  },
  {
    id: 'queso-pollo-camaron-palta',
    name: 'Envuelto en Queso Crema Pollo Camarón',
    category: 'Envueltos en Queso Crema',
    description: 'Pollo, camarón, palta',
    price: 4500,
    active: true,
    allowsNotes: true,
    allowsProteinChange: true,
    availableExtras: ['extra-aceitunas', 'extra-champignon', 'extra-palmito']
  },
  {
    id: 'queso-camaron-salmon-palta',
    name: 'Envuelto en Queso Crema Camarón Salmón',
    category: 'Envueltos en Queso Crema',
    description: 'Camarón, salmón, palta',
    price: 5000,
    active: true,
    allowsNotes: true,
    allowsProteinChange: true,
    availableExtras: ['extra-aceitunas', 'extra-champignon', 'extra-palmito']
  },

  // =========================
  // BLACKROLLS CORTES - ENVUELTOS EN SÉSAMO
  // =========================
  {
    id: 'sesamo-pollo-queso-cebollin',
    name: 'Envuelto en Sésamo Pollo',
    category: 'Envueltos en Sésamo',
    description: 'Pollo, queso crema, cebollín',
    price: 3500,
    active: true,
    allowsNotes: true,
    allowsProteinChange: true,
    availableExtras: ['extra-aceitunas', 'extra-champignon', 'extra-palmito']
  },
  {
    id: 'sesamo-kanikama-queso-cebollin',
    name: 'Envuelto en Sésamo Kanikama',
    category: 'Envueltos en Sésamo',
    description: 'Kanikama, queso crema, cebollín',
    price: 3500,
    active: true,
    allowsNotes: true,
    allowsProteinChange: true,
    availableExtras: ['extra-aceitunas', 'extra-champignon', 'extra-palmito']
  },
  {
    id: 'sesamo-salmon-queso-cebollin',
    name: 'Envuelto en Sésamo Salmón',
    category: 'Envueltos en Sésamo',
    description: 'Salmón, queso crema, cebollín',
    price: 4000,
    active: true,
    allowsNotes: true,
    allowsProteinChange: true,
    availableExtras: ['extra-aceitunas', 'extra-champignon', 'extra-palmito']
  },
  {
    id: 'sesamo-camaron-queso-cebollin',
    name: 'Envuelto en Sésamo Camarón',
    category: 'Envueltos en Sésamo',
    description: 'Camarón, queso crema, cebollín',
    price: 3800,
    active: true,
    allowsNotes: true,
    allowsProteinChange: true,
    availableExtras: ['extra-aceitunas', 'extra-champignon', 'extra-palmito']
  },
  {
    id: 'sesamo-camaron-apanado-queso-cebollin',
    name: 'Envuelto en Sésamo Camarón Apanado',
    category: 'Envueltos en Sésamo',
    description: 'Camarón apanado, queso crema, cebollín',
    price: 4000,
    active: true,
    allowsNotes: true,
    allowsProteinChange: true,
    availableExtras: ['extra-aceitunas', 'extra-champignon', 'extra-palmito']
  },
  {
    id: 'sesamo-pollo-camaron-queso-cebollin',
    name: 'Envuelto en Sésamo Pollo Camarón',
    category: 'Envueltos en Sésamo',
    description: 'Pollo, camarón, queso crema, cebollín',
    price: 4500,
    active: true,
    allowsNotes: true,
    allowsProteinChange: true,
    availableExtras: ['extra-aceitunas', 'extra-champignon', 'extra-palmito']
  },
  {
    id: 'sesamo-camaron-salmon-queso-cebollin',
    name: 'Envuelto en Sésamo Camarón Salmón',
    category: 'Envueltos en Sésamo',
    description: 'Camarón, salmón, queso crema, cebollín',
    price: 5000,
    active: true,
    allowsNotes: true,
    allowsProteinChange: true,
    availableExtras: ['extra-aceitunas', 'extra-champignon', 'extra-palmito']
  },

  // =========================
  // BLACKROLLS CORTES - ENVUELTOS EN SALMÓN
  // =========================
  {
    id: 'salmon-pollo-queso-cebollin',
    name: 'Envuelto en Salmón Pollo',
    category: 'Envueltos en Salmón',
    description: 'Pollo, queso crema, cebollín',
    price: 4000,
    active: true,
    allowsNotes: true,
    allowsProteinChange: true,
    availableExtras: ['extra-aceitunas', 'extra-champignon', 'extra-palmito']
  },
  {
    id: 'salmon-kanikama-queso-cebollin',
    name: 'Envuelto en Salmón Kanikama',
    category: 'Envueltos en Salmón',
    description: 'Kanikama, queso crema, cebollín',
    price: 4000,
    active: true,
    allowsNotes: true,
    allowsProteinChange: true,
    availableExtras: ['extra-aceitunas', 'extra-champignon', 'extra-palmito']
  },
  {
    id: 'salmon-salmon-queso-cebollin',
    name: 'Envuelto en Salmón Salmón',
    category: 'Envueltos en Salmón',
    description: 'Salmón, queso crema, cebollín',
    price: 4500,
    active: true,
    allowsNotes: true,
    allowsProteinChange: true,
    availableExtras: ['extra-aceitunas', 'extra-champignon', 'extra-palmito']
  },
  {
    id: 'salmon-camaron-queso-cebollin',
    name: 'Envuelto en Salmón Camarón',
    category: 'Envueltos en Salmón',
    description: 'Camarón, queso crema, cebollín',
    price: 4300,
    active: true,
    allowsNotes: true,
    allowsProteinChange: true,
    availableExtras: ['extra-aceitunas', 'extra-champignon', 'extra-palmito']
  },
  {
    id: 'salmon-camaron-apanado-queso-cebollin',
    name: 'Envuelto en Salmón Camarón Apanado',
    category: 'Envueltos en Salmón',
    description: 'Camarón apanado, queso crema, cebollín',
    price: 4500,
    active: true,
    allowsNotes: true,
    allowsProteinChange: true,
    availableExtras: ['extra-aceitunas', 'extra-champignon', 'extra-palmito']
  },
  {
    id: 'salmon-pollo-camaron-queso-cebollin',
    name: 'Envuelto en Salmón Pollo Camarón',
    category: 'Envueltos en Salmón',
    description: 'Pollo, camarón, queso crema, cebollín',
    price: 5000,
    active: true,
    allowsNotes: true,
    allowsProteinChange: true,
    availableExtras: ['extra-aceitunas', 'extra-champignon', 'extra-palmito']
  },
  {
    id: 'salmon-camaron-salmon-queso-cebollin',
    name: 'Envuelto en Salmón Camarón Salmón',
    category: 'Envueltos en Salmón',
    description: 'Camarón, salmón, queso crema, cebollín',
    price: 5500,
    active: true,
    allowsNotes: true,
    allowsProteinChange: true,
    availableExtras: ['extra-aceitunas', 'extra-champignon', 'extra-palmito']
  },

  // =========================
  // KOROKES / POLLO
  // =========================
  {
    id: 'korokes-6',
    name: '6 Korokes',
    category: 'Korokes / Pollo',
    description: 'Porción de 6 unidades',
    price: 3000,
    active: true,
    allowsNotes: true,
    allowsProteinChange: true,
    availableExtras: ['extra-aceitunas', 'extra-champignon', 'extra-palmito']
  },
  {
    id: 'korokes-12',
    name: '12 Korokes',
    category: 'Korokes / Pollo',
    description: 'Porción de 12 unidades',
    price: 6000,
    active: true,
    allowsNotes: true,
    allowsProteinChange: true,
    availableExtras: ['extra-aceitunas', 'extra-champignon', 'extra-palmito']
  },
  {
    id: 'filetitos-pollo-6',
    name: '6 Filetitos de Pollo',
    category: 'Korokes / Pollo',
    description: 'Porción de 6 unidades',
    price: 3000,
    active: true,
    allowsNotes: true,
    allowsProteinChange: true,
    availableExtras: ['extra-aceitunas', 'extra-champignon', 'extra-palmito']
  },
  {
    id: 'combo-korokes-filetitos-6-6',
    name: '6 Korokes / 6 Filetitos de Pollo',
    category: 'Korokes / Pollo',
    description: 'Combo mixto',
    price: 6000,
    active: true,
    allowsNotes: true,
    allowsProteinChange: true,
    availableExtras: ['extra-aceitunas', 'extra-champignon', 'extra-palmito']
  },
  {
    id: 'gyosas-6',
    name: '6 Gyosas',
    category: 'Korokes / Pollo',
    description: 'Porción de 6 gyosas',
    price: 4000,
    active: true,
    allowsNotes: true,
    allowsProteinChange: false,
    availableExtras: []
  }
];
