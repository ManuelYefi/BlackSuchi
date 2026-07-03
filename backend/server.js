require('dotenv').config();

const cors = require('cors');
const express = require('express');
const { ping } = require('./db');
const {
  createOrder,
  clearOrdersByMonth,
  createExpense,
  deleteExtra,
  deleteExpenseRecord,
  deleteOrder,
  deleteProduct,
  deleteTable,
  ensureSchema,
  getExtraById,
  getOrderById,
  getProductById,
  getTableById,
  listExtras,
  listExpenses,
  listOrders,
  listProducts,
  listTables,
  resetExtrasFromSeed,
  resetProductsFromSeed,
  resetTablesFromSeed,
  seedDefaultsIfEmpty,
  updateOrderStatus,
  upsertExtra,
  upsertProduct,
  upsertTable
} = require('./repository');

const app = express();
const port = Number(process.env.API_PORT || 3001);

app.use(
  cors({
    origin: true,
    credentials: false
  })
);
app.use(express.json());

app.get('/api/health', async (_req, res) => {
  try {
    await ping();
    res.json({
      ok: true,
      service: 'black-sushi-menu-api',
      api: 'up',
      database: 'up'
    });
  } catch (error) {
    res.status(503).json({
      ok: false,
      service: 'black-sushi-menu-api',
      api: 'up',
      database: 'down',
      message: 'No fue posible conectar con MySQL.'
    });
  }
});

app.get('/api/menu/products', async (_req, res) => {
  const products = await listProducts();
  res.json(products);
});

app.get('/api/menu/products/:id', async (req, res) => {
  const product = await getProductById(req.params.id);

  if (!product) {
    res.status(404).json({ message: 'Producto no encontrado.' });
    return;
  }

  res.json(product);
});

app.post('/api/menu/products', async (req, res) => {
  const product = await upsertProduct(req.body);
  res.status(201).json(product);
});

app.put('/api/menu/products/:id', async (req, res) => {
  const product = req.body;

  if (!product || product.id !== req.params.id) {
    res.status(400).json({ message: 'Producto invalido.' });
    return;
  }

  await upsertProduct(product);
  res.json(await getProductById(product.id));
});

app.delete('/api/menu/products/:id', async (req, res) => {
  const deleted = await deleteProduct(req.params.id);

  if (!deleted) {
    res.status(404).json({ message: 'Producto no encontrado.' });
    return;
  }

  res.status(204).send();
});

app.post('/api/menu/reset', async (_req, res) => {
  await resetProductsFromSeed();
  const products = await listProducts();
  res.json(products);
});

app.get('/api/extras', async (_req, res) => {
  res.json(await listExtras());
});

app.get('/api/extras/:id', async (req, res) => {
  const extra = await getExtraById(req.params.id);

  if (!extra) {
    res.status(404).json({ message: 'Extra no encontrado.' });
    return;
  }

  res.json(extra);
});

app.post('/api/extras', async (req, res) => {
  const extra = await upsertExtra(req.body);
  res.status(201).json(extra);
});

app.put('/api/extras/:id', async (req, res) => {
  const extra = req.body;

  if (!extra || extra.id !== req.params.id) {
    res.status(400).json({ message: 'Extra invalido.' });
    return;
  }

  res.json(await upsertExtra(extra));
});

app.delete('/api/extras/:id', async (req, res) => {
  const deleted = await deleteExtra(req.params.id);

  if (!deleted) {
    res.status(404).json({ message: 'Extra no encontrado.' });
    return;
  }

  res.status(204).send();
});

app.post('/api/extras/reset', async (_req, res) => {
  await resetExtrasFromSeed();
  res.json(await listExtras());
});

app.get('/api/tables', async (_req, res) => {
  res.json(await listTables());
});

app.get('/api/tables/:id', async (req, res) => {
  const table = await getTableById(Number(req.params.id));

  if (!table) {
    res.status(404).json({ message: 'Mesa no encontrada.' });
    return;
  }

  res.json(table);
});

app.post('/api/tables', async (req, res) => {
  const table = await upsertTable(req.body);
  res.status(201).json(table);
});

app.put('/api/tables/:id', async (req, res) => {
  const table = req.body;

  if (!table || Number(table.id) !== Number(req.params.id)) {
    res.status(400).json({ message: 'Mesa invalida.' });
    return;
  }

  res.json(await upsertTable(table));
});

app.delete('/api/tables/:id', async (req, res) => {
  const deleted = await deleteTable(Number(req.params.id));

  if (!deleted) {
    res.status(404).json({ message: 'Mesa no encontrada.' });
    return;
  }

  res.status(204).send();
});

app.post('/api/tables/reset', async (_req, res) => {
  await resetTablesFromSeed();
  res.json(await listTables());
});

app.get('/api/orders', async (_req, res) => {
  res.json(await listOrders());
});

app.get('/api/expenses', async (_req, res) => {
  res.json(await listExpenses());
});

app.post('/api/expenses', async (req, res) => {
  const expense = req.body;

  if (!expense?.title || !expense?.amount || !expense?.expenseDate) {
    res.status(400).json({ message: 'Gasto invalido.' });
    return;
  }

  const created = await createExpense(expense);
  res.status(201).json(created);
});

app.delete('/api/expenses/:id', async (req, res) => {
  const deleted = await deleteExpenseRecord(Number(req.params.id));

  if (!deleted) {
    res.status(404).json({ message: 'Gasto no encontrado.' });
    return;
  }

  res.status(204).send();
});

app.get('/api/orders/:id', async (req, res) => {
  const order = await getOrderById(req.params.id);

  if (!order) {
    res.status(404).json({ message: 'Pedido no encontrado.' });
    return;
  }

  res.json(order);
});

app.post('/api/orders', async (req, res) => {
  const order = await createOrder(req.body);
  res.status(201).json(order);
});

app.patch('/api/orders/:id/status', async (req, res) => {
  const status = req.body?.status;

  if (!status) {
    res.status(400).json({ message: 'Status invalido.' });
    return;
  }

  const order = await updateOrderStatus(req.params.id, status);

  if (!order) {
    res.status(404).json({ message: 'Pedido no encontrado.' });
    return;
  }

  res.json(order);
});

app.post('/api/orders/clear-month', async (req, res) => {
  const monthKey = req.body?.monthKey;

  if (!monthKey) {
    res.status(400).json({ message: 'monthKey es obligatorio.' });
    return;
  }

  await clearOrdersByMonth(monthKey);
  res.json(await listOrders());
});

app.delete('/api/orders/:id', async (req, res) => {
  const deleted = await deleteOrder(req.params.id);

  if (!deleted) {
    res.status(404).json({ message: 'Pedido no encontrado.' });
    return;
  }

  res.status(204).send();
});

app.use((error, _req, res, _next) => {
  console.error('[menu-api]', error);
  res.status(500).json({
    message: 'Error interno al procesar el menu.',
    detail: error instanceof Error ? error.message : 'Unknown error'
  });
});

async function start() {
  await ensureSchema();
  await seedDefaultsIfEmpty();

  app.listen(port, () => {
    console.log(`[menu-api] running on http://localhost:${port}`);
  });
}

start().catch((error) => {
  console.error('[menu-api] failed to start', error);
  process.exit(1);
});
