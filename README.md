# Blacksushi

## Menu con MySQL local

La prioridad actual del proyecto es que el menu ya no dependa solo de `localStorage`.
Ahora existe una API local para productos del menu en `backend/server.js`, pensada para MySQL local.

### 1. Crear la base

Usa el script:

```sql
source backend/schema.sql;
```

O ejecuta manualmente:

```sql
CREATE DATABASE IF NOT EXISTS blacksushi CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
```

### 2. Variables de entorno

```bash
cp .env.example .env
```

Ajusta si hace falta:

```bash
MYSQL_HOST=127.0.0.1
MYSQL_PORT=3307
MYSQL_USER=root
MYSQL_PASSWORD=blacksushi
MYSQL_DATABASE=blacksushi
API_PORT=3001
```

### 3. Instalar dependencias

```bash
npm install
```

### 4. Levantar API y frontend

Terminal 1:

```bash
npm run start:api
```

Terminal 2:

```bash
npm run start:web
```

### 5. Tablas creadas

Base actual: `blacksushi`

Tablas creadas hoy:

- `products`
  - `id` `VARCHAR(120)` `PRIMARY KEY`
  - `name` `VARCHAR(180)` `NOT NULL`
  - `category` `VARCHAR(120)` `NOT NULL`
  - `description` `TEXT`
  - `price` `INT` `NOT NULL`
  - `active` `TINYINT(1)` `NOT NULL`
  - `ingredients` `JSON`
  - `allows_notes` `TINYINT(1)` `NOT NULL`
  - `allows_protein_change` `TINYINT(1)` `NOT NULL`
  - `available_extras` `JSON`
  - `created_at` `TIMESTAMP`
  - `updated_at` `TIMESTAMP`
- `extras`
  - `id` `VARCHAR(120)` `PRIMARY KEY`
  - `name` `VARCHAR(180)` `NOT NULL`
  - `price` `INT` `NOT NULL`
  - `type` `ENUM('extra', 'proteinChange')`
  - `created_at` `TIMESTAMP`
  - `updated_at` `TIMESTAMP`
- `tables_config`
  - `id` `INT` `PRIMARY KEY`
  - `name` `VARCHAR(120)` `NOT NULL`
  - `active` `TINYINT(1)` `NOT NULL`
  - `created_at` `TIMESTAMP`
  - `updated_at` `TIMESTAMP`
- `orders`
  - `id` `VARCHAR(120)` `PRIMARY KEY`
  - `total` `INT` `NOT NULL`
  - `order_type` `ENUM('local', 'retiro', 'delivery')`
  - `order_channel` `ENUM('mesa', 'retiro', 'delivery', 'uber_eats', 'pedidos_ya', 'rappi')`
  - `delivery_fee` `INT`
  - `table_number` `INT`
  - `customer_name` `VARCHAR(180)`
  - `status` `ENUM('pendiente', 'en_preparacion', 'listo', 'entregado')`
  - `created_at` `DATETIME`
  - `updated_at` `TIMESTAMP`
- `order_items`
  - `uid` `VARCHAR(120)` `PRIMARY KEY`
  - `order_id` `VARCHAR(120)` `FOREIGN KEY -> orders.id`
  - `product_id` `VARCHAR(120)` `NOT NULL`
  - `name` `VARCHAR(180)` `NOT NULL`
  - `description` `TEXT`
  - `quantity` `INT` `NOT NULL`
  - `unit_price` `INT` `NOT NULL`
  - `subtotal` `INT` `NOT NULL`
  - `notes` `TEXT`
  - `created_at` `TIMESTAMP`
  - `updated_at` `TIMESTAMP`
- `order_item_extras`
  - `id` `BIGINT` `AUTO_INCREMENT PRIMARY KEY`
  - `order_item_uid` `VARCHAR(120)` `FOREIGN KEY -> order_items.uid`
  - `extra_id` `VARCHAR(120)` `NOT NULL`
  - `name` `VARCHAR(180)` `NOT NULL`
  - `price` `INT` `NOT NULL`
  - `type` `ENUM('extra', 'proteinChange')`
  - `quantity` `INT` `NOT NULL`
  - `created_at` `TIMESTAMP`
