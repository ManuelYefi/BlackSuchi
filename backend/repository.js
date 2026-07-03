const { execute, query } = require('./db');
const {
  loadFrontendProducts,
  loadFrontendExtras,
  loadFrontendTables
} = require('./load-frontend-defaults');

const CREATE_TABLES_SQL = [
  `
    CREATE TABLE IF NOT EXISTS products (
      id VARCHAR(120) PRIMARY KEY,
      name VARCHAR(180) NOT NULL,
      category VARCHAR(120) NOT NULL,
      description TEXT NULL,
      price INT NOT NULL,
      active TINYINT(1) NOT NULL DEFAULT 1,
      ingredients JSON NULL,
      allows_notes TINYINT(1) NOT NULL DEFAULT 0,
      allows_protein_change TINYINT(1) NOT NULL DEFAULT 0,
      available_extras JSON NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS extras (
      id VARCHAR(120) PRIMARY KEY,
      name VARCHAR(180) NOT NULL,
      price INT NOT NULL,
      type ENUM('extra', 'proteinChange') NOT NULL DEFAULT 'extra',
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS tables_config (
      id INT PRIMARY KEY,
      name VARCHAR(120) NOT NULL,
      active TINYINT(1) NOT NULL DEFAULT 1,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS orders (
      id VARCHAR(120) PRIMARY KEY,
      total INT NOT NULL,
      order_type ENUM('local', 'retiro', 'delivery') NOT NULL,
      order_channel ENUM('mesa', 'retiro', 'delivery', 'uber_eats', 'pedidos_ya', 'rappi') NOT NULL,
      delivery_fee INT NULL DEFAULT 0,
      chopsticks_count INT NULL DEFAULT 0,
      table_number INT NULL,
      customer_name VARCHAR(180) NULL,
      status ENUM('pendiente', 'en_preparacion', 'listo', 'entregado') NOT NULL,
      created_at DATETIME NOT NULL,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS order_items (
      uid VARCHAR(120) PRIMARY KEY,
      order_id VARCHAR(120) NOT NULL,
      product_id VARCHAR(120) NOT NULL,
      name VARCHAR(180) NOT NULL,
      description TEXT NULL,
      quantity INT NOT NULL,
      unit_price INT NOT NULL,
      subtotal INT NOT NULL,
      notes TEXT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT fk_order_items_order
        FOREIGN KEY (order_id) REFERENCES orders(id)
        ON DELETE CASCADE
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS order_item_extras (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      order_item_uid VARCHAR(120) NOT NULL,
      extra_id VARCHAR(120) NOT NULL,
      name VARCHAR(180) NOT NULL,
      price INT NOT NULL,
      type ENUM('extra', 'proteinChange') NOT NULL DEFAULT 'extra',
      quantity INT NOT NULL DEFAULT 1,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_order_item_extras_item
        FOREIGN KEY (order_item_uid) REFERENCES order_items(uid)
        ON DELETE CASCADE
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS order_item_sauces (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      order_item_uid VARCHAR(120) NOT NULL,
      name ENUM('Soya', 'Agridulce', 'Acevichada') NOT NULL,
      quantity INT NOT NULL DEFAULT 1,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
      CONSTRAINT fk_order_item_sauces_item
        FOREIGN KEY (order_item_uid) REFERENCES order_items(uid)
        ON DELETE CASCADE
    )
  `,
  `
    CREATE TABLE IF NOT EXISTS expenses (
      id BIGINT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(180) NOT NULL,
      amount INT NOT NULL,
      notes TEXT NULL,
      expense_date DATETIME NOT NULL,
      created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
    )
  `
];

function parseJsonArray(rawValue) {
  if (!rawValue) {
    return [];
  }

  return JSON.parse(rawValue);
}

function mapProductRow(row) {
  return {
    id: row.id,
    name: row.name,
    category: row.category,
    description: row.description ?? undefined,
    price: row.price,
    active: Boolean(row.active),
    ingredients: parseJsonArray(row.ingredients),
    allowsNotes: Boolean(row.allows_notes),
    allowsProteinChange: Boolean(row.allows_protein_change),
    availableExtras: parseJsonArray(row.available_extras)
  };
}

function mapExtraRow(row) {
  return {
    id: row.id,
    name: row.name,
    price: row.price,
    type: row.type
  };
}

function mapTableRow(row) {
  return {
    id: row.id,
    name: row.name,
    active: Boolean(row.active)
  };
}

function mapExpenseRow(row) {
  return {
    id: row.id,
    title: row.title,
    amount: row.amount,
    notes: row.notes ?? undefined,
    expenseDate: new Date(row.expense_date).toISOString(),
    createdAt: row.created_at ? new Date(row.created_at).toISOString() : undefined
  };
}

async function ensureSchema() {
  for (const sql of CREATE_TABLES_SQL) {
    await execute(sql);
  }

  const columns = await query(
    `
      SELECT COLUMN_NAME
      FROM INFORMATION_SCHEMA.COLUMNS
      WHERE TABLE_SCHEMA = DATABASE()
        AND TABLE_NAME = 'orders'
        AND COLUMN_NAME = 'chopsticks_count'
    `
  );

  if (!columns.length) {
    await execute(`
      ALTER TABLE orders
      ADD COLUMN chopsticks_count INT NULL DEFAULT 0
      AFTER delivery_fee
    `);
  }
}

async function listProducts() {
  const rows = await query(`
    SELECT
      id,
      name,
      category,
      description,
      price,
      active,
      CAST(ingredients AS CHAR) AS ingredients,
      allows_notes,
      allows_protein_change,
      CAST(available_extras AS CHAR) AS available_extras
    FROM products
    ORDER BY category, name
  `);

  return rows.map(mapProductRow);
}

async function getProductById(id) {
  const rows = await query(
    `
      SELECT
        id,
        name,
        category,
        description,
        price,
        active,
        CAST(ingredients AS CHAR) AS ingredients,
        allows_notes,
        allows_protein_change,
        CAST(available_extras AS CHAR) AS available_extras
      FROM products
      WHERE id = ?
    `,
    [id]
  );

  return rows[0] ? mapProductRow(rows[0]) : null;
}

async function upsertProduct(product) {
  await execute(
    `
      INSERT INTO products (
        id, name, category, description, price, active, ingredients,
        allows_notes, allows_protein_change, available_extras
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        category = VALUES(category),
        description = VALUES(description),
        price = VALUES(price),
        active = VALUES(active),
        ingredients = VALUES(ingredients),
        allows_notes = VALUES(allows_notes),
        allows_protein_change = VALUES(allows_protein_change),
        available_extras = VALUES(available_extras)
    `,
    [
      product.id,
      product.name,
      product.category,
      product.description ?? null,
      product.price,
      product.active ? 1 : 0,
      JSON.stringify(product.ingredients ?? []),
      product.allowsNotes ? 1 : 0,
      product.allowsProteinChange ? 1 : 0,
      JSON.stringify(product.availableExtras ?? [])
    ]
  );

  return getProductById(product.id);
}