- `order_item_sauces`
  - `id` `BIGINT` `AUTO_INCREMENT PRIMARY KEY`
  - `order_item_uid` `VARCHAR(120)` `FOREIGN KEY -> order_items.uid`
  - `name` `ENUM('Soya', 'Agridulce', 'Acevichada')`
  - `quantity` `INT` `NOT NULL`
  - `created_at` `TIMESTAMP`

Uso actual:

- `products` es la fuente de verdad del menú en el frontend actual
- `extras` y `tables_config` ya tienen seed automático desde los archivos base del frontend
- `orders`, `order_items`, `order_item_extras` y `order_item_sauces` ya están listos para persistir pedidos reales
- el seed inicial sale desde:
  - [products.ts](/Users/manuelyefipavez/Documents/BlackSushi/blacksushi/src/app/core/data/products.ts:1)
  - [menu-options.ts](/Users/manuelyefipavez/Documents/BlackSushi/blacksushi/src/app/core/data/menu-options.ts:1)
  - [order-channels.ts](/Users/manuelyefipavez/Documents/BlackSushi/blacksushi/src/app/core/data/order-channels.ts:1)

Tablas aún no creadas, pero recomendadas si seguimos creciendo:

- `roles` o `users`
- `payments`
- `order_status_history`
- `kitchen_tickets`

### 6. Servicios REST

Servicios REST simples ya implementados:

- Menú
  - `GET /api/menu/products`
  - `GET /api/menu/products/:id`
  - `POST /api/menu/products`
  - `PUT /api/menu/products/:id`
  - `DELETE /api/menu/products/:id`
  - `POST /api/menu/reset`
- Extras
  - `GET /api/extras`
  - `GET /api/extras/:id`
  - `POST /api/extras`
  - `PUT /api/extras/:id`
  - `DELETE /api/extras/:id`
- Mesas
  - `GET /api/tables`
  - `GET /api/tables/:id`
  - `POST /api/tables`
  - `PUT /api/tables/:id`
  - `DELETE /api/tables/:id`
- Pedidos
- `GET /api/orders`
- `GET /api/orders/:id`
- `POST /api/orders`
- `PATCH /api/orders/:id/status`
  - `DELETE /api/orders/:id`

Operaciones que normalmente necesitaremos cubrir:

- consumir data para catálogo y paneles admin
- insertar nuevos productos/extras/mesas
- modificar precio, disponibilidad, descripción y configuración
- eliminar registros cuando el negocio lo permita
- reinicializar catálogos base

Si la API local no responde, el frontend usa temporalmente el menu base para no bloquear la operacion.

This project was generated using [Angular CLI](https://github.com/angular/angular-cli) version 21.2.2.

## Development server

To start a local development server, run:

```bash
ng serve
```

Once the server is running, open your browser and navigate to `http://localhost:4200/`. The application will automatically reload whenever you modify any of the source files.

## Code scaffolding

Angular CLI includes powerful code scaffolding tools. To generate a new component, run:

```bash
ng generate component component-name
```

For a complete list of available schematics (such as `components`, `directives`, or `pipes`), run:

```bash
ng generate --help
```

## Building

To build the project run:

```bash
ng build
```

This will compile your project and store the build artifacts in the `dist/` directory. By default, the production build optimizes your application for performance and speed.

## Running unit tests

To execute unit tests with the [Vitest](https://vitest.dev/) test runner, use the following command:

```bash
ng test
```

## Running end-to-end tests

For end-to-end (e2e) testing, run:

```bash
ng e2e
```

Angular CLI does not come with an end-to-end testing framework by default. You can choose one that suits your needs.

## Additional Resources

For more information on using the Angular CLI, including detailed command references, visit the [Angular CLI Overview and Command Reference](https://angular.dev/tools/cli) page.