async function deleteProduct(id) {
  const result = await execute('DELETE FROM products WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

async function listExtras() {
  const rows = await query(
    'SELECT id, name, price, type FROM extras ORDER BY type, name'
  );
  return rows.map(mapExtraRow);
}

async function getExtraById(id) {
  const rows = await query('SELECT id, name, price, type FROM extras WHERE id = ?', [id]);
  return rows[0] ? mapExtraRow(rows[0]) : null;
}

async function upsertExtra(extra) {
  await execute(
    `
      INSERT INTO extras (id, name, price, type)
      VALUES (?, ?, ?, ?)
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        price = VALUES(price),
        type = VALUES(type)
    `,
    [extra.id, extra.name, extra.price, extra.type]
  );

  return getExtraById(extra.id);
}

async function deleteExtra(id) {
  const result = await execute('DELETE FROM extras WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

async function listTables() {
  const rows = await query(
    'SELECT id, name, active FROM tables_config ORDER BY id'
  );
  return rows.map(mapTableRow);
}

async function getTableById(id) {
  const rows = await query(
    'SELECT id, name, active FROM tables_config WHERE id = ?',
    [id]
  );
  return rows[0] ? mapTableRow(rows[0]) : null;
}

async function upsertTable(table) {
  await execute(
    `
      INSERT INTO tables_config (id, name, active)
      VALUES (?, ?, ?)
      ON DUPLICATE KEY UPDATE
        name = VALUES(name),
        active = VALUES(active)
    `,
    [table.id, table.name, table.active ? 1 : 0]
  );

  return getTableById(table.id);
}

async function deleteTable(id) {
  const result = await execute('DELETE FROM tables_config WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

async function listExpenses() {
  const rows = await query(
    `
      SELECT id, title, amount, notes, expense_date, created_at
      FROM expenses
      ORDER BY expense_date DESC, id DESC
    `
  );

  return rows.map(mapExpenseRow);
}

async function createExpense(expense) {
  const result = await execute(
    `
      INSERT INTO expenses (title, amount, notes, expense_date)
      VALUES (?, ?, ?, ?)
    `,
    [
      expense.title,
      expense.amount,
      expense.notes ?? null,
      new Date(expense.expenseDate)
    ]
  );

  const rows = await query(
    `
      SELECT id, title, amount, notes, expense_date, created_at
      FROM expenses
      WHERE id = ?
    `,
    [result.insertId]
  );

  return rows[0] ? mapExpenseRow(rows[0]) : null;
}

async function deleteExpenseRecord(id) {
  const result = await execute('DELETE FROM expenses WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

async function listOrders() {
  const orderRows = await query(
    `
      SELECT
        id,
        total,
        order_type,
        order_channel,
        delivery_fee,
        chopsticks_count,
        table_number,
        customer_name,
        status,
        created_at
      FROM orders
      ORDER BY created_at DESC
    `
  );

  if (!orderRows.length) {
    return [];
  }

  const itemRows = await query(
    `
      SELECT
        uid,
        order_id,
        product_id,
        name,
        description,
        quantity,
        unit_price,
        subtotal,
        notes
      FROM order_items
      ORDER BY created_at ASC
    `
  );

  const extraRows = await query(
    `
      SELECT
        order_item_uid,
        extra_id,
        name,
        price,
        type,
        quantity
      FROM order_item_extras
      ORDER BY id ASC
    `
  );

  const sauceRows = await query(
    `
      SELECT
        order_item_uid,
        name,
        quantity
      FROM order_item_sauces
      ORDER BY id ASC
    `
  );

  const extrasByItem = new Map();
  for (const row of extraRows) {
    const bucket = extrasByItem.get(row.order_item_uid) ?? [];
    bucket.push({
      id: row.extra_id,
      name: row.name,
      price: row.price,
      type: row.type,
      quantity: row.quantity
    });
    extrasByItem.set(row.order_item_uid, bucket);
  }

  const saucesByItem = new Map();
  for (const row of sauceRows) {
    const bucket = saucesByItem.get(row.order_item_uid) ?? [];
    bucket.push({
      name: row.name,
      quantity: row.quantity
    });
    saucesByItem.set(row.order_item_uid, bucket);
  }

  const itemsByOrder = new Map();
  for (const row of itemRows) {
    const bucket = itemsByOrder.get(row.order_id) ?? [];
    bucket.push({
      uid: row.uid,
      productId: row.product_id,
      name: row.name,
      description: row.description ?? undefined,
      quantity: row.quantity,
      unitPrice: row.unit_price,
      subtotal: row.subtotal,
      notes: row.notes ?? undefined,
      extras: extrasByItem.get(row.uid) ?? [],
      sauces: saucesByItem.get(row.uid) ?? []
    });
    itemsByOrder.set(row.order_id, bucket);
  }

  return orderRows.map((row) => ({
    id: row.id,
    items: itemsByOrder.get(row.id) ?? [],
    total: row.total,
    orderType: row.order_type,
    orderChannel: row.order_channel,
    deliveryFee: row.delivery_fee ?? 0,
    chopsticksCount: row.chopsticks_count ?? 0,
    tableNumber: row.table_number ?? undefined,
    customerName: row.customer_name ?? undefined,
    status: row.status,
    createdAt: new Date(row.created_at).toISOString()
  }));
}

async function getOrderById(id) {
  const orders = await listOrders();
  return orders.find((order) => order.id === id) ?? null;
}

async function createOrder(order) {
  await execute(
    `
      INSERT INTO orders (
        id, total, order_type, order_channel, delivery_fee, chopsticks_count,
        table_number, customer_name, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
    [
      order.id,
      order.total,
      order.orderType,
      order.orderChannel,
      order.deliveryFee ?? 0,
      order.chopsticksCount ?? 0,
      order.tableNumber ?? null,
      order.customerName ?? null,
      order.status,
      new Date(order.createdAt)
    ]
  );

  for (const item of order.items ?? []) {
    await execute(
      `
        INSERT INTO order_items (
          uid, order_id, product_id, name, description,
          quantity, unit_price, subtotal, notes
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `,
      [
        item.uid,
        order.id,
        item.productId,
        item.name,
        item.description ?? null,
        item.quantity,
        item.unitPrice,
        item.subtotal,
        item.notes ?? null
      ]
    );

    for (const extra of item.extras ?? []) {
      await execute(
        `
          INSERT INTO order_item_extras (
            order_item_uid, extra_id, name, price, type, quantity
          ) VALUES (?, ?, ?, ?, ?, ?)
        `,
        [item.uid, extra.id, extra.name, extra.price, extra.type, extra.quantity]
      );
    }

    for (const sauce of item.sauces ?? []) {
      await execute(
        `
          INSERT INTO order_item_sauces (order_item_uid, name, quantity)
          VALUES (?, ?, ?)
        `,
        [item.uid, sauce.name, sauce.quantity]
      );
    }
  }

  return getOrderById(order.id);
}

async function updateOrderStatus(id, status) {
  await execute('UPDATE orders SET status = ? WHERE id = ?', [status, id]);
  return getOrderById(id);
}

async function deleteOrder(id) {
  const result = await execute('DELETE FROM orders WHERE id = ?', [id]);
  return result.affectedRows > 0;
}

async function seedProductsIfEmpty() {
  const rows = await query('SELECT COUNT(*) AS count FROM products');
  if (Number(rows[0]?.count ?? 0) > 0) {
    return;
  }

  const products = loadFrontendProducts();
  for (const product of products) {
    await upsertProduct(product);
  }
}

async function seedExtrasIfEmpty() {
  const rows = await query('SELECT COUNT(*) AS count FROM extras');
  if (Number(rows[0]?.count ?? 0) > 0) {
    return;
  }

  const extras = loadFrontendExtras();
  for (const extra of extras) {
    await upsertExtra(extra);
  }
}

async function seedTablesIfEmpty() {
  const rows = await query('SELECT COUNT(*) AS count FROM tables_config');
  if (Number(rows[0]?.count ?? 0) > 0) {
    return;
  }

  const tables = loadFrontendTables();
  for (const table of tables) {
    await upsertTable(table);
  }
}

async function seedDefaultsIfEmpty() {
  await seedProductsIfEmpty();
  await seedExtrasIfEmpty();
  await seedTablesIfEmpty();
}

async function resetProductsFromSeed() {
  await execute('DELETE FROM products');
  const products = loadFrontendProducts();
  for (const product of products) {
    await upsertProduct(product);
  }
}

async function resetExtrasFromSeed() {
  await execute('DELETE FROM extras');
  const extras = loadFrontendExtras();
  for (const extra of extras) {
    await upsertExtra(extra);
  }
}

async function resetTablesFromSeed() {
  await execute('DELETE FROM tables_config');
  const tables = loadFrontendTables();
  for (const table of tables) {
    await upsertTable(table);
  }
}

async function clearOrdersByMonth(monthKey) {
  const result = await execute(
    "DELETE FROM orders WHERE DATE_FORMAT(created_at, '%Y-%m') = ?",
    [monthKey]
  );

  return result.affectedRows;
}

module.exports = {
  ensureSchema,
  listProducts,
  getProductById,
  upsertProduct,
  deleteProduct,
  listExtras,
  getExtraById,
  upsertExtra,
  deleteExtra,
  listTables,
  getTableById,
  upsertTable,
  deleteTable,
  listExpenses,
  createExpense,
  deleteExpenseRecord,
  listOrders,
  getOrderById,
  createOrder,
  updateOrderStatus,
  deleteOrder,
  clearOrdersByMonth,
  seedDefaultsIfEmpty,
  resetProductsFromSeed,
  resetExtrasFromSeed,
  resetTablesFromSeed
};
